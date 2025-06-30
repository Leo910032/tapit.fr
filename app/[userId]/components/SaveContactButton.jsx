// app/[userId]/components/SaveContactButton.jsx - DIRECT SAVE METHODS
"use client"
import { useState, useEffect } from 'react';
import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "@/lib/useTranslation";
import { FaAddressCard, FaShare, FaDownload, FaCopy, FaQrcode } from "react-icons/fa6";
import { toast } from 'react-hot-toast';

export default function SaveContactButton({ userId }) {
    const { t } = useTranslation();
    const [contactData, setContactData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showOptions, setShowOptions] = useState(false);

    useEffect(() => {
        async function fetchContactData() {
            try {
                const currentUser = await fetchUserData(userId);
                if (!currentUser) {
                    setIsLoading(false);
                    return;
                }

                const collectionRef = collection(fireApp, "AccountData");
                const docRef = doc(collectionRef, `${currentUser}`);

                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        
                        const contact = {
                            displayName: data.displayName || '',
                            email: data.email || '',
                            phone: data.phone || '',
                            website: data.website || '',
                            company: data.company || '',
                            profilePhoto: data.profilePhoto || '',
                            bio: data.bio || ''
                        };
                        
                        const hasData = contact.displayName || contact.email || contact.phone || contact.website;
                        if (hasData) {
                            setContactData(contact);
                        } else {
                            setContactData(null);
                        }
                    } else {
                        setContactData(null);
                    }
                    setIsLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error fetching contact data:", error);
                setIsLoading(false);
            }
        }

        fetchContactData();
    }, [userId]);

    // Generate vCard
    const generateVCard = () => {
        if (!contactData) return '';

        const escapeVCardValue = (value) => {
            if (!value) return '';
            return value
                .replace(/\\/g, '\\\\')
                .replace(/,/g, '\\,')
                .replace(/;/g, '\\;')
                .replace(/\n/g, '\\n')
                .replace(/\r/g, '');
        };

        let vcard = 'BEGIN:VCARD\r\nVERSION:3.0\r\n';
        
        if (contactData.displayName) {
            const name = escapeVCardValue(contactData.displayName);
            vcard += `FN:${name}\r\n`;
            vcard += `N:${name};;;;\r\n`;
        }
        
        if (contactData.email) {
            vcard += `EMAIL:${escapeVCardValue(contactData.email)}\r\n`;
        }
        
        if (contactData.phone) {
            vcard += `TEL:${escapeVCardValue(contactData.phone)}\r\n`;
        }
        
        if (contactData.website) {
            const websiteUrl = contactData.website.startsWith('http') 
                ? contactData.website 
                : `https://${contactData.website}`;
            vcard += `URL:${escapeVCardValue(websiteUrl)}\r\n`;
        }
        
        if (contactData.company) {
            vcard += `ORG:${escapeVCardValue(contactData.company)}\r\n`;
        }
        
        if (contactData.bio) {
            vcard += `NOTE:${escapeVCardValue(contactData.bio)}\r\n`;
        }
        
        if (contactData.profilePhoto && contactData.profilePhoto.startsWith('http')) {
            vcard += `PHOTO:${contactData.profilePhoto}\r\n`;
        }
        
        vcard += 'END:VCARD';
        return vcard;
    };

    // 🚀 METHOD 1: Direct Intent URLs (Most Direct!)
    const handleDirectIntentSave = () => {
        const isAndroid = /Android/i.test(navigator.userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        
        if (isAndroid) {
            try {
                // Android Intent to add contact directly
                const intentData = {
                    action: 'android.intent.action.INSERT',
                    type: 'vnd.android.cursor.dir/contact',
                    extras: {
                        'name': contactData.displayName || '',
                        'email': contactData.email || '',
                        'phone': contactData.phone || '',
                        'company': contactData.company || '',
                        'notes': contactData.bio || ''
                    }
                };
                
                // Build intent URL
                let intentUrl = `intent://contacts/people/#Intent;action=${intentData.action};type=${intentData.type}`;
                
                if (contactData.displayName) {
                    intentUrl += `;S.name=${encodeURIComponent(contactData.displayName)}`;
                }
                if (contactData.email) {
                    intentUrl += `;S.email=${encodeURIComponent(contactData.email)}`;
                }
                if (contactData.phone) {
                    intentUrl += `;S.phone=${encodeURIComponent(contactData.phone)}`;
                }
                if (contactData.company) {
                    intentUrl += `;S.company=${encodeURIComponent(contactData.company)}`;
                }
                
                intentUrl += ';end';
                
                console.log('🤖 Trying Android intent:', intentUrl);
                window.location.href = intentUrl;
                
                toast.success('🤖 Opening Android Contacts app...', {
                    duration: 3000
                });
                
                return true;
            } catch (error) {
                console.error('❌ Android intent failed:', error);
                return false;
            }
        }
        
        if (isIOS) {
            try {
                // iOS: Try to use contact: scheme (limited support)
                const contactUrl = `contact://add?name=${encodeURIComponent(contactData.displayName || '')}&email=${encodeURIComponent(contactData.email || '')}&phone=${encodeURIComponent(contactData.phone || '')}`;
                
                console.log('🍎 Trying iOS contact scheme:', contactUrl);
                window.location.href = contactUrl;
                
                // Fallback to vCard data URL after short delay
                setTimeout(() => {
                    handleVCardDataURL();
                }, 1000);
                
                toast.success('🍎 Opening iOS Contacts...', {
                    duration: 3000
                });
                
                return true;
            } catch (error) {
                console.error('❌ iOS contact scheme failed:', error);
                return false;
            }
        }
        
        return false;
    };

    // 🚀 METHOD 2: Enhanced vCard Data URL (Fallback)
    const handleVCardDataURL = () => {
        try {
            const vCardContent = generateVCard();
            const dataURL = `data:text/vcard;charset=utf-8,${encodeURIComponent(vCardContent)}`;
            
            // Create invisible link and trigger
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `${contactData.displayName || 'contact'}.vcf`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            
            // For mobile browsers, try direct navigation first
            if (/iPhone|iPad|iPod|Android/i.test(navigator.userAgent)) {
                // Try direct navigation to data URL
                window.location.href = dataURL;
                
                // Fallback to download after delay
                setTimeout(() => {
                    link.click();
                }, 500);
            } else {
                // Desktop: direct download
                link.click();
            }
            
            document.body.removeChild(link);
            
            toast.success('📱 Contact ready! Tap to open with Contacts app', {
                duration: 4000,
                icon: '📲'
            });
            
        } catch (error) {
            console.error('❌ vCard data URL failed:', error);
            handleCopyContact();
        }
    };

    // 🚀 METHOD 3: Web Share API with vCard File
    const handleWebShareAPI = async () => {
        if (!navigator.share) {
            return false;
        }
        
        try {
            const vCardContent = generateVCard();
            const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
            const file = new File([blob], `${contactData.displayName || 'contact'}.vcf`, { 
                type: 'text/vcard' 
            });

            // Check if files can be shared
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Add ${contactData.displayName || 'Contact'}`,
                    text: `Save ${contactData.displayName || 'this contact'} to your contacts`,
                    files: [file]
                });
                
                toast.success('📤 Contact shared! Choose "Save to Contacts"', {
                    duration: 4000
                });
                
                return true;
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('❌ Web Share API failed:', error);
            }
        }
        
        return false;
    };

    // 🚀 METHOD 4: QR Code for Instant Scan
    const handleQRCodeSave = () => {
        try {
            const vCardContent = generateVCard();
            
            // Create fullscreen QR overlay
            const overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0,0,0,0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 10000;
                backdrop-filter: blur(10px);
            `;
            
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(vCardContent)}`;
            
            overlay.innerHTML = `
                <div style="
                    background: white;
                    padding: 30px;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 90%;
                    box-shadow: 0 20px 40px rgba(0,0,0,0.3);
                ">
                    <h2 style="margin: 0 0 20px 0; color: #333;">📱 Scan to Save Contact</h2>
                    <img src="${qrUrl}" alt="QR Code" style="
                        max-width: 100%;
                        border-radius: 10px;
                        margin: 20px 0;
                    "/>
                    <p style="margin: 20px 0; color: #666;">
                        Scan with another phone's camera to instantly add<br>
                        <strong style="color: #10B981;">${contactData.displayName || 'this contact'}</strong> to contacts
                    </p>
                    <button onclick="this.parentElement.parentElement.remove()" style="
                        background: #10B981;
                        color: white;
                        border: none;
                        padding: 12px 24px;
                        border-radius: 10px;
                        font-size: 16px;
                        cursor: pointer;
                        margin-top: 10px;
                    ">Close</button>
                </div>
            `;
            
            document.body.appendChild(overlay);
            
            // Auto-remove after 30 seconds
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.remove();
                }
            }, 30000);
            
            toast.success('📱 Use another phone to scan the QR code!', {
                duration: 3000
            });
            
        } catch (error) {
            console.error('❌ QR Code failed:', error);
            toast.error('Failed to generate QR code');
        }
    };

    // 🎯 SMART SAVE: Try multiple methods in order of directness
    const handleSmartSave = async () => {
        console.log('🎯 Starting smart save sequence...');
        
        // Method 1: Try direct intent URLs (most direct)
        if (handleDirectIntentSave()) {
            console.log('✅ Direct intent method used');
            return;
        }
        
        // Method 2: Try Web Share API
        if (await handleWebShareAPI()) {
            console.log('✅ Web Share API method used');
            return;
        }
        
        // Method 3: Fallback to enhanced data URL
        console.log('🔄 Falling back to data URL method');
        handleVCardDataURL();
    };

    // Copy contact (always available fallback)
    const handleCopyContact = async () => {
        try {
            const contactText = [
                contactData.displayName && `Name: ${contactData.displayName}`,
                contactData.email && `Email: ${contactData.email}`,
                contactData.phone && `Phone: ${contactData.phone}`,
                contactData.website && `Website: ${contactData.website}`,
                contactData.company && `Company: ${contactData.company}`,
                contactData.bio && `Bio: ${contactData.bio}`
            ].filter(Boolean).join('\n');

            await navigator.clipboard.writeText(contactText);
            toast.success('📋 Contact info copied to clipboard!');
        } catch (error) {
            console.error('Copy error:', error);
            toast.error('Failed to copy contact info');
        }
    };

    if (isLoading || !contactData) {
        return null;
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    return (
        <div className="relative">
            <div className="flex gap-2">
                {/* 🎯 MAIN SMART SAVE BUTTON */}
                <button
                    onClick={handleSmartSave}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-3 md:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                    <FaAddressCard className="w-5 h-5 flex-shrink-0" />
                    
                    {/* Desktop text */}
                    <span className="hidden md:block">
                        Add to Contacts
                    </span>
                    
                    {/* Mobile text */}
                    <span className="block md:hidden text-sm">
                        Add
                    </span>
                    
                    <svg className="w-4 h-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                </button>

                {/* OPTIONS MENU */}
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg transition-colors relative"
                    title="More save options"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            </div>

            {/* ADVANCED OPTIONS MENU */}
            {showOptions && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border z-50 min-w-[250px] overflow-hidden">
                    <div className="py-2">
                        
                        {/* QR Code Option */}
                        <button
                            onClick={() => {
                                handleQRCodeSave();
                                setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <FaQrcode className="w-4 h-4 text-blue-600" />
                            <div>
                                <span className="text-sm font-medium">QR Code</span>
                                <p className="text-xs text-gray-500">Scan with another phone</p>
                            </div>
                        </button>

                        {/* Web Share Option (if available) */}
                        {navigator.share && (
                            <button
                                onClick={() => {
                                    handleWebShareAPI();
                                    setShowOptions(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                            >
                                <FaShare className="w-4 h-4 text-green-600" />
                                <div>
                                    <span className="text-sm font-medium">Share Contact</span>
                                    <p className="text-xs text-gray-500">Use device sharing</p>
                                </div>
                            </button>
                        )}

                        {/* Download vCard */}
                        <button
                            onClick={() => {
                                handleVCardDataURL();
                                setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <FaDownload className="w-4 h-4 text-purple-600" />
                            <div>
                                <span className="text-sm font-medium">Download vCard</span>
                                <p className="text-xs text-gray-500">Save file to device</p>
                            </div>
                        </button>

                        {/* Copy Info */}
                        <button
                            onClick={() => {
                                handleCopyContact();
                                setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <FaCopy className="w-4 h-4 text-orange-600" />
                            <div>
                                <span className="text-sm font-medium">Copy Info</span>
                                <p className="text-xs text-gray-500">Copy to clipboard</p>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Close overlay */}
            {showOptions && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowOptions(false)}
                />
            )}
        </div>
    );
}