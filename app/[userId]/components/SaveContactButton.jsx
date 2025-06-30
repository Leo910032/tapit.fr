// app/[userId]/components/SaveContactButton.jsx - SOLUTION ROBUSTE
"use client"
import { useState, useEffect } from 'react';
import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "@/lib/useTranslation";
import { FaAddressCard, FaShare, FaDownload, FaCopy } from "react-icons/fa6";
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

    // 📱 Génération vCard optimisée
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

    // 🔥 SOLUTION PRINCIPALE : Téléchargement direct SANS API de partage
    const handleDirectSave = () => {
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        try {
            const vCardContent = generateVCard();
            
            if (isMobile) {
                // 📱 SUR MOBILE : Ouverture directe avec data URL
                const dataURL = `data:text/vcard;charset=utf-8,${encodeURIComponent(vCardContent)}`;
                
                // Créer un lien invisible et le cliquer
                const link = document.createElement('a');
                link.href = dataURL;
                link.download = `${contactData.displayName || 'contact'}.vcf`;
                link.style.display = 'none';
                
                document.body.appendChild(link);
                
                // Sur iOS, il faut ouvrir dans une nouvelle fenêtre
                if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
                    window.open(dataURL, '_blank');
                } else {
                    // Sur Android, déclencher le téléchargement
                    link.click();
                }
                
                document.body.removeChild(link);
                
                toast.success('📱 Ouvrez l\'app Contacts pour ajouter le contact!', {
                    duration: 4000
                });
                
            } else {
                // 💻 SUR DESKTOP : Téléchargement Blob
                const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `${contactData.displayName || 'contact'}.vcf`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => URL.revokeObjectURL(url), 100);
                
                toast.success('📥 Fichier téléchargé ! Ouvrez-le pour ajouter le contact.', {
                    duration: 4000
                });
            }
            
        } catch (error) {
            console.error('Erreur sauvegarde directe:', error);
            // Fallback vers la copie
            handleCopyContact();
        }
    };

    // 📋 Copier les informations (fallback)
    const handleCopyContact = async () => {
        try {
            const contactText = [
                contactData.displayName && `Nom: ${contactData.displayName}`,
                contactData.email && `Email: ${contactData.email}`,
                contactData.phone && `Téléphone: ${contactData.phone}`,
                contactData.website && `Site web: ${contactData.website}`,
                contactData.company && `Entreprise: ${contactData.company}`,
                contactData.bio && `Bio: ${contactData.bio}`
            ].filter(Boolean).join('\n');

            if (navigator.clipboard) {
                await navigator.clipboard.writeText(contactText);
            } else {
                // Fallback pour les anciens navigateurs
                const textArea = document.createElement('textarea');
                textArea.value = contactText;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
            }
            
            toast.success('📋 Informations copiées dans le presse-papiers!', {
                duration: 3000
            });
        } catch (error) {
            console.error('Erreur copie:', error);
            toast.error('Impossible de copier les informations');
        }
    };

    // 🔲 QR Code pour partage rapide
    const handleShowQR = () => {
        try {
            const vCardContent = generateVCard();
            const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&format=png&data=${encodeURIComponent(vCardContent)}`;
            
            // Créer une popup avec le QR code
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
                                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
                                color: #667eea;
                                font-weight: bold;
                            }
                            .close-btn {
                                background: #667eea;
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
                            <h2>📱 Scanner pour sauvegarder</h2>
                            <img src="${qrUrl}" alt="QR Code" />
                            <p>Scannez ce QR code avec l'appareil photo de votre téléphone pour ajouter<br><span class="name">${contactData.displayName || 'ce contact'}</span> à vos contacts</p>
                            <button class="close-btn" onclick="window.close()">Fermer</button>
                        </div>
                    </body>
                    </html>
                `);
                popup.document.close();
            }
            
            toast.success('📱 Scannez le QR code avec votre téléphone!', {
                duration: 3000
            });
        } catch (error) {
            console.error('Erreur QR code:', error);
            toast.error('Impossible de générer le QR code');
        }
    };

    // 🔄 Partage natif (SEULEMENT si supporté et HTTPS)
    const tryNativeShare = async () => {
        // Vérifications strictes
        if (!navigator.share) {
            toast.error('Partage non supporté sur cet appareil');
            return false;
        }

        if (location.protocol !== 'https:' && location.hostname !== 'localhost') {
            toast.error('Le partage nécessite une connexion sécurisée');
            return false;
        }

        try {
            const contactText = [
                contactData.displayName && `${contactData.displayName}`,
                contactData.email && `📧 ${contactData.email}`,
                contactData.phone && `📞 ${contactData.phone}`,
                contactData.website && `🌐 ${contactData.website}`
            ].filter(Boolean).join('\n');

            await navigator.share({
                title: `Contact: ${contactData.displayName || 'Inconnu'}`,
                text: contactText
            });

            toast.success('Contact partagé!');
            return true;
        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Erreur partage natif:', error);
                toast.error('Échec du partage');
            }
            return false;
        }
    };

    if (isLoading || !contactData) {
        return null;
    }

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    return (
        <div className="w-full px-5 mb-4 relative">
            <div className="flex gap-2">
                {/* 🎯 BOUTON PRINCIPAL - Sauvegarde directe */}
                <button
                    onClick={handleDirectSave}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
                >
                    <FaAddressCard className="w-5 h-5" />
                    <div className="flex-1 text-center">
                        <div className="text-sm font-semibold">
                            {isMobile ? 'Sauvegarder Contact' : 'Télécharger Contact'}
                        </div>
                        <div className="text-xs opacity-90">
                            {contactData.displayName && `Ajouter ${contactData.displayName}`}
                        </div>
                    </div>
                    <FaDownload className="w-4 h-4" />
                </button>

                {/* MENU OPTIONS */}
                <button
                    onClick={() => setShowOptions(!showOptions)}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-700 p-3 rounded-lg transition-colors relative"
                    title="Plus d'options"
                >
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                    </svg>
                </button>
            </div>

            {/* MENU D'OPTIONS */}
            {showOptions && (
                <div className="absolute right-5 top-full mt-2 bg-white rounded-lg shadow-lg border z-50 min-w-[220px] overflow-hidden">
                    <div className="py-2">
                        
                        {/* Option Copier (TOUJOURS disponible) */}
                        <button
                            onClick={() => {
                                handleCopyContact();
                                setShowOptions(false);
                            }}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                        >
                            <FaCopy className="w-4 h-4 text-purple-600" />
                            <span className="text-sm">Copier les informations</span>
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
                            <span className="text-sm">Afficher QR Code</span>
                        </button>

                        {/* Option Partage natif (SEULEMENT si HTTPS) */}
                        {navigator.share && location.protocol === 'https:' && (
                            <button
                                onClick={() => {
                                    tryNativeShare();
                                    setShowOptions(false);
                                }}
                                className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-center gap-3"
                            >
                                <FaShare className="w-4 h-4 text-blue-600" />
                                <span className="text-sm">Partager (Natif)</span>
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Overlay pour fermer le menu */}
            {showOptions && (
                <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setShowOptions(false)}
                />
            )}
        </div>
    );
}