// app/[userId]/components/SaveContactButton.jsx - VERSION SIMPLIFIÉE
"use client"
import { useState, useEffect } from 'react';
import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "@/lib/useTranslation";
import { FaDownload, FaAddressCard } from "react-icons/fa6";

export default function SaveContactButton({ userId }) {
    const { t } = useTranslation();
    const [contactData, setContactData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [username, setUsername] = useState("");

    useEffect(() => {
        console.log('🚀 SaveContactButton - Starting for userId:', userId);
        
        async function fetchContactData() {
            try {
                const currentUser = await fetchUserData(userId);
                console.log('👤 SaveContactButton - Current user:', currentUser);
                
                if (!currentUser) {
                    console.log('❌ SaveContactButton - No current user found');
                    setIsLoading(false);
                    return;
                }

                setUsername(currentUser.username || userId);

                const collectionRef = collection(fireApp, "AccountData");
                const docRef = doc(collectionRef, `${currentUser}`);

                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    console.log('📄 SaveContactButton - Document snapshot received');
                    
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log('🔍 SaveContactButton - Raw profile data:', data);
                        
                        // Extraire les données de contact directement
                        const contact = {
                            displayName: data.displayName || '',
                            email: data.email || '',
                            phone: data.phone || '',
                            website: data.website || '',
                            company: data.company || '',
                            profilePhoto: data.profilePhoto || '',
                            bio: data.bio || ''
                        };
                        
                        console.log('📋 SaveContactButton - Extracted contact:', contact);
                        
                        // Vérifier si on a des données utiles
                        const hasData = contact.displayName || contact.email || contact.phone || contact.website;
                        console.log('🔍 SaveContactButton - Has data:', hasData);
                        
                        if (hasData) {
                            setContactData(contact);
                            console.log('✅ SaveContactButton - Contact data set');
                        } else {
                            setContactData(null);
                            console.log('❌ SaveContactButton - No useful data found');
                        }
                    } else {
                        console.log('❌ SaveContactButton - Document does not exist');
                        setContactData(null);
                    }
                    setIsLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("❌ SaveContactButton - Error fetching contact data:", error);
                setIsLoading(false);
            }
        }

        fetchContactData();
    }, [userId]);

    const generateVCard = () => {
        if (!contactData) return '';

        let vcard = 'BEGIN:VCARD\n';
        vcard += 'VERSION:3.0\n';
        
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
        return vcard;
    };

    const handleSaveContact = async () => {
        console.log('🎯 SaveContactButton - Save button clicked');
        
        if (!contactData) {
            console.log('❌ SaveContactButton - No contact data available');
            return;
        }

        try {
            const vCardContent = generateVCard();
            console.log('📄 SaveContactButton - Generated vCard:', vCardContent);
            
            const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            
            const link = document.createElement('a');
            link.href = url;
            link.download = `${contactData.displayName || 'contact'}.vcf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            window.URL.revokeObjectURL(url);
            
            console.log("✅ SaveContactButton - Contact saved successfully");
        } catch (error) {
            console.error('❌ SaveContactButton - Failed to save contact:', error);
        }
    };

    console.log('🎨 SaveContactButton - Render check:', {
        isLoading,
        contactData,
        willRender: !isLoading && contactData
    });

    // Ne pas afficher si en cours de chargement
    if (isLoading) {
        console.log('⏳ SaveContactButton - Still loading, not rendering');
        return null;
    }

    // Ne pas afficher si pas de données de contact
    if (!contactData) {
        console.log('❌ SaveContactButton - No contact data, not rendering');
        return null;
    }

    console.log('✅ SaveContactButton - Rendering button');

    return (
        <div className="w-full px-5 mb-4">
            <button
                onClick={handleSaveContact}
                className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
            >
                <FaAddressCard className="w-5 h-5" />
                <div className="flex-1 text-center">
                    <div className="text-sm font-semibold">
                        {t('save_contact.save_contact') || 'Save Contact'}
                    </div>
                    <div className="text-xs opacity-90">
                        {contactData.displayName && `Add ${contactData.displayName} to contacts`}
                    </div>
                </div>
                <FaDownload className="w-4 h-4" />
            </button>
        </div>
    );
}