// app/[userId]/components/SaveContactButton.jsx - THEMED VERSION FOR SIDE-BY-SIDE
"use client"
import { useState, useEffect } from 'react';
import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "@/lib/useTranslation";
import { FaAddressCard, FaShare, FaDownload, FaCopy } from "react-icons/fa6";
import { toast } from 'react-hot-toast';
import { hexToRgba } from "@/lib/utilities";

export default function SaveContactButton({ userId }) {
    const { t } = useTranslation();
    const [contactData, setContactData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showOptions, setShowOptions] = useState(false);
    
    // Theme state
    const [btnType, setBtnType] = useState(0);
    const [btnShadowColor, setBtnShadowColor] = useState('');
    const [btnFontColor, setBtnFontColor] = useState('');
    const [btnColor, setBtnColor] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('');
    const [themeTextColour, setThemeTextColour] = useState("");

    // Fetch theme data
    useEffect(() => {
        async function fetchThemeData() {
            try {
                const currentUser = await fetchUserData(userId);
                if (!currentUser) return;

                const collectionRef = collection(fireApp, "AccountData");
                const docRef = doc(collectionRef, currentUser);

                const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data();
                        
                        // Set theme data
                        setBtnType(data.btnType || 0);
                        setBtnShadowColor(data.btnShadowColor || "#000");
                        setBtnFontColor(data.btnFontColor || "#000");
                        setBtnColor(data.btnColor || "#fff");
                        setSelectedTheme(data.selectedTheme || '');
                        setThemeTextColour(data.themeFontColor || "");
                        
                        // Set contact data
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
                console.error("Error fetching data:", error);
                setIsLoading(false);
            }
        }

        fetchThemeData();
    }, [userId]);

    // Generate button classes based on theme
    const getButtonClasses = () => {
        let baseClasses = "flex-1 font-semibold py-3 px-3 md:px-6 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2";
        
        // Special handling for 3D Blocks theme
        if (selectedTheme === "3D Blocks") {
            return `${baseClasses} relative after:absolute after:h-2 after:w-[100.5%] after:bg-black bg-white after:-bottom-2 after:left-[1px] after:skew-x-[57deg] after:ml-[2px] before:absolute before:h-[107%] before:w-3 before:bg-[currentColor] before:top-[1px] before:border-2 before:border-black before:-right-3 before:skew-y-[30deg] before:grid before:grid-rows-2 border-2 border-black inset-2 ml-[-20px] btn`;
        }
        
        // Special handling for Mario theme
        if (selectedTheme === "New Mario") {
            return `${baseClasses} relative overflow-hidden h-16 mario-button`;
        }
        
        switch (btnType) {
            case 0: // Flat
                return `${baseClasses}`;
            case 1: // Rounded
                return `${baseClasses} rounded-lg`;
            case 2: // Pill
                return `${baseClasses} rounded-3xl`;
            case 3: // Outline
                return `${baseClasses} border border-black bg-opacity-0`;
            case 4: // Outline Rounded
                return `${baseClasses} border border-black rounded-lg bg-opacity-0`;
            case 5: // Outline Pill
                return `${baseClasses} border border-black rounded-3xl bg-opacity-0`;
            case 6: // Hard Shadow
                return `${baseClasses} bg-white border border-black`;
            case 7: // Hard Shadow Rounded
                return `${baseClasses} bg-white border border-black rounded-lg`;
            case 8: // Hard Shadow Pill
                return `${baseClasses} bg-white border border-black rounded-3xl`;
            case 9: // Soft Shadow
                return `${baseClasses} bg-white`;
            case 10: // Soft Shadow Rounded
                return `${baseClasses} bg-white rounded-lg`;
            case 11: // Soft Shadow Pill
                return `${baseClasses} bg-white rounded-3xl`;
            case 15: // Black Pill
                return `${baseClasses} border border-black bg-black rounded-3xl`;
            default:
                return baseClasses;
        }
    };

    // Generate button styles
    const getButtonStyles = () => {
        // Special handling for 3D Blocks theme
        if (selectedTheme === "3D Blocks") {
            return {
                color: "#fff",
                backgroundColor: "#10B981" // Green color for save button
            };
        }
        
        // Special handling for Mario theme
        if (selectedTheme === "New Mario") {
            return {
                color: "#fff",
                backgroundColor: "transparent"
            };
        }
        
        let styles = {
            color: btnFontColor || "#000",
            backgroundColor: btnColor || "#fff"
        };

        // Add shadow for specific button types
        switch (btnType) {
            case 6:
            case 7:
            case 8:
                styles.boxShadow = `4px 4px 0 0 ${hexToRgba(btnShadowColor)}`;
                break;
            case 9:
            case 10:
            case 11:
                styles.boxShadow = `0 4px 4px 0 ${hexToRgba(btnShadowColor, 0.16)}`;
                break;
            case 12:
            case 13:
            case 15:
                styles.color = "#fff";
                styles.backgroundColor = "#000";
                break;
        }

        // Matrix theme override
        if (selectedTheme === "Matrix") {
            styles.borderColor = themeTextColour;
        }

        return styles;
    };

    // vCard generation
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

    // Direct save method
    const handleDirectSave = () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        try {
            const vCardContent = generateVCard();
            
            if (isMobile) {
                const dataURL = `data:text/vcard;charset=utf-8,${encodeURIComponent(vCardContent)}`;
                
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = `${contactData.displayName || 'contact'}.vcf`;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    window.open(dataURL, '_blank');
                } else {
                    link.click();
                }
                
                document.body.removeChild(link);
                
                toast.success('📱 Open with Contacts app!', {
                    duration: 4000
                });
                
            } else {
                const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `${contactData.displayName || 'contact'}.vcf`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => URL.revokeObjectURL(url), 100);
                
                toast.success('📥 File downloaded!', {
                    duration: 4000
                });
            }
            
        } catch (error) {
            console.error('Save error:', error);
            handleCopyContact();
        }
    };

    // Copy contact info
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

            if (navigator.clipboard) {
                await navigator.clipboard.writeText(contactText);
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = contactText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            toast.success('📋 Contact info copied!', {
                duration: 3000
            });
        } catch (error) {
            console.error('Copy error:', error);
            toast.error('Failed to copy contact info');
        }
    };

    // QR Code display
    const handleShowQR = () => {
        try {
            const vCardContent = generateVCard();
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(vCardContent)}`;
            
            const popup = window.open('', '_blank', 'width=450,height=500,scrollbars=no,resizable=no');
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
                                font-family: -apple-system, BlinkMacSystemFont, sans-serif;
                                background: linear-gradient(135deg, #10B981 0%, #059669 100%);
                                color: white;
                                min-height: 100vh;
                                display: flex;
                                align-items: center;
                                justify-content: center;
                            }
                            .container {
                                background: white;
                                padding: 30px;
                                border-radius: 20px;
                                box-shadow: 0 20px 40px rgba(0,0,0,0.1);
                                color: #333;
                                max-width: 90%;
                            }
                            img { 
                                max-width: 100%; 
                                border: 3px solid #f0f0f0;
                                border-radius: 15px;
                                margin: 20px 0;
                            }
                            h2 { 
                                margin-top: 0; 
                                color: #333; 
                                font-size: 24px;
                            }
                            p { 
                                color: #666; 
                                font-size: 16px; 
                                line-height: 1.5;
                            }
                            .name {
                                color: #10B981;
                                font-weight: bold;
                            }
                            .close-btn {
                                background: #10B981;
                                color: white;
                                border: none;
                                padding: 10px 20px;
                                border-radius: 10px;
                                margin-top: 20px;
                                cursor: pointer;
                                font-size: 16px;
                            }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h2>📱 Scan to Save Contact</h2>
                            <img src="${qrUrl}" alt="QR Code" />
                            <p>Scan this QR code with your phone camera to add<br><span class="name">${contactData.displayName || 'this contact'}</span> to your contacts</p>
                            <button class="close-btn" onclick="window.close()">Close</button>
                        </div>
                    </body>
                    </html>
                `);
                popup.document.close();
            }
            
            toast.success('📱 Scan QR code with your phone!', {
                duration: 3000
            });
        } catch (error) {
            console.error('QR error:', error);
            toast.error('Failed to generate QR code');
        }
    };

    if (isLoading || !contactData) {
        return null;
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    return (
        <div className="relative">
            <div className="flex gap-2">
          
                {selectedTheme === "New Mario" ? (
           
                    <div className="flex-1 userBtn relative overflow-x-hidden overflow-y-hidden flex justify-between items-center h-16">
               
                        {Array(9).fill("").map((_, brick_index) => (
                            <img
                                key={brick_index}
                                src="https://linktree.sirv.com/Images/Scene/Mario/mario-brick.png"
                                alt="Mario Brick"
                                onClick={handleDirectSave}
                                className="h-16 w-auto object-contain hover:-translate-y-2 cursor-pointer transition-transform"
                                style={{ width: '11.11%' }}
                            />
                        ))}
                        
                       
                        <div 
                            className="absolute top-0 left-0 z-30 w-full h-full flex items-center justify-center gap-3 cursor-pointer pointer-events-none"
                            style={{ 
                                textShadow: '4px 4px 0px rgba(0,0,0,1)'
                            }}
                        >
                         
                            <div className="grid place-items-center">
                                <img
                                    src="https://linktree.sirv.com/Images/Scene/Mario/mario-box.png"
                                    alt="Mario Box"
                                    className="h-12 w-auto object-contain"
                                />
                                <div className="absolute">
                                    <FaAddressCard className="w-6 h-6 text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
                                </div>
                            </div>
                            
                            {/* Mario-style text */}
                            <div className="text-white font-bold MariaFont md:text-2xl sm:text-xl text-lg drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                <span className="hidden md:block">
                                    {isMobile ? 'Save Contact' : 'Download Contact'}
                                </span>
                                <span className="block md:hidden">
                                    Save
                                </span>
                            </div>
                        </div>
                        
               
                        <div 
                            className="absolute top-0 left-0 w-full h-full cursor-pointer z-40"
                            onClick={handleDirectSave}
                        />
                    </div>
                ) : (
                   
                    <div className={selectedTheme === "3D Blocks" ? "flex-1 userBtn" : "flex-1"}>
                        <button
                            onClick={handleDirectSave}
                            className={getButtonClasses()}
                            style={getButtonStyles()}
                        >
                            <FaAddressCard className="w-5 h-5 flex-shrink-0" />
                            
                     
                            <span className="hidden md:block">
                                {isMobile ? 'Save Contact' : 'Download Contact'}
                            </span>
                            
           
                            <span className="block md:hidden text-sm">
                                Save
                            </span>
                            
                            <FaDownload className="w-4 h-4 flex-shrink-0" />
                        </button>
                    </div>
                )}

              
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg transition-colors relative"
                    title="More options"
                    style={{
                        borderColor: selectedTheme === "Matrix" ? themeTextColour : undefined,
                        height: selectedTheme === "New Mario" ? "64px" : "auto"
                    }}
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            </div>

       
            {showOptions && (
                <div className="absolute right-0 top-full mt-2 bg-white rounded-lg shadow-lg border z-50 min-w-[220px] overflow-hidden">
                    <div className="py-2">
                        
                   
                        <button
                            onClick={() => {
                                handleCopyContact();
                                setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <FaCopy className="w-4 h-4 text-purple-600" />
                            <span className="text-sm">Copy Contact Info</span>
                        </button>

                       
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

 
            {showOptions && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowOptions(false)}
                />
            )}
        </div>
    );
}