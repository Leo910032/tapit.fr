// app/[userId]/components/SaveContactButton.jsx - FIXED VERSION
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

    // 🔧 FIXED: Better vCard generation with proper escaping
    const generateVCard = () => {
        if (!contactData) return '';

        // Helper function to escape vCard values
        const escapeVCardValue = (value) => {
            if (!value) return '';
            return value
                .replace(/\\/g, '\\\\')  // Escape backslashes
                .replace(/,/g, '\\,')    // Escape commas
                .replace(/;/g, '\\;')    // Escape semicolons
                .replace(/\n/g, '\\n')   // Escape newlines
                .replace(/\r/g, '');     // Remove carriage returns
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

    // 🔧 FIXED: Improved native share with better error handling
    const handleNativeShare = async () => {
        if (!navigator.share) {
            toast.error('Sharing not supported on this device');
            return;
        }

        try {
            const vCardContent = generateVCard();
            const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
            const file = new File([blob], `${contactData.displayName || 'contact'}.vcf`, { 
                type: 'text/vcard' 
            });

            // Check if files are supported
            if (navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Contact: ${contactData.displayName || 'Unknown'}`,
                    text: `Save ${contactData.displayName || 'this contact'} to your contacts`,
                    files: [file]
                });
                toast.success('Contact shared successfully!');
            } else {
                // Fallback: share just text
                await navigator.share({
                    title: `Contact: ${contactData.displayName || 'Unknown'}`,
                    text: generateContactText()
                });
                toast.success('Contact info shared!');
            }
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
                toast.error('Failed to share contact');
            }
        }
    };

    // 🔧 FIXED: Better download method with multiple fallbacks
    const handleDirectDownload = () => {
        try {
            const vCardContent = generateVCard();
            const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
            const url = URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${contactData.displayName || 'contact'}.vcf`;
            
            // Force download
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up the URL
            setTimeout(() => URL.revokeObjectURL(url), 100);
            
            toast.success('Contact downloaded successfully!', {
                duration: 3000,
                icon: '📱'
            });
        } catch (error) {
            console.error('Error downloading contact:', error);
            
            // Fallback: try data URL method
            try {
                const vCardContent = generateVCard();
                const dataURL = `data:text/vcard;charset=utf-8,${encodeURIComponent(vCardContent)}`;
                
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = `${contactData.displayName || 'contact'}.vcf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                toast.success('Contact downloaded!');
            } catch (fallbackError) {
                console.error('Fallback download failed:', fallbackError);
                toast.error('Download failed. Try copying the contact info instead.');
            }
        }
    };

    // 🔧 NEW: Generate clean contact text
    const generateContactText = () => {
        const parts = [
            contactData.displayName && `Name: ${contactData.displayName}`,
            contactData.email && `Email: ${contactData.email}`,
            contactData.phone && `Phone: ${contactData.phone}`,
            contactData.website && `Website: ${contactData.website}`,
            contactData.company && `Company: ${contactData.company}`,
            contactData.bio && `Bio: ${contactData.bio}`
        ].filter(Boolean);
        
        return parts.join('\n');
    };

    // 🔧 IMPROVED: Copy contact with better formatting
    const handleCopyContact = async () => {
        try {
            const contactText = generateContactText();
            await navigator.clipboard.writeText(contactText);
            toast.success('Contact info copied to clipboard!');
        } catch (error) {
            console.error('Error copying:', error);
            
            // Fallback: try to use the old method
            try {
                const textArea = document.createElement('textarea');
                textArea.value = generateContactText();
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                toast.success('Contact info copied!');
            } catch (fallbackError) {
                toast.error('Failed to copy contact info');
            }
        }
    };

    // 🔧 IMPROVED: QR Code with better encoding
    const handleShowQR = () => {
        try {
            const vCardContent = generateVCard();
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&format=png&data=${encodeURIComponent(vCardContent)}`;
            
            // Open QR code in a popup
            const popup = window.open('', '_blank', 'width=350,height=400,scrollbars=no,resizable=no');
            if (popup) {
                popup.document.write(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>QR Code - ${contactData.displayName || 'Contact'}</title>
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
                            }
                            img { 
                                max-width: 100%; 
                                border: 1px solid #ddd;
                                border-radius: 8px;
                            }
                            h3 { margin-top: 0; color: #333; }
                            p { color: #666; font-size: 14px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h3>📱 Scan to Save Contact</h3>
                            <img src="${qrUrl}" alt="QR Code" />
                            <p>Scan this QR code with your phone to add<br><strong>${contactData.displayName || 'this contact'}</strong> to your contacts</p>
                        </div>
                    </body>
                    </html>
                `);
                popup.document.close();
            }
            
            toast.success('QR code opened! Scan to save contact.');
        } catch (error) {
            console.error('Error showing QR:', error);
            toast.error('Failed to generate QR code');
        }
    };

    // 🔧 IMPROVED: Smart detection for best method
    const handleSmartSave = () => {
        const isMobile = /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasNativeShare = navigator.share && navigator.canShare;
        
        if (isMobile && hasNativeShare) {
            handleNativeShare();
        } else {
            handleDirectDownload();
        }
    };

    if (isLoading || !contactData) {
        return null;
    }

    return (
        <div className="w-full px-5 mb-4 relative">
            <div className="flex gap-2">
                {/* 🔧 MAIN BUTTON: Smart detection */}
                <button
                    onClick={handleSmartSave}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                    <FaAddressCard className="w-5 h-5" />
                    <div className="flex-1 text-center">
                        <div className="text-sm font-semibold">
                            {(/Mobile|Android|iPhone/i.test(navigator.userAgent) && navigator.share) 
                                ? (t('save_contact.share_contact') || 'Share Contact')
                                : (t('save_contact.save_contact') || 'Save Contact')
                            }
                        </div>
                        <div className="text-xs opacity-90">
                            {contactData.displayName && `Add ${contactData.displayName}`}
                        </div>
                    </div>
                    {(/Mobile|Android|iPhone/i.test(navigator.userAgent) && navigator.share) 
                        ? <FaShare className="w-4 h-4" />
                        : <FaDownload className="w-4 h-4" />
                    }
                </button>

                {/* OPTIONS MENU BUTTON */}
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

            {/* 🔧 IMPROVED OPTIONS MENU */}
            {showOptions && (
                <div className="absolute right-5 top-full mt-2 bg-white rounded-lg shadow-lg border z-50 min-w-[200px] overflow-hidden">
                    <div className="py-2">
                        {/* Native Share Option */}
                        {navigator.share && (
                            <button
                                onClick={() => {
                                    handleNativeShare();
                                    setShowOptions(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                            >
                                <FaShare className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">Share Contact</span>
                            </button>
                        )}

                        {/* Download Option */}
                        <button
                            onClick={() => {
                                handleDirectDownload();
                                setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <FaDownload className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Download vCard</span>
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
                            <span className="text-sm">Copy Contact Info</span>
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
                            <span className="text-sm">Show QR Code</span>
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