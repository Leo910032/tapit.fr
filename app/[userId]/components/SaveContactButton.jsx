// app/[userId]/components/SaveContactButton.jsx - ULTRA-COMPATIBLE VERSION
"use client"
import { useState, useEffect } from 'react';
import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "@/lib/useTranslation";
import { FaAddressCard, FaShare, FaDownload } from "react-icons/fa6";
import { toast } from 'react-hot-toast';

export default function SaveContactButton({ userId }) {
    const { t } = useTranslation();
    const [contactData, setContactData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showOptions, setShowOptions] = useState(false);
    const [deviceInfo, setDeviceInfo] = useState({});

    useEffect(() => {
        // Detect device capabilities on mount
        const userAgent = navigator.userAgent;
        const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
        const isIOS = /iPad|iPhone|iPod/.test(userAgent);
        const isAndroid = /Android/.test(userAgent);
        const hasNativeShare = !!navigator.share;
        const canShareFiles = navigator.canShare ? navigator.canShare({ files: [] }) : false;

        setDeviceInfo({
            isMobile,
            isIOS,
            isAndroid,
            hasNativeShare,
            canShareFiles,
            userAgent
        });

        console.log('Device capabilities:', {
            isMobile,
            isIOS,
            isAndroid,
            hasNativeShare,
            canShareFiles
        });
    }, []);

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
        
        vcard += 'END:VCARD';
        return vcard;
    };

    // Generate contact text for sharing/copying
    const generateContactText = () => {
        const parts = [
            contactData.displayName && `📝 ${contactData.displayName}`,
            contactData.email && `📧 ${contactData.email}`,
            contactData.phone && `📱 ${contactData.phone}`,
            contactData.website && `🌐 ${contactData.website}`,
            contactData.company && `🏢 ${contactData.company}`,
            contactData.bio && `💬 ${contactData.bio}`
        ].filter(Boolean);
        
        return parts.join('\n');
    };

    // 🔥 NEW: iOS-specific contact URL method
    const handleIOSContactAdd = () => {
        try {
            // Create a special contact URL for iOS
            const params = new URLSearchParams();
            
            if (contactData.displayName) {
                params.append('name', contactData.displayName);
            }
            if (contactData.email) {
                params.append('email', contactData.email);
            }
            if (contactData.phone) {
                params.append('phone', contactData.phone);
            }
            if (contactData.website) {
                params.append('url', contactData.website);
            }
            if (contactData.company) {
                params.append('organization', contactData.company);
            }

            // Try multiple iOS methods
            const contactUrl = `tel:${contactData.phone || contactData.email || ''}`;
            
            // Method 1: Try to create and download vCard
            const vCardContent = generateVCard();
            const blob = new Blob([vCardContent], { type: 'text/vcard' });
            const url = URL.createObjectURL(blob);
            
            // Create a temporary link
            const link = document.createElement('a');
            link.href = url;
            link.download = `${contactData.displayName || 'contact'}.vcf`;
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            toast.success('Contact file downloaded! Open it to add to your contacts.', {
                duration: 5000,
                icon: '📱'
            });
        } catch (error) {
            console.error('iOS contact add failed:', error);
            handleTextShare();
        }
    };

    // 🔥 NEW: Text-only sharing (most compatible)
    const handleTextShare = async () => {
        try {
            const contactText = generateContactText();
            
            if (deviceInfo.hasNativeShare) {
                await navigator.share({
                    title: `Contact: ${contactData.displayName || 'Unknown'}`,
                    text: contactText
                });
                toast.success('Contact shared!');
            } else {
                // Fallback to copying
                await navigator.clipboard.writeText(contactText);
                toast.success('Contact copied to clipboard!');
            }
        } catch (error) {
            console.error('Text share failed:', error);
            // Final fallback
            handleCopyContact();
        }
    };

    // Standard download for desktop
    const handleDesktopDownload = () => {
        try {
            const vCardContent = generateVCard();
            const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${contactData.displayName || 'contact'}.vcf`;
            
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            toast.success('Contact downloaded successfully!');
        } catch (error) {
            console.error('Desktop download failed:', error);
            toast.error('Download failed. Try copying the contact info instead.');
        }
    };

    // Copy contact info
    const handleCopyContact = async () => {
        try {
            const contactText = generateContactText();
            await navigator.clipboard.writeText(contactText);
            toast.success('Contact info copied to clipboard!');
        } catch (error) {
            console.error('Copy failed:', error);
            // Ultimate fallback
            try {
                const textArea = document.createElement('textarea');
                textArea.value = generateContactText();
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                toast.success('Contact info copied!');
            } catch (fallbackError) {
                toast.error('Unable to copy. Please manually save the contact info.');
            }
        }
    };

    // Enhanced QR Code
    const handleShowQR = () => {
        try {
            const vCardContent = generateVCard();
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(vCardContent)}`;
            
            const popup = window.open('', '_blank', 'width=350,height=450,scrollbars=no,resizable=no');
            if (popup) {
                popup.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>QR Code - ${contactData.displayName || 'Contact'}</title>
                        <meta name="viewport" content="width=device-width, initial-scale=1">
                        <style>
                            body { 
                                margin: 0; 
                                padding: 20px; 
                                text-align: center; 
                                font-family: Arial, sans-serif;
                                background: #f5f5f5;
                            }
                            .container {
                                background: white;
                                padding: 20px;
                                border-radius: 10px;
                                box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                                max-width: 300px;
                                margin: 0 auto;
                            }
                            img { 
                                width: 100%; 
                                height: auto;
                                border: 1px solid #ddd;
                                border-radius: 8px;
                            }
                            h3 { margin-top: 0; color: #333; font-size: 18px; }
                            p { color: #666; font-size: 14px; line-height: 1.4; }
                            .instructions {
                                background: #e8f5e8;
                                padding: 10px;
                                border-radius: 6px;
                                margin-top: 15px;
                                font-size: 12px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h3>📱 Scan to Save Contact</h3>
                            <img src="${qrUrl}" alt="QR Code" onerror="this.src='data:image/svg+xml,<svg xmlns=\\"http://www.w3.org/2000/svg\\" width=\\"200\\" height=\\"200\\"><rect width=\\"200\\" height=\\"200\\" fill=\\"%23f0f0f0\\"/><text x=\\"100\\" y=\\"100\\" text-anchor=\\"middle\\" dy=\\".3em\\">QR Code Loading...</text></svg>'" />
                            <p><strong>${contactData.displayName || 'Contact'}</strong></p>
                            <div class="instructions">
                                <strong>📲 How to use:</strong><br>
                                1. Open your camera app<br>
                                2. Point at the QR code<br>
                                3. Tap the notification to add contact
                            </div>
                        </div>
                    </body>
                    </html>
                `);
                popup.document.close();
            }
            
            toast.success('QR code opened! Scan with your phone camera.', {
                duration: 4000
            });
        } catch (error) {
            console.error('QR generation failed:', error);
            toast.error('Failed to generate QR code');
        }
    };

    // 🔥 SMART MAIN ACTION - Platform optimized
    const handleSmartAction = () => {
        console.log('Smart action triggered with device info:', deviceInfo);
        
        if (deviceInfo.isIOS) {
            // iOS: Try vCard download first
            handleIOSContactAdd();
        } else if (deviceInfo.isAndroid) {
            // Android: Try text sharing first
            handleTextShare();
        } else if (deviceInfo.isMobile) {
            // Other mobile: Text sharing
            handleTextShare();
        } else {
            // Desktop: Direct download
            handleDesktopDownload();
        }
    };

    if (isLoading || !contactData) {
        return null;
    }

    // Determine button text and icon based on device
    const getButtonConfig = () => {
        if (deviceInfo.isIOS) {
            return {
                text: 'Add to Contacts',
                subtext: 'Download vCard file',
                icon: <FaDownload className="w-4 h-4" />
            };
        } else if (deviceInfo.isMobile) {
            return {
                text: deviceInfo.hasNativeShare ? 'Share Contact' : 'Copy Contact',
                subtext: `Add ${contactData.displayName || 'contact'}`,
                icon: deviceInfo.hasNativeShare ? <FaShare className="w-4 h-4" /> : <FaAddressCard className="w-4 h-4" />
            };
        } else {
            return {
                text: 'Save Contact',
                subtext: 'Download vCard file',
                icon: <FaDownload className="w-4 h-4" />
            };
        }
    };

    const buttonConfig = getButtonConfig();

    return (
        <div className="w-full px-5 mb-4 relative">
            <div className="flex gap-2">
                {/* MAIN SMART BUTTON */}
                <button
                    onClick={handleSmartAction}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                    <FaAddressCard className="w-5 h-5" />
                    <div className="flex-1 text-center">
                        <div className="text-sm font-semibold">
                            {buttonConfig.text}
                        </div>
                        <div className="text-xs opacity-90">
                            {buttonConfig.subtext}
                        </div>
                    </div>
                    {buttonConfig.icon}
                </button>

                {/* OPTIONS MENU */}
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg transition-colors relative"
                    title="More options"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            </div>

            {/* OPTIONS DROPDOWN */}
            {showOptions && (
                <div className="absolute right-5 top-full mt-2 bg-white rounded-lg shadow-lg border z-50 min-w-[220px] overflow-hidden">
                    <div className="py-2">
                        {/* Share Text Option */}
                        <button
                            onClick={() => {
                                handleTextShare();
                                setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <FaShare className="w-4 h-4 text-blue-600" />
                            <div>
                                <div className="text-sm font-medium">Share Contact Info</div>
                                <div className="text-xs text-gray-500">Share as text</div>
                            </div>
                        </button>

                        {/* Download vCard Option */}
                        <button
                            onClick={() => {
                                if (deviceInfo.isMobile) {
                                    handleIOSContactAdd();
                                } else {
                                    handleDesktopDownload();
                                }
                                setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <FaDownload className="w-4 h-4 text-green-600" />
                            <div>
                                <div className="text-sm font-medium">Download vCard</div>
                                <div className="text-xs text-gray-500">Save as .vcf file</div>
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
                            <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                            <div>
                                <div className="text-sm font-medium">Copy to Clipboard</div>
                                <div className="text-xs text-gray-500">Copy contact details</div>
                            </div>
                        </button>

                        {/* QR Code Option */}
                        <button
                            onClick={() => {
                                handleShowQR();
                                setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                            </svg>
                            <div>
                                <div className="text-sm font-medium">Show QR Code</div>
                                <div className="text-xs text-gray-500">Scan to add contact</div>
                            </div>
                        </button>
                    </div>
                </div>
            )}

            {/* Close menu overlay */}
            {showOptions && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowOptions(false)}
                />
            )}
        </div>
    );
}