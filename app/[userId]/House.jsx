// app/[userId]/House.jsx
"use client"
import ProfilePic from "./components/ProfilePic";
import UserInfo from "./components/UserInfo";
import BgDiv from "./components/BgDiv";
import MyLinks from "./components/MyLinks";
import SupportBanner from "./components/SupportBanner";
import ExchangeButton from "./components/ExchangeButton";
import React, { useEffect, useState } from "react";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { fireApp } from "@/important/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import SensitiveWarning from "./components/SensitiveWarning";
import { LanguageProvider } from "@/lib/languageContext";
import PublicLanguageSwitcher from "./components/PublicLanguageSwitcher";
import { recordProfileView } from "@/lib/analytics/viewTracker";

export const HouseContext = React.createContext();

export default function House({ userId }) {
    const [sensitiveWarning, setSensitiveWarning] = useState(null);
    const [hasSensitiveContent, setHasSensitiveContent]= useState(false);
    const [sensitiveType, setSensitiveType] = useState(false);
    const [viewRecorded, setViewRecorded] = useState(false);
    const [username, setUsername] = useState("");

    useEffect(() => {
        async function fetchProfilePicture() {
            const currentUser = await fetchUserData(userId);
            const collectionRef = collection(fireApp, "AccountData");
            const docRef = doc(collectionRef, `${currentUser}`);
            const getDocRef = await getDoc(docRef);

            if (getDocRef.exists()) {
                const { sensitiveStatus, sensitivetype, username: profileUsername } = getDocRef.data();
                setSensitiveWarning(sensitiveStatus ? sensitiveStatus : false);
                setHasSensitiveContent(sensitiveStatus ? sensitiveStatus : false);
                setSensitiveType(sensitivetype ? sensitivetype : 3);
                setUsername(profileUsername || userId);
            }
        }
        fetchProfilePicture();
    }, [userId]);

    // Record profile view
    useEffect(() => {
        async function recordView() {
            // Check if this is a preview - don't record views for previews
            const urlParams = new URLSearchParams(window.location.search);
            const isPreview = urlParams.get('preview') === 'true';
            
            if (!viewRecorded && userId && !isPreview) {
                try {
                    // Get some basic viewer info (without compromising privacy)
                    const viewerInfo = {
                        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                        referrer: typeof window !== 'undefined' ? document.referrer : '',
                        recordDetailed: false // Set to true if you want detailed logs
                    };

                    // userId here is actually the username from the URL parameter
                    await recordProfileView(userId, viewerInfo);
                    setViewRecorded(true);
                } catch (error) {
                    console.error("Failed to record view:", error);
                }
            }
        }

        // Record view after a short delay to ensure it's a real view
        const timer = setTimeout(recordView, 2000);
        
        return () => clearTimeout(timer);
    }, [userId, viewRecorded]);

    return (
        <LanguageProvider>
            <PublicLanguageSwitcher />
            <HouseContext.Provider value={{ setSensitiveWarning, sensitiveType }}>
                {!sensitiveWarning ? <>
                    <BgDiv userId={userId} />

                    <div className="relative z-20 md:w-[50rem] w-full flex flex-col items-center h-full mx-auto">
                        <div className="flex flex-col items-center flex-1 overflow-auto py-6">
                            <ProfilePic userId={userId} />
                            <UserInfo userId={userId} hasSensitiveContent={hasSensitiveContent} />
                            <MyLinks userId={userId} hasSensitiveContent={hasSensitiveContent} />
                            
                            {/* Exchange Button */}
                            <div className="w-full px-5 mb-4">
                                <ExchangeButton username={username} />
                            </div>
                        </div>
                    </div>
                    <SupportBanner userId={userId} />
                </>:
                    <SensitiveWarning />}
            </HouseContext.Provider>
        </LanguageProvider>
    )
}