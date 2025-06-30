// app/[userId]/components/SaveContactButton.jsx - VRAIMENT FONCTIONNEL
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

    // Generate clean vCard
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

    // 🔥 METHOD 1: Mobile Web Share API (MOST RELIABLE)
    const handleWebShareAPI = async () => {
        if (!navigator.share) {
            console.log('❌ Web Share API not available');
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
                console.log('✅ Sharing vCard file via Web Share API');
                
                await navigator.share({
                    title: `Add ${contactData.displayName || 'Contact'}`,
                    text: `Save contact to your phone`,
                    files: [file]
                });
                
                toast.success('📤 Select "Contacts" or "Add to Contacts" from the menu!', {
                    duration: 5000,
                    style: {
                        background: '#10B981',
                        color: 'white',
                    }
                });
                
                return true;
            } else {
                // Fallback: share as text
                const contactText = [
                    contactData.displayName && `📱 ${contactData.displayName}`,
                    contactData.email && `📧 ${contactData.email}`,
                    contactData.phone && `☎️ ${contactData.phone}`,
                    contactData.website && `🌐 ${contactData.website}`,
                    contactData.company && `🏢 ${contactData.company}`
                ].filter(Boolean).join('\n');

                await navigator.share({
                    title: `Contact: ${contactData.displayName || 'Unknown'}`,
                    text: contactText
                });
                
                toast.success('📤 Contact info shared!', {
                    duration: 3000
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

    // 🔥 METHOD 2: Optimized vCard Download (WORKS EVERYWHERE)
    const handleOptimizedDownload = () => {
        try {
            const vCardContent = generateVCard();
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            
            if (isMobile) {
                // Mobile: Use data URL for direct opening
                const dataURL = `data:text/vcard;charset=utf-8,${encodeURIComponent(vCardContent)}`;
                
                // Try multiple approaches
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = `${contactData.displayName || 'contact'}.vcf`;
                
                // Method 1: Direct navigation (works in many mobile browsers)
                try {
                    window.open(dataURL, '_self');
                    
                    toast.success('📱 Tap "Open with Contacts" when prompted!', {
                        duration: 6000,
                        style: {
                            background: '#3B82F6',
                            color: 'white',
                        }
                    });
                    
                    return true;
                } catch (error) {
                    console.log('Direct navigation failed, trying download...');
                }
                
                // Method 2: Download fallback
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                toast.success('📥 Download complete! Tap the file to add to contacts', {
                    duration: 5000,
                    style: {
                        background: '#059669',
                        color: 'white',
                    }
                });
                
            } else {
                // Desktop: Blob download
                const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `${contactData.displayName || 'contact'}.vcf`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => URL.revokeObjectURL(url), 100);
                
                toast.success('📥 File downloaded! Double-click to add to contacts', {
                    duration: 4000
                });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Optimized download failed:', error);
            return false;
        }
    };

    // 🔥 METHOD 3: Interactive QR Code Modal
    const handleInteractiveQR = () => {
        try {
            const vCardContent = generateVCard();
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(vCardContent)}`;
            
            // Create modal overlay
            const modal = document.createElement('div');
            modal.style.cssText = `
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
                animation: fadeIn 0.3s ease;
            `;
            
            modal.innerHTML = `
                <style>
                    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                    @keyframes slideUp { from { transform: translateY(50px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
                </style>
                <div style="
                    background: white;
                    padding: 40px;
                    border-radius: 25px;
                    text-align: center;
                    max-width: 90%;
                    max-height: 90%;
                    box-shadow: 0 25px 50px rgba(0,0,0,0.3);
                    animation: slideUp 0.4s ease;
                    overflow-y: auto;
                ">
                    <div style="margin-bottom: 30px;">
                        <div style="
                            width: 60px;
                            height: 60px;
                            background: linear-gradient(135deg, #10B981, #059669);
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            margin: 0 auto 20px;
                        ">
                            <svg width="30" height="30" fill="white" viewBox="0 0 24 24">
                                <path d="M3 5h2V3c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2v2h2c1.1 0 2 .9 2 2v11c0 1.1-.9 2-2 2H3c-1.1 0-2-.9-2-2V7c0-1.1.9-2 2-2zm4-2v2h10V3H7zm-2 6h14v9H5V9z"/>
                            </svg>
                        </div>
                        <h2 style="margin: 0 0 10px 0; color: #1F2937; font-size: 28px; font-weight: bold;">
                            📱 Instant Contact Save
                        </h2>
                        <p style="color: #6B7280; font-size: 16px; margin: 0;">
                            Scan with your phone camera to instantly add<br>
                            <strong style="color: #10B981; font-size: 18px;">${contactData.displayName || 'this contact'}</strong> to your contacts
                        </p>
                    </div>
                    
                    <div style="
                        background: linear-gradient(135deg, #F3F4F6, #E5E7EB);
                        padding: 20px;
                        border-radius: 15px;
                        margin: 20px 0;
                    ">
                        <img src="${qrUrl}" alt="Contact QR Code" style="
                            max-width: 100%;
                            border-radius: 10px;
                            box-shadow: 0 10px 25px rgba(0,0,0,0.1);
                        "/>
                    </div>
                    
                    <div style="
                        background: #F0FDF4;
                        border: 2px solid #10B981;
                        border-radius: 10px;
                        padding: 15px;
                        margin: 20px 0;
                        text-align: left;
                    ">
                        <h4 style="margin: 0 0 10px 0; color: #059669; font-size: 16px;">📋 How to use:</h4>
                        <div style="color: #065F46; font-size: 14px; line-height: 1.5;">
                            1. Open your phone's <strong>Camera app</strong><br>
                            2. Point it at the QR code above<br>
                            3. Tap the notification that appears<br>
                            4. Choose <strong>"Add to Contacts"</strong> ✅
                        </div>
                    </div>
                    
                    <div style="display: flex; gap: 15px; margin-top: 30px;">
                        <button onclick="this.closest('[style*=\"position: fixed\"]').remove()" style="
                            flex: 1;
                            background: #6B7280;
                            color: white;
                            border: none;
                            padding: 15px 25px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='#4B5563'" onmouseout="this.style.background='#6B7280'">
                            Close
                        </button>
                        <button onclick="
                            navigator.clipboard.writeText('${vCardContent.replace(/'/g, "\\'")}').then(() => {
                                this.innerHTML = '✅ Copied!';
                                this.style.background = '#059669';
                                setTimeout(() => {
                                    this.innerHTML = '📋 Copy vCard';
                                    this.style.background = '#3B82F6';
                                }, 2000);
                            });
                        " style="
                            flex: 1;
                            background: #3B82F6;
                            color: white;
                            border: none;
                            padding: 15px 25px;
                            border-radius: 12px;
                            font-size: 16px;
                            font-weight: 600;
                            cursor: pointer;
                            transition: all 0.2s;
                        " onmouseover="this.style.background='#2563EB'" onmouseout="this.style.background='#3B82F6'">
                            📋 Copy vCard
                        </button>
                    </div>
                </div>
            `;
            
            document.body.appendChild(modal);
            
            // Auto-remove after 2 minutes
            setTimeout(() => {
                if (modal.parentNode) {
                    modal.remove();
                }
            }, 120000);
            
            toast.success('📱 Use any phone camera to scan the QR code!', {
                duration: 4000,
                style: {
                    background: '#7C3AED',
                    color: 'white',
                }
            });
            
        } catch (error) {
            console.error('❌ QR Code failed:', error);
            toast.error('Failed to generate QR code');
        }
    };

    // 🎯 SMART SAVE: Prioritize working methods
    const handleSmartSave = async () => {
        console.log('🎯 Starting smart save...');
        
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            // Mobile: Try Web Share API first (most reliable on mobile)
            if (await handleWebShareAPI()) {
                console.log('✅ Web Share API succeeded');
                return;
            }
            
            console.log('🔄 Web Share failed, trying optimized download...');
            handleOptimizedDownload();
        } else {
            // Desktop: Show QR code (best experience for desktop users)
            handleInteractiveQR();
        }
    };

    // Copy contact info
    const handleCopyContact = async () => {
        try {
            const contactText = [
                contactData.displayName && `📱 Name: ${contactData.displayName}`,
                contactData.email && `📧 Email: ${contactData.email}`,
                contactData.phone && `☎️ Phone: ${contactData.phone}`,
                contactData.website && `🌐 Website: ${contactData.website}`,
                contactData.company && `🏢 Company: ${contactData.company}`,
                contactData.bio && `📝 Bio: ${contactData.bio}`
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

    return (
        <div className="relative">
            <div className="flex gap-2">
                {/* 🎯 SMART SAVE BUTTON */}
                <button
                    onClick={handleSmartSave}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-3 md:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                    <FaAddressCard className="w-5 h-5 flex-shrink-0" />
                    
                    {/* Responsive text */}
                    <span className="hidden md:block">
                        Add to Contacts
                    </span>
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

            {/* OPTIONS MENU */}
            {showOptions && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border z-50 min-w-[250px] overflow-hidden">
                    <div className="py-2">
                        
                        {/* QR Code Option */}
                        <button
                            onClick={() => {
                                handleInteractiveQR();
                                setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <FaQrcode className="w-4 h-4 text-blue-600" />
                            <div>
                                <span className="text-sm font-medium">QR Code Scanner</span>
                                <p className="text-xs text-gray-500">Instant save via camera</p>
                            </div>
                        </button>

                        {/* Web Share Option */}
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
                                    <p className="text-xs text-gray-500">Use device sharing menu</p>
                                </div>
                            </button>
                        )}

                        {/* Download Option */}
                        <button
                            onClick={() => {
                                handleOptimizedDownload();
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

                        {/* Copy Option */}
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