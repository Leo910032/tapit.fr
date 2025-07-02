// app/components/General Components/NFCLandingNav.jsx
"use client"
import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import LanguageSwitcher from "../LanguageSwitcher/LanguageSwitcher";
import { useTranslation } from "@/lib/useTranslation";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import NFCLoginModal from "./NFCLoginModal";
import NFCSignupModal from "./NFCSignupModal";

export default function NFCLandingNav() {
    const { t } = useTranslation();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [showLoginModal, setShowLoginModal] = useState(false);
    const [showSignupModal, setShowSignupModal] = useState(false);

    useEffect(() => {
        const userId = testForActiveSession();
        setIsLoggedIn(!!userId);
    }, []);

    const handleLogin = () => {
        setShowLoginModal(true);
    };

    const handleSignup = () => {
        setShowSignupModal(true);
    };

    const onLoginSuccess = () => {
        setShowLoginModal(false);
        setIsLoggedIn(true);
    };

    const onSignupSuccess = () => {
        setShowSignupModal(false);
        setIsLoggedIn(true);
    };
    
    return (
        <>
            <div className="w-[96%] justify-between flex items-center rounded-[3rem] py-3 absolute sm:top-4 top-2 z-[9999999999] mdpx-12 sm:px-6 px-3 mx-auto bg-white bg-opacity-[0.1] border backdrop-blur-xl hover:glow-white">
                <Link href={"/"}>
                    <Image src={"https://firebasestorage.googleapis.com/v0/b/lintre-ffa96.firebasestorage.app/o/Logo%2Fimage-removebg-preview.png?alt=media&token=4ac6b2d0-463e-4ed7-952a-2fed14985fc0"} alt="logo" height={70} width={70} className="filter invert" priority />
                </Link>

                <div className="flex items-center gap-3">
                    <LanguageSwitcher />
                    
                    {isLoggedIn ? (
                        <Link 
                            href='/dashboard' 
                            className="p-3 sm:px-6 px-3 bg-blue-600 text-white flex items-center gap-2 rounded-3xl cursor-pointer hover:scale-105 hover:bg-blue-700 active:scale-90"
                        >
                            Dashboard
                        </Link>
                    ) : (
                        <div className="flex items-center gap-2">
                            <button 
                                onClick={handleLogin}
                                className="p-3 sm:px-4 px-3 text-white border border-white/30 rounded-3xl cursor-pointer hover:scale-105 hover:bg-white/10 active:scale-90"
                            >
                                {t('common.login')}
                            </button>
                            <button 
                                onClick={handleSignup}
                                className="p-3 sm:px-4 px-3 bg-themeGreen text-white rounded-3xl cursor-pointer hover:scale-105 hover:bg-gray-100 hover:text-black active:scale-90"
                            >
                                Sign Up
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* Login Modal */}
            {showLoginModal && (
                <NFCLoginModal 
                    onClose={() => setShowLoginModal(false)}
                    onSuccess={onLoginSuccess}
                    onSwitchToSignup={() => {
                        setShowLoginModal(false);
                        setShowSignupModal(true);
                    }}
                />
            )}

            {/* Signup Modal */}
            {showSignupModal && (
                <NFCSignupModal 
                    onClose={() => setShowSignupModal(false)}
                    onSuccess={onSignupSuccess}
                    onSwitchToLogin={() => {
                        setShowSignupModal(false);
                        setShowLoginModal(true);
                    }}
                />
            )}
        </>
    );
}