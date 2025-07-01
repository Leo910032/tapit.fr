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
                        const { 
                            btnType, 
                            btnShadowColor, 
                            btnFontColor, 
                            btnColor, 
                            selectedTheme,
                            themeFontColor
                        } = docSnapshot.data();
                        
                        setBtnType(btnType || 0);
                        setBtnShadowColor(btnShadowColor || "#000");
                        setBtnFontColor(btnFontColor || "#000");
                        setBtnColor(btnColor || "#fff");
                        setSelectedTheme(selectedTheme || '');
                        setThemeTextColour(themeFontColor || "");
                    }
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error fetching theme data:", error);
            }
        }

        if (userId) {
            fetchThemeData();
        }
    }, [userId]);

    // Generate button classes based on theme
    const getButtonClasses = () => {
        let baseClasses = "w-full font-semibold py-3 px-3 md:px-6 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2";
        
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
        let styles = {
            color: btnFontColor,
            backgroundColor: btnColor
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

    return (
        <>
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