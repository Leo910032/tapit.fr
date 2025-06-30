// app/[userId]/components/SaveContactButton.jsx
"use client"
import { useState, useEffect } from 'react';
import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "@/lib/useTranslation";
import { FaDownload, FaAddressCard } from "react-icons/fa6";
import { recordLinkClick } from "@/lib/analytics/linkClickTracker";

export default function SaveContactButton({ userId }) {
    const { t } = useTranslation();
    const [contactData, setContactData] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [username, setUsername] = useState("");

    useEffect(() => {
        async function fetchContactData() {
            try {
                const currentUser = await fetchUserData(userId);
                if (!currentUser) {
                    setIsLoading(false);
                    return;
                }

                setUsername(currentUser.username || userId);

                const collectionRef = collection(fireApp, "AccountData");
                const docRef = doc(collectionRef, `${currentUser}`);

                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        console.log('🔍 SaveContactButton - Raw profile data:', data);
                        
                        // Extract contact information from the profile
                        const contact = {
                            displayName: data.displayName || '',
                            email: data.email || '',
                            phone: data.phone || '',
                            website: data.website || '',
                            company: data.company || '',
                            profilePhoto: data.profilePhoto || '',
                            bio: data.bio || ''
                        };
                        
                        console.log('📋 SaveContactButton - Extracted contact data:', contact);

                        // Extract contact information from the profile
                        const contact = {
                            displayName: data.displayName || '',
                            email: data.email || '',
                            phone: data.phone || '',
                            website: data.website || '', // ✅ Utiliser directement le champ website
                            company: data.company || '',
                            profilePhoto: data.profilePhoto || '',
                            bio: data.bio || ''
                        };
                        
                        console.log('📋 SaveContactButton - Extracted contact data:', contact);

                        // Extract email and phone from links array
                        if (data.links && Array.isArray(data.links)) {
                            console.log('🔗 SaveContactButton - Processing links:', data.links);
                            data.links.forEach((link, index) => {
                                console.log(`🔗 Processing link ${index}:`, link);
                                if (link.isActive !== false && link.url) {
                                    const url = link.url.toLowerCase();
                                    const title = (link.title || '').toLowerCase();
                                    
                                    // Check for email
                                    if (url.includes('mailto:') || url.includes('@') || title.includes('email')) {
                                        contact.email = url.replace('mailto:', '');
                                        console.log('📧 Found email in link:', contact.email);
                                    }
                                    
                                    // Check for phone
                                    if (url.includes('tel:') || title.includes('phone') || title.includes('call')) {
                                        contact.phone = url.replace('tel:', '').replace(/\D/g, '');
                                        console.log('📞 Found phone in link:', contact.phone);
                                    }
                                    
                                    // Check for website (exclude social media and current website)
                                    if (!contact.website && 
                                        !url.includes('instagram') && 
                                        !url.includes('twitter') && 
                                        !url.includes('facebook') && 
                                        !url.includes('linkedin') && 
                                        !url.includes('tiktok') &&
                                        (url.startsWith('http') || url.startsWith('www'))) {
                                        contact.website = url.startsWith('http') ? url : `https://${url}`;
                                        console.log('🌐 Found website in link:', contact.website);
                                    }
                                }
                            });
                        }

                        // Extract social media and other info from socials array
                        if (data.socials && Array.isArray(data.socials)) {
                            console.log('📱 SaveContactButton - Processing socials:', data.socials);
                            data.socials.forEach((social, index) => {
                                console.log(`📱 Processing social ${index}:`, social);
                                if (social.active && social.value) {
                                    switch (social.type) {
                                        case 'email':
                                            if (!contact.email) {
                                                contact.email = social.value;
                                                console.log('📧 Found email in social:', contact.email);
                                            }
                                            break;
                                        case 'phone':
                                            if (!contact.phone) {
                                                contact.phone = social.value.replace(/\D/g, '');
                                                console.log('📞 Found phone in social:', contact.phone);
                                            }
                                            break;
                                        case 'website':
                                            if (!contact.website) {
                                                contact.website = social.value;
                                                console.log('🌐 Found website in social:', contact.website);
                                            }
                                            break;
                                        case 'linkedin':
                                            contact.linkedin = `https://linkedin.com/in/${social.value}`;
                                            break;
                                        case 'twitter':
                                            contact.twitter = `https://twitter.com/${social.value}`;
                                            break;
                                        case 'instagram':
                                            contact.instagram = `https://instagram.com/${social.value}`;
                                            break;
                                    }
                                }
                            });
                        }

                        // ✅ SOLUTION TEMPORAIRE : Utiliser toutes les données disponibles
                        const finalContact = {
                            ...contact,
                            // Si on a un website direct, l'utiliser
                            website: data.website || contact.website || '',
                            // Utiliser displayName même s'il n'y a pas d'email/phone pour tester
                            displayName: data.displayName || data.username || ''
                        };

                        console.log('📋 SaveContactButton - Final contact data:', finalContact);

                        // ✅ CONDITION TEMPORAIRE : Afficher si on a au moins displayName ET website
                        if (finalContact.displayName || finalContact.email || finalContact.phone || finalContact.website) {
                            console.log('✅ SaveContactButton - Setting contact data:', finalContact);
                            setContactData(finalContact);
                        } else {
                            console.log('❌ SaveContactButton - No meaningful contact data found');
                            setContactData(null);
                        }
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

    const generateVCard = () => {
        if (!contactData) return '';

        let vcard = 'BEGIN:VCARD\n';
        vcard += 'VERSION:3.0\n';
        
        // Name
        if (contactData.displayName) {
            vcard += `FN:${contactData.displayName}\n`;
            vcard += `N:${contactData.displayName};;;;\n`;
        }
        
        // Email
        if (contactData.email) {
            vcard += `EMAIL:${contactData.email}\n`;
        }
        
        // Phone
        if (contactData.phone) {
            vcard += `TEL:+${contactData.phone}\n`;
        }
        
        // Website
        if (contactData.website) {
            vcard += `URL:${contactData.website}\n`;
        }
        
        // Company/Organization
        if (contactData.company) {
            vcard += `ORG:${contactData.company}\n`;
        }
        
        // Note/Bio
        if (contactData.bio) {
            vcard += `NOTE:${contactData.bio}\n`;
        }
        
        // Social media URLs
        if (contactData.linkedin) {
            vcard += `URL:${contactData.linkedin}\n`;
        }
        if (contactData.twitter) {
            vcard += `URL:${contactData.twitter}\n`;
        }
        if (contactData.instagram) {
            vcard += `URL:${contactData.instagram}\n`;
        }
        
        // Profile photo (if it's a URL)
        if (contactData.profilePhoto && contactData.profilePhoto.startsWith('http')) {
            vcard += `PHOTO:${contactData.profilePhoto}\n`;
        }
        
        vcard += 'END:VCARD';
        return vcard;
    };

    const handleSaveContact = async () => {
        if (!contactData) return;

        try {
            // Track the contact save action
            if (username) {
                await recordLinkClick(username, {
                    linkId: `save_contact_${contactData.displayName || 'contact'}`,
                    linkTitle: `Save Contact - ${contactData.displayName || 'Contact'}`,
                    linkUrl: window.location.href,
                    linkType: "save_contact"
                }, {
                    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                    referrer: typeof window !== 'undefined' ? document.referrer : '',
                    recordDetailed: false
                });
            }

            // Generate vCard content
            const vCardContent = generateVCard();
            
            // Create blob and download
            const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
            const url = window.URL.createObjectURL(blob);
            
            // Create download link
            const link = document.createElement('a');
            link.href = url;
            link.download = `${contactData.displayName || 'contact'}.vcf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Clean up
            window.URL.revokeObjectURL(url);
            
            console.log("✅ Contact saved successfully");
        } catch (error) {
            console.error('❌ Failed to save contact:', error);
        }
    };

    // Don't render if loading or no meaningful contact data
    if (isLoading || !contactData) {
        return null;
    }

    // ✅ CONDITION TEMPORAIRE : Accepter aussi le website
    const hasContactInfo = contactData.email || contactData.phone || contactData.website || contactData.displayName;
    console.log('🔍 SaveContactButton - Render check:', {
        isLoading,
        contactData,
        hasContactInfo,
        willRender: !isLoading && contactData && hasContactInfo
    });
    
    if (!hasContactInfo) {
        console.log('❌ SaveContactButton - No contact info, not rendering');
        return null;
    }

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