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

    // Generate button classes based on theme
    const getButtonClasses = () => {
        let baseClasses = "w-full font-semibold py-3 px-3 md:px-6 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2";
        
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
            // Get brand color based on Exchange button (similar to main buttons)
            return {
                color: "#fff",
                backgroundColor: "#007bff" // Blue color for exchange
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

        // Debug log to check if styles are being applied
        console.log("🎨 Exchange Button Styles:", styles, "Button Type:", btnType, "Theme:", selectedTheme);

        return styles;
    };

    return (
        <>
            {/* Debug info - remove this after fixing */}
            {process.env.NODE_ENV === 'development' && (
                <div className="text-xs text-gray-500 mb-1">
                    ExchangeButton Debug: Type={btnType}, Color={btnColor}, Theme={selectedTheme}, UserId={userId ? '✓' : '✗'}
                </div>
            )}
            
            {selectedTheme === "New Mario" ? (
                // Mario theme special button - FIXED VERSION
                <div className="userBtn relative overflow-x-hidden overflow-y-hidden flex justify-between items-center h-16 md:w-[35rem] sm:w-[30rem] w-clamp">
                    {/* Mario brick background */}
                    {Array(9).fill("").map((_, brick_index) => (
                        <img
                            key={brick_index}
                            src="https://linktree.sirv.com/Images/Scene/Mario/mario-brick.png"
                            alt="Mario Brick"
                            className="h-16 w-auto object-contain hover:-translate-y-2 cursor-pointer transition-transform"
                        />
                    ))}
                    
                    {/* Button content overlay - FIXED POSITIONING */}
                    <div 
                        className="absolute top-0 left-0 z-30 w-full h-full flex items-center cursor-pointer pointer-events-none"
                        onClick={() => setIsModalOpen(true)}
                    >
                        {/* Left side - Mario Box with icon */}
                        <div className="flex items-center gap-3 px-3">
                            <div className="grid place-items-center relative">
                                <img
                                    src="https://linktree.sirv.com/Images/Scene/Mario/mario-box.png"
                                    alt="Mario Box"
                                    className="h-12 w-auto object-contain"
                                />
                                <div className="absolute">
                                    <svg className="w-6 h-6 text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                    </svg>
                                </div>
                            </div>
                            
                            {/* Mario-style text */}
                            <div className="text-white font-bold MariaFont md:text-2xl sm:text-xl text-lg drop-shadow-[4px_4px_0px_rgba(0,0,0,1)]">
                                <span className="hidden md:block">
                                    {t('exchange.button_text') || 'Exchange Contact'}
                                </span>
                                <span className="block md:hidden">
                                    Exchange
                                </span>
                            </div>
                        </div>
                        
                        {/* Right side - Copy button */}
                        <div className="absolute right-3 p-2 h-9 aspect-square rounded-full border border-white bg-black text-white hover:scale-105 active:scale-90 pointer-events-auto grid place-items-center">
                            <svg className="w-4 h-4 rotate-10 group-hover:rotate-0" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z"></path>
                                <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z"></path>
                            </svg>
                        </div>
                    </div>
                    
                    {/* Main clickable overlay */}
                    <div 
                        className="absolute top-0 left-0 w-full h-full cursor-pointer z-20"
                        onClick={() => setIsModalOpen(true)}
                    />
                </div>
            ) : (
                // Regular themed button with proper container for 3D Blocks
                <div className={selectedTheme === "3D Blocks" ? "userBtn md:w-[35rem] sm:w-[30rem] w-clamp" : ""}>
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
                </div>
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