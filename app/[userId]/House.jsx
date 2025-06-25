// app/[userId]/House.jsx - MINIMAL MODIFICATION
"use client"
import ProfilePic from "./components/ProfilePic";
import UserInfo from "./components/UserInfo";
import BgDiv from "./components/BgDiv";
import MyLinks from "./components/MyLinks";
import SupportBanner from "./components/SupportBanner";
import ExchangeButton from "./components/ExchangeButton";
import FileDownloadButton from "./components/FileDownloadButton";
import React, { useEffect, useState } from "react";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { fastUserLookup } from "@/lib/userLookup"; // ✅ Add fast lookup
import { fireApp } from "@/important/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import SensitiveWarning from "./components/SensitiveWarning";
import { LanguageProvider } from "@/lib/languageContext";
import PublicLanguageSwitcher from "./components/PublicLanguageSwitcher";
import { recordProfileView } from "@/lib/analytics/viewTracker";

export const HouseContext = React.createContext();

export default function House({ userId }) {
    const [sensitiveWarning, setSensitiveWarning] = useState(null);
    const [hasSensitiveContent, setHasSensitiveContent] = useState(false);
    const [sensitiveType, setSensitiveType] = useState(false);
    const [viewRecorded, setViewRecorded] = useState(false);
    const [username, setUsername] = useState("");

    // ✅ Add minimal fast lookup state
    const [fastLookupUsed, setFastLookupUsed] = useState(false);
    const [userLookupData, setUserLookupData] = useState(null);

    // ✅ Enhanced fetchUserData function that tries fast lookup first
    const enhancedFetchUserData = async (inputUserId) => {
        console.log('🚀 Enhanced fetchUserData called with:', inputUserId);
        
        try {
            // Try fast lookup first
            const lookupResult = await fastUserLookup(inputUserId);
            
            if (lookupResult && lookupResult.userId) {
                console.log('✅ Fast lookup successful:', lookupResult.userId);
                setFastLookupUsed(true);
                setUserLookupData(lookupResult);
                return lookupResult.userId;
            } else {
                console.log('🔄 Fast lookup failed, using fallback...');
                setFastLookupUsed(false);
                return await fetchUserData(inputUserId);
            }
        } catch (error) {
            console.error('❌ Error in enhanced fetch, using fallback:', error);
            setFastLookupUsed(false);
            return await fetchUserData(inputUserId);
        }
    };

    // ✅ Keep the original useEffect structure but use enhanced fetch
    useEffect(() => {
        async function fetchProfilePicture() {
            try {
                console.log('📊 Starting profile fetch for:', userId);
                const currentUser = await enhancedFetchUserData(userId);
                console.log('✅ Got currentUser:', currentUser);
                
                if (!currentUser) {
                    console.error('❌ No current user found');
                    return;
                }

                const collectionRef = collection(fireApp, "AccountData");
                const docRef = doc(collectionRef, `${currentUser}`);
                const getDocRef = await getDoc(docRef);

                if (getDocRef.exists()) {
                    const { sensitiveStatus, sensitivetype, username: profileUsername } = getDocRef.data();
                    
                    setSensitiveWarning(sensitiveStatus ? sensitiveStatus : false);
                    setHasSensitiveContent(sensitiveStatus ? sensitiveStatus : false);
                    setSensitiveType(sensitivetype ? sensitivetype : 3);
                    
                    // Use the best available username
                    const finalUsername = userLookupData?.username || 
                                        profileUsername || 
                                        userLookupData?.displayName || 
                                        userId;
                    
                    setUsername(finalUsername);
                    
                    console.log('✅ Profile data loaded successfully:', {
                        username: finalUsername,
                        fastLookupUsed: fastLookupUsed
                    });
                } else {
                    console.error('❌ Profile document does not exist for:', currentUser);
                }
            } catch (error) {
                console.error('❌ Error in fetchProfilePicture:', error);
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
                    console.log('📈 Recording profile view with fast lookup data');
                    
                    // Get some basic viewer info (without compromising privacy)
                    const viewerInfo = {
                        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                        referrer: typeof window !== 'undefined' ? document.referrer : '',
                        recordDetailed: false, // Set to true if you want detailed logs
                        fastLookupUsed: fastLookupUsed, // ✅ Include fast lookup info
                        viewedUsername: userLookupData?.username || userId,
                        viewedDisplayName: userLookupData?.displayName
                    };

                    // userId here is actually the username from the URL parameter
                    await recordProfileView(userId, viewerInfo);
                    setViewRecorded(true);
                    console.log('✅ Profile view recorded successfully');
                } catch (error) {
                    console.error("❌ Failed to record view:", error);
                }
            }
        }

        // Record view after a short delay to ensure it's a real view
        const timer = setTimeout(recordView, 2000);
        
        return () => clearTimeout(timer);
    }, [userId, viewRecorded, fastLookupUsed, userLookupData]);

    return (
        <LanguageProvider>
            <PublicLanguageSwitcher />
            
            {/* ✅ Add debug info to see what's happening */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed top-2 right-2 z-50 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                    <div>URL: @{userId}</div>
                    <div>Fast Lookup: {fastLookupUsed ? '✅' : '❌'}</div>
                    <div>Username: {username}</div>
                    {userLookupData && <div>Display: {userLookupData.displayName}</div>}
                </div>
            )}
            
            <HouseContext.Provider value={{ 
                setSensitiveWarning, 
                sensitiveType,
                userInfo: userLookupData, // ✅ Pass lookup data to context
                fastLookupUsed
            }}>
                {!sensitiveWarning ? (
                    <>
                        {/* ✅ Keep original component structure - no changes needed */}
                        <BgDiv userId={userId} />

                        <div className="relative z-20 md:w-[50rem] w-full flex flex-col items-center h-full mx-auto">
                            <div className="flex flex-col items-center flex-1 overflow-auto py-6">
                                <ProfilePic userId={userId} />
                                <UserInfo userId={userId} hasSensitiveContent={hasSensitiveContent} />
                                <MyLinks userId={userId} hasSensitiveContent={hasSensitiveContent} />
                                
                                {/* ✅ File Download Button - Only shows if user has uploaded a file */}
                                <FileDownloadButton userId={userId} />
                                
                                {/* Exchange Button */}
                                <div className="w-full px-5 mb-4">
                                    <ExchangeButton 
                                        username={username} 
                                        userInfo={userLookupData}
                                        fastLookupUsed={fastLookupUsed}
                                    />
                                </div>
                            </div>
                        </div>
                        <SupportBanner userId={userId} />
                    </>
                ) : (
                    <SensitiveWarning />
                )}
            </HouseContext.Provider>
        </LanguageProvider>
    );
}