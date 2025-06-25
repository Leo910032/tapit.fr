// app/[userId]/House.jsx - Enhanced with Fast Lookup
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
import { fastUserLookup } from "@/lib/userLookup"; // ✅ Import fast lookup
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
    
    // ✅ Add fast lookup states
    const [userInfo, setUserInfo] = useState(null);
    const [actualUserId, setActualUserId] = useState(null);
    const [loadingUser, setLoadingUser] = useState(true);
    const [fastLookupUsed, setFastLookupUsed] = useState(false);

    // ✅ Fast lookup effect
    useEffect(() => {
        async function performFastLookup() {
            console.log('⚡ Starting fast lookup for public profile:', userId);
            setLoadingUser(true);
            
            try {
                // Try fast lookup first
                const lookupResult = await fastUserLookup(userId);
                
                if (lookupResult) {
                    console.log('✅ Fast lookup successful for public profile:', {
                        username: lookupResult.username,
                        displayName: lookupResult.displayName,
                        userId: lookupResult.userId
                    });
                    
                    setUserInfo(lookupResult);
                    setActualUserId(lookupResult.userId);
                    setUsername(lookupResult.username);
                    setFastLookupUsed(true);
                } else {
                    console.log('❌ Fast lookup failed, using fallback...');
                    
                    // Fallback to regular fetchUserData
                    const fallbackUserId = await fetchUserData(userId);
                    if (fallbackUserId) {
                        setActualUserId(fallbackUserId);
                        setUsername(userId); // Use the URL username as fallback
                        setFastLookupUsed(false);
                    } else {
                        console.error('❌ User not found in fallback lookup');
                        // Could redirect to 404 or show error state
                        return;
                    }
                }
            } catch (error) {
                console.error('❌ Error in user lookup:', error);
                
                // Final fallback
                try {
                    const fallbackUserId = await fetchUserData(userId);
                    if (fallbackUserId) {
                        setActualUserId(fallbackUserId);
                        setUsername(userId);
                        setFastLookupUsed(false);
                    }
                } catch (fallbackError) {
                    console.error('❌ Fallback lookup also failed:', fallbackError);
                }
            } finally {
                setLoadingUser(false);
            }
        }

        performFastLookup();
    }, [userId]);

    // ✅ Profile data fetching - now depends on actualUserId from fast lookup
    useEffect(() => {
        async function fetchProfileData() {
            if (!actualUserId) {
                console.log('⏳ Waiting for user ID resolution...');
                return;
            }

            console.log('📊 Fetching profile data for resolved user ID:', actualUserId);
            
            try {
                const collectionRef = collection(fireApp, "AccountData");
                const docRef = doc(collectionRef, actualUserId);
                const getDocRef = await getDoc(docRef);

                if (getDocRef.exists()) {
                    const { 
                        sensitiveStatus, 
                        sensitivetype, 
                        username: profileUsername,
                        displayName 
                    } = getDocRef.data();
                    
                    setSensitiveWarning(sensitiveStatus || false);
                    setHasSensitiveContent(sensitiveStatus || false);
                    setSensitiveType(sensitivetype || 3);
                    
                    // Use the best available username/display name
                    const finalUsername = userInfo?.username || 
                                        profileUsername || 
                                        userInfo?.displayName || 
                                        displayName || 
                                        userId;
                    
                    setUsername(finalUsername);
                    
                    console.log('✅ Profile data loaded:', {
                        username: finalUsername,
                        sensitiveContent: sensitiveStatus,
                        fastLookupUsed: fastLookupUsed
                    });
                } else {
                    console.error('❌ Profile document not found for user:', actualUserId);
                }
            } catch (error) {
                console.error('❌ Error fetching profile data:', error);
            }
        }

        fetchProfileData();
    }, [actualUserId, userInfo, fastLookupUsed, userId]);

    // ✅ Enhanced profile view recording with user info
    useEffect(() => {
        async function recordView() {
            // Wait for user resolution and check preview mode
            if (!actualUserId || loadingUser) {
                return;
            }
            
            const urlParams = new URLSearchParams(window.location.search);
            const isPreview = urlParams.get('preview') === 'true';
            
            if (!viewRecorded && !isPreview) {
                try {
                    console.log('📈 Recording profile view for:', {
                        userId: actualUserId,
                        username: userInfo?.username || userId,
                        fastLookupUsed: fastLookupUsed
                    });
                    
                    const viewerInfo = {
                        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                        referrer: typeof window !== 'undefined' ? document.referrer : '',
                        recordDetailed: false,
                        fastLookupUsed: fastLookupUsed,
                        viewedUsername: userInfo?.username || userId,
                        viewedDisplayName: userInfo?.displayName
                    };

                    // Use the actual username for analytics (from URL)
                    await recordProfileView(userId, viewerInfo);
                    setViewRecorded(true);
                    
                    console.log('✅ Profile view recorded successfully');
                } catch (error) {
                    console.error("❌ Failed to record view:", error);
                }
            }
        }

        const timer = setTimeout(recordView, 2000);
        return () => clearTimeout(timer);
    }, [actualUserId, userInfo, userId, viewRecorded, loadingUser, fastLookupUsed]);

    // ✅ Loading state while resolving user
    if (loadingUser) {
        return (
            <LanguageProvider>
                <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-50">
                    <div className="flex flex-col items-center space-y-4">
                        <div className="relative">
                            <div className="w-12 h-12 border-4 border-blue-200 rounded-full animate-spin"></div>
                            <div className="absolute top-0 left-0 w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                        </div>
                        <div className="text-center">
                            <p className="text-lg font-medium text-gray-700">
                                Loading @{userId}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {fastLookupUsed ? 'Fast lookup enabled ⚡' : 'Resolving profile...'}
                            </p>
                        </div>
                    </div>
                </div>
            </LanguageProvider>
        );
    }

    // ✅ Error state if user not found
    if (!actualUserId) {
        return (
            <LanguageProvider>
                <div className="w-screen h-screen flex items-center justify-center bg-gradient-to-br from-red-50 to-pink-50">
                    <div className="text-center">
                        <div className="text-6xl mb-4">😔</div>
                        <h1 className="text-2xl font-bold text-gray-800 mb-2">
                            Profile Not Found
                        </h1>
                        <p className="text-gray-600 mb-4">
                            Sorry, we couldn't find a profile for @{userId}
                        </p>
                        <button 
                            onClick={() => window.history.back()}
                            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Go Back
                        </button>
                    </div>
                </div>
            </LanguageProvider>
        );
    }

    return (
        <LanguageProvider>
            <PublicLanguageSwitcher />
            
            {/* ✅ Debug info in development */}
            {process.env.NODE_ENV === 'development' && (
                <div className="fixed top-2 right-2 z-50 bg-black bg-opacity-75 text-white text-xs p-2 rounded">
                    <div>URL: @{userId}</div>
                    <div>UserID: {actualUserId}</div>
                    <div>Fast Lookup: {fastLookupUsed ? '✅' : '❌'}</div>
                    {userInfo && <div>Display: {userInfo.displayName}</div>}
                </div>
            )}
            
            <HouseContext.Provider value={{ 
                setSensitiveWarning, 
                sensitiveType,
                userInfo,
                fastLookupUsed,
                actualUserId
            }}>
                {!sensitiveWarning ? (
                    <>
                        <BgDiv userId={actualUserId} />

                        <div className="relative z-20 md:w-[50rem] w-full flex flex-col items-center h-full mx-auto">
                            <div className="flex flex-col items-center flex-1 overflow-auto py-6">
                                <ProfilePic userId={actualUserId} />
                                <UserInfo 
                                    userId={actualUserId} 
                                    hasSensitiveContent={hasSensitiveContent}
                                    userInfo={userInfo}
                                    fastLookupUsed={fastLookupUsed}
                                />
                                <MyLinks 
                                    userId={actualUserId} 
                                    hasSensitiveContent={hasSensitiveContent}
                                />
                                
                                {/* File Download Button */}
                                <FileDownloadButton userId={actualUserId} />
                                
                                {/* Exchange Button */}
                                <div className="w-full px-5 mb-4">
                                    <ExchangeButton 
                                        username={username}
                                        userInfo={userInfo}
                                        fastLookupUsed={fastLookupUsed}
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <SupportBanner userId={actualUserId} />
                    </>
                ) : (
                    <SensitiveWarning />
                )}
            </HouseContext.Provider>
        </LanguageProvider>
    );
}