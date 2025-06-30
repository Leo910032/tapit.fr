// app/[userId]/components/SaveContactButton.jsx - VERSION INSTANTANÉE
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

    // Générer le lien vCard data URL
    const generateVCardDataURL = () => {
        if (!contactData) return '';

        let vcard = 'BEGIN:VCARD\nVERSION:3.0\n';
        
        if (contactData.displayName) {
            vcard += `FN:${contactData.displayName}\n`;
            vcard += `N:${contactData.displayName};;;;\n`;
        }
        
        if (contactData.email) {
            vcard += `EMAIL:${contactData.email}\n`;
        }
        
        if (contactData.phone) {
            vcard += `TEL:${contactData.phone}\n`;
        }
        
        if (contactData.website) {
            const websiteUrl = contactData.website.startsWith('http') ? contactData.website : `https://${contactData.website}`;
            vcard += `URL:${websiteUrl}\n`;
        }
        
        if (contactData.company) {
            vcard += `ORG:${contactData.company}\n`;
        }
        
        if (contactData.bio) {
            vcard += `NOTE:${contactData.bio}\n`;
        }
        
        if (contactData.profilePhoto && contactData.profilePhoto.startsWith('http')) {
            vcard += `PHOTO:${contactData.profilePhoto}\n`;
        }
        
        vcard += 'END:VCARD';
        
        return `data:text/vcard;charset=utf-8,${encodeURIComponent(vcard)}`;
    };

    // Méthode 1: Partage natif (Web Share API)
    const handleNativeShare = async () => {
        if (!navigator.share) {
            toast.error('Sharing not supported on this device');
            return;
        }

        try {
            const vCardContent = generateVCardDataURL().split(',')[1];
            const blob = new Blob([decodeURIComponent(vCardContent)], { type: 'text/vcard' });
            const file = new File([blob], `${contactData.displayName || 'contact'}.vcf`, { type: 'text/vcard' });

            await navigator.share({
                title: `Contact: ${contactData.displayName || 'Unknown'}`,
                text: `Save ${contactData.displayName || 'this contact'} to your contacts`,
                files: [file]
            });

            toast.success('Contact shared successfully!');
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error sharing:', error);
                toast.error('Failed to share contact');
            }
        }
    };

    // Méthode 2: Ouverture directe avec data URL
    const handleDirectOpen = () => {
        try {
            const dataURL = generateVCardDataURL();
            const link = document.createElement('a');
            link.href = dataURL;
            link.download = `${contactData.displayName || 'contact'}.vcf`;
            
            // Tentative d'ouverture directe
            if (navigator.userAgent.includes('Mobile') || navigator.userAgent.includes('Android') || navigator.userAgent.includes('iPhone')) {
                // Sur mobile, essayer d'ouvrir directement
                window.location.href = dataURL;
            } else {
                // Sur desktop, télécharger le fichier
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }
            
            toast.success('Contact ready to save!', {
                duration: 3000,
                icon: '📱'
            });
        } catch (error) {
            console.error('Error opening contact:', error);
            toast.error('Failed to open contact');
        }
    };

    // Méthode 3: Copier les informations
    const handleCopyContact = async () => {
        try {
            const contactText = [
                contactData.displayName && `Name: ${contactData.displayName}`,
                contactData.email && `Email: ${contactData.email}`,
                contactData.phone && `Phone: ${contactData.phone}`,
                contactData.website && `Website: ${contactData.website}`,
                contactData.company && `Company: ${contactData.company}`
            ].filter(Boolean).join('\n');

            await navigator.clipboard.writeText(contactText);
            toast.success('Contact info copied to clipboard!');
        } catch (error) {
            console.error('Error copying:', error);
            toast.error('Failed to copy contact info');
        }
    };

    // Méthode 4: Afficher un QR Code (optionnel)
    const handleShowQR = () => {
        const vCardData = generateVCardDataURL().split(',')[1];
        const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(decodeURIComponent(vCardData))}`;
        
        // Ouvrir le QR code dans une nouvelle fenêtre
        window.open(qrUrl, '_blank', 'width=250,height=250');
        toast.success('Scan QR code to save contact!');
    };

    if (isLoading || !contactData) {
        return null;
    }

    return (
        <div className="w-full px-5 mb-4 relative">
            <div className="flex gap-2">
                {/* Bouton principal - Action la plus rapide selon l'appareil */}
                <button
                    onClick={() => {
                        // Détection intelligente de la meilleure méthode
                        if (navigator.share && /Mobile|Android|iPhone/.test(navigator.userAgent)) {
                            handleNativeShare();
                        } else {
                            handleDirectOpen();
                        }
                    }}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                    <FaAddressCard className="w-5 h-5" />
                    <div className="flex-1 text-center">
                        <div className="text-sm font-semibold">
                            {navigator.share && /Mobile|Android|iPhone/.test(navigator.userAgent) 
                                ? (t('save_contact.share_contact') || 'Share Contact')
                                : (t('save_contact.save_contact') || 'Save Contact')
                            }
                        </div>
                        <div className="text-xs opacity-90">
                            {contactData.displayName && `Add ${contactData.displayName}`}
                        </div>
                    </div>
                    {navigator.share && /Mobile|Android|iPhone/.test(navigator.userAgent) 
                        ? <FaShare className="w-4 h-4" />
                        : <FaDownload className="w-4 h-4" />
                    }
                </button>

                {/* Bouton options alternatives */}
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

            {/* Menu d'options */}
            {showOptions && (
                <div className="absolute right-5 top-full mt-2 bg-white rounded-lg shadow-lg border z-50 min-w-[200px] overflow-hidden">
                    <div className="py-2">
                        {/* Option Partage natif (si disponible) */}
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

                        {/* Option Download direct */}
                        <button
                            onClick={() => {
                                handleDirectOpen();
                                setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <FaDownload className="w-4 h-4 text-green-600" />
                            <span className="text-sm">Download vCard</span>
                        </button>

                        {/* Option Copier */}
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

                        {/* Option QR Code */}
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

            {/* Fermer le menu en cliquant ailleurs */}
            {showOptions && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowOptions(false)}
                />
            )}
        </div>
    );
}