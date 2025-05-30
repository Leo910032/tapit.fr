"use client"
import ProfilePic from "./components/ProfilePic";
import UserInfo from "./components/UserInfo";
import BgDiv from "./components/BgDiv";
import MyLinks from "./components/MyLinks";
import SupportBanner from "./components/SupportBanner";
import React, { useEffect, useState } from "react";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { fireApp } from "@/important/firebase";
import { collection, doc, getDoc } from "firebase/firestore";
import SensitiveWarning from "./components/SensitiveWarning";
import { LanguageProvider } from "@/lib/languageContext";
import PublicLanguageSwitcher from "./components/PublicLanguageSwitcher";

export const HouseContext = React.createContext();

export default function House({ userId }) {
    const [sensitiveWarning, setSensitiveWarning] = useState(null);
    const [hasSensitiveContent, setHasSensitiveContent]= useState(false);
    const [sensitiveType, setSensitiveType] = useState(false);

    useEffect(() => {
        async function fetchProfilePicture() {
            const currentUser = await fetchUserData(userId);;
            const collectionRef = collection(fireApp, "AccountData");
            const docRef = doc(collectionRef, `${currentUser}`);
            const getDocRef = await getDoc(docRef);

            if (getDocRef.exists()) {
                const { sensitiveStatus, sensitivetype } = getDocRef.data();
                setSensitiveWarning(sensitiveStatus ? sensitiveStatus : false);
                setHasSensitiveContent(sensitiveStatus ? sensitiveStatus : false);
                setSensitiveType(sensitivetype ? sensitivetype : 3);
            }

        }
        fetchProfilePicture();
    }, [userId]);

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
                        </div>
                    </div>
                    <SupportBanner userId={userId} />
                </>:
                    <SensitiveWarning />}
            </HouseContext.Provider>
        </LanguageProvider>
    )
}