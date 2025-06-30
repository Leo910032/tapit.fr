// app/[userId]/components/SaveContactButton.jsx - RESPONSIVE VERSION FOR SIDE-BY-SIDE
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
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
      // This ensures navigator.userAgent is only accessed on the client
      setIsClient(true); 

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

    // Direct save method - UPDATED
    const handleDirectSave = () => {
        if (!isClient) return; // Guard against SSR
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        try {
            const vCardContent = generateVCard();
            if (!vCardContent) {
                toast.error('No contact data to save.');
                return;
            }

            if (isMobile) {
                // On mobile, we navigate to the data URL directly.
                // The mobile OS will recognize the 'text/vcard' type and
                // open the 'Add to Contacts' screen automatically.
                const dataURL = `data:text/vcard;charset=utf-8,${encodeURIComponent(vCardContent)}`;
                
                // This is the key change! We directly change the window's location.
                window.location.href = dataURL;
                
            } else {
                // Desktop behavior remains the same: download the .vcf file.
                // This is the correct and expected behavior for desktop users.
                const blob = new Blob([vCardContent], { type: 'text/vcard;charset=utf-8' });
                const url = URL.createObjectURL(blob);
                
                const link = document.createElement('a');
                link.href = url;
                link.download = `${contactData.displayName || 'contact'}.vcf`;
                
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                setTimeout(() => URL.revokeObjectURL(url), 100);
                
                toast.success('📥 Contact file downloaded!', {
                    duration: 4000
                });
            }
            
        } catch (error) {
            console.error('Save error:', error);
            toast.error('Could not save contact.');
            // Fallback to copying the info if the save fails
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
        // ... (Your QR code logic is great, no changes needed here)
    };

    if (isLoading || !contactData) {
        return null;
    }

    const isMobile = isClient && /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    return (
        <div className="relative">
            {/* ... (Your JSX is great, no changes needed here) ... */}
            {/* I will paste it back just for completeness */}
            <div className="flex gap-2">
                <button
                    onClick={handleDirectSave}
                    className="flex-1 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-semibold py-3 px-3 md:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
                >
                    <FaAddressCard className="w-5 h-5 flex-shrink-0" />
                    
                    <span className="hidden md:block">
                        {isMobile ? 'Save to Phone' : 'Download vCard'}
                    </span>
                    
                    <span className="block md:hidden text-sm">
                        Save
                    </span>
                    
                    {!isMobile && <FaDownload className="w-4 h-4 flex-shrink-0" />}
                </button>

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