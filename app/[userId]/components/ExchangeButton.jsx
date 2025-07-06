// app/[userId]/components/ExchangeButton.jsx - MARIO THEME WITH PROPER FONT SUPPORT
"use client"
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import ExchangeModal from './ExchangeModal';
import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { hexToRgba } from "@/lib/utilities";
import { availableFonts_Classic } from "@/lib/FontsList";

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
    const [selectedFontClass, setSelectedFontClass] = useState(""); // ✅ Add font support

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
                            selectedTheme: data.selectedTheme,
                            fontType: data.fontType
                        });
                        
                        setBtnType(data.btnType || 0);
                        setBtnShadowColor(data.btnShadowColor || "#000");
                        setBtnFontColor(data.btnFontColor || "#000");
                        setBtnColor(data.btnColor || "#fff");
                        setSelectedTheme(data.selectedTheme || '');
                        setThemeTextColour(data.themeFontColor || "");
                        
                        // ✅ Set font class - SAME AS Button.jsx
                        const fontName = availableFonts_Classic[data.fontType ? data.fontType - 1 : 0];
                        setSelectedFontClass(fontName?.class || '');
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
        
        if (selectedTheme === "3D Blocks") {
            return `${baseClasses} relative after:absolute after:h-2 after:w-[100.5%] after:bg-black bg-white after:-bottom-2 after:left-[1px] after:skew-x-[57deg] after:ml-[2px] before:absolute before:h-[107%] before:w-3 before:bg-[currentColor] before:top-[1px] before:border-2 before:border-black before:-right-3 before:skew-y-[30deg] before:grid before:grid-rows-2 border-2 border-black inset-2 ml-[-20px] btn`;
        }
        
        if (selectedTheme === "New Mario") {
            return `${baseClasses} relative overflow-hidden h-16 mario-button`;
        }
        
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
        if (selectedTheme === "3D Blocks") {
            return {
                color: "#fff",
                backgroundColor: "#191414" 
            };
        }
        
        if (selectedTheme === "New Mario") {
            return {
                color: "#fff",
                backgroundColor: "transparent",
                backgroundImage: `url('https://linktree.sirv.com/Images/Scene/Mario/mario-brick.png')`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center"
            };
        }
        
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

        console.log("🎨 Exchange Button Styles:", styles, "Button Type:", btnType, "Theme:", selectedTheme);

        return styles;
    };

    return (
        <>
            {/* Debug info - remove this after fixing */}
            {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mb-1">
                    ExchangeButton Debug: Type={btnType}, Color={btnColor}, Theme={selectedTheme}, UserId={userId ? '✓' : '✗'}, Font={selectedFontClass}
                </div>
            )}
            
        {selectedTheme === "New Mario" ? (
    <div className="userBtn relative overflow-x-hidden overflow-y-hidden flex justify-between items-center h-16 w-full">         
        {/* Mario brick background - 4 bricks for side-by-side buttons */}
        {Array(4).fill("").map((_, brick_index) => (
            <img
                key={brick_index}
                src="https://linktree.sirv.com/Images/Scene/Mario/mario-brick.png"
                alt="Mario Brick"
                onClick={() => setIsModalOpen(true)}
                className="h-full w-1/4 object-cover hover:-translate-y-2 cursor-pointer transition-transform"
            />
        ))}
        
        {/* Mario box with icon */}
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-30">
            <div className="relative">
                <img
                    src="https://linktree.sirv.com/Images/Scene/Mario/mario-box.png"
                    alt="Mario Box"
                    className="h-8 w-auto object-contain hover:-translate-y-2 hover:rotate-2 transition-all cursor-pointer"
                    onClick={() => setIsModalOpen(true)}
                />
                {/* Exchange icon inside the box */}
                <div className="absolute inset-0 flex items-center justify-center">
                    <svg className="w-4 h-4 text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                    </svg>
                </div>
            </div>
        </div>
        
        {/* Button text overlay with selected font */}
        <div 
            className="absolute top-0 left-0 z-20 w-full h-full flex items-center justify-center cursor-pointer text-white font-bold"
            onClick={() => setIsModalOpen(true)}
            style={{ 
                textShadow: '4px 4px 0px rgba(0,0,0,1)',
                fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)',
                paddingLeft: '3rem' // Space for the box
            }}
        >
            {/* ✅ FIXED: Use selectedFontClass instead of hardcoded font */}
            <div className={selectedFontClass}>
                {/* Desktop text */}
                <span className="hidden md:block">
                    {t('exchange.button_text') || 'Exchange Contact'}
                </span>
                
                {/* Mobile text (shorter) */}
                <span className="block md:hidden text-sm">
                    {t('exchange.button_text_short') || 'Exchange'}
                </span>
            </div>
        </div>
    </div>
) : selectedTheme === "3D Blocks" ? (
    <div className="userBtn relative justify-between items-center flex hover:scale-[1.025] w-full">
        <button
            onClick={() => setIsModalOpen(true)}
            className={`${getButtonClasses()} ${selectedFontClass}`}
            style={getButtonStyles()}
        >
            {/* Exchange Icon */}
            <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
            
            {/* Desktop text */}
            <span className="hidden md:block">
                {t('exchange.button_text') || 'Exchange Contact'}
            </span>
            
            {/* Mobile text (shorter) */}
            <span className="block md:hidden text-sm">
                {t('exchange.button_text_short') || 'Exchange'}
            </span>
        </button>
    </div>
) : (
    <button
        onClick={() => setIsModalOpen(true)}
        className={`${getButtonClasses()} ${selectedFontClass}`}
        style={getButtonStyles()}
    >
        {/* Exchange Icon */}
        <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
        </svg>
        
        {/* Desktop text */}
        <span className="hidden md:block">
            {t('exchange.button_text') || 'Exchange Contact'}
        </span>
        
        {/* Mobile text (shorter) */}
        <span className="block md:hidden text-sm">
            {t('exchange.button_text_short') || 'Exchange'}
        </span>
    </button>
)}
            <ExchangeModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                profileOwnerUsername={username}
                profileOwnerId={userInfo?.userId}
            />
        </>
    );
}