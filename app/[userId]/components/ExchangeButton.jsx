// app/[userId]/components/ExchangeButton.jsx - THEMED VERSION
"use client"
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import ExchangeModal from './ExchangeModal';
import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { hexToRgba } from "@/lib/utilities";

export default function ExchangeButton({ username, userInfo, fastLookupUsed, userId }) {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);
    

    const [btnType, setBtnType] = useState(0);
    const [btnShadowColor, setBtnShadowColor] = useState('');
    const [btnFontColor, setBtnFontColor] = useState('');
    const [btnColor, setBtnColor] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('');
    const [themeTextColour, setThemeTextColour] = useState("");

    
    useEffect(() => {
        async function fetchThemeData() {
            try {
                console.log("🔍 ExchangeButton: Fetching theme data for userId:", userId);
                
                const currentUser = await fetchUserData(userId);
                if (!currentUser) {
                    console.warn("❌ ExchangeButton: No current user found");
                    return;
                }

                console.log("✅ ExchangeButton: Current user found:", currentUser);

                const collectionRef = collection(fireApp, "AccountData");
                const docRef = doc(collectionRef, currentUser);

                const unsubscribe = onSnapshot(docRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data();
                        console.log("📊 ExchangeButton: Theme data received:", {
                            btnType: data.btnType,
                            btnColor: data.btnColor,
                            btnFontColor: data.btnFontColor,
                            selectedTheme: data.selectedTheme
                        });
                        
                        setBtnType(data.btnType || 0);
                        setBtnShadowColor(data.btnShadowColor || "#000");
                        setBtnFontColor(data.btnFontColor || "#000");
                        setBtnColor(data.btnColor || "#fff");
                        setSelectedTheme(data.selectedTheme || '');
                        setThemeTextColour(data.themeFontColor || "");
                    } else {
                        console.warn("❌ ExchangeButton: Document does not exist");
                    }
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("❌ ExchangeButton: Error fetching theme data:", error);
            }
        }

        if (userId) {
            fetchThemeData();
        } else {
            console.warn("⚠️ ExchangeButton: No userId provided");
        }
    }, [userId]);

   
    const getButtonClasses = () => {
        let baseClasses = "w-full font-semibold py-3 px-3 md:px-6 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2";
        
        switch (btnType) {
            case 0:
                return `${baseClasses}`;
            case 1: 
                return `${baseClasses} rounded-lg`;
            case 2: 
                return `${baseClasses} rounded-3xl`;
            case 3: 
                return `${baseClasses} border border-black bg-opacity-0`;
            case 4: 
                return `${baseClasses} border border-black rounded-lg bg-opacity-0`;
            case 5: 
                return `${baseClasses} border border-black rounded-3xl bg-opacity-0`;
            case 6: 
                return `${baseClasses} bg-white border border-black`;
            case 7: 
                return `${baseClasses} bg-white border border-black rounded-lg`;
            case 8: 
                return `${baseClasses} bg-white border border-black rounded-3xl`;
            case 9: 
                return `${baseClasses} bg-white`;
            case 10: 
                return `${baseClasses} bg-white rounded-lg`;
            case 11: 
                return `${baseClasses} bg-white rounded-3xl`;
            case 15: 
                return `${baseClasses} border border-black bg-black rounded-3xl`;
            default:
                return baseClasses;
        }
    };

    const getButtonStyles = () => {
        let styles = {
            color: btnFontColor || "#000",
            backgroundColor: btnColor || "#fff"
        };

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

        if (selectedTheme === "Matrix") {
            styles.borderColor = themeTextColour;
        }

       
        console.log("🎨 Exchange Button Styles:", styles, "Button Type:", btnType);

        return styles;
    };

    return (
        <>
            {/* Debug info - remove this after fixing */}
            {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mb-1">
                    ExchangeButton Debug: Type={btnType}, Color={btnColor}, UserId={userId ? '✓' : '✗'}
                </div>
            )}
            
            <button
                onClick={() => setIsModalOpen(true)}
                className={getButtonClasses()}
                style={getButtonStyles()}
            >
                {/* Exchange Icon */}
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                
                {/* Text - Hidden on small screens, visible on md+ */}
                <span className="hidden md:block">
                    {t('exchange.button_text') || 'Exchange Contact'}
                </span>
                
                {/* Mobile-only text (shorter) */}
                <span className="block md:hidden text-sm">
                    Exchange
                </span>
            </button>
            
            <ExchangeModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                profileOwnerUsername={username}
                profileOwnerId={userInfo?.userId}
            />
        </>
    );
}