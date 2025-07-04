"use client"

import { fireApp } from "@/important/firebase";
import { SupportGroups } from "@/lib/SupportGroups";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/useTranslation";

export default function SupportBanner({ userId }) {
    const { t } = useTranslation();
    const [supportGroup, setSupportGroup] = useState(0);
    const [supportGroupStatus, setSupportGroupStatus] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const [bgType, setBgType] = useState("");
    const [themeTextColour, setThemeTextColour] = useState("");
    // Helper function to get support group translations
    const getSupportGroupText = (type, field) => {
        const supportKeys = [
            'support_groups.support_creator',
            'support_groups.free_palestine', 
            'support_groups.stand_with_ukraine',
            'support_groups.anti_racism',
            'support_groups.pride'
        ];
        
        if (supportKeys[supportGroup]) {
            const translationKey = `${supportKeys[supportGroup]}.${field}`;
            console.log('Translation key:', translationKey, 'Result:', t(translationKey));
            return t(translationKey);
        }
        
        // Fallback to original if translation key doesn't exist
        console.log('Using fallback for supportGroup:', supportGroup, 'field:', field);
        return SupportGroups[supportGroup]?.[field] || '';
    };

    useEffect(() => {
        async function fetchProfilePicture() {
            const currentUser = await fetchUserData(userId);;
            const collectionRef = collection(fireApp, "AccountData");
            const docRef = doc(collectionRef, `${currentUser}`);

            onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const { themeFontColor, selectedTheme, supportBanner, supportBannerStatus } = docSnap.data();
                    setSupportGroup(supportBanner ? supportBanner : 0);
                    setSupportGroupStatus(supportBannerStatus ? supportBannerStatus : false);
                    setBgType(selectedTheme);
                    setThemeTextColour(themeFontColor ? themeFontColor : "");

                    setTimeout(() => {
                        setExpanded(true);
                    }, 1000);
                }
            });
        }
        fetchProfilePicture();
    }, [userId]);
    
    return (
        <>
            {supportGroupStatus && <div className="fixed bottom-0 w-screen left-0 z-[100]">
                <div className="py-4 px-6 bg-black absolute left-0 w-full bottom-0 text-white banner flex flex-col items-center border-t border-t-green-400/50 shadow-xl" style={{
                    color: bgType === "Matrix" ? themeTextColour : "",
                    backgroundColor: bgType === "Matrix" ? '#000905' : "",
                }}>
                    <div className={`filter invert ${expanded ? "" : "rotate-180"} top-6 absolute right-6 cursor-pointer`}>
                        <Image
                            src={"https://linktree.sirv.com/Images/icons/arr.svg"}
                            alt="logo"
                            height={15}
                            onClick={() => setExpanded(!expanded)}
                            width={15}
                        />
                    </div>
                    {!expanded && <div onClick={() => setExpanded(true)} className="w-full text-center cursor-pointer">
                        <span className="font-semibold max-w-[20rem]">
                            {getSupportGroupText(supportGroup, 'title')}
                        </span>
                    </div>}
                    <div className={`flex flex-col text-center w-full gap-5 pt-2 items-center overflow-hidden ${expanded ? "openBanner" : "closeBanner"}`}
                    >
                        <div className="h-fit aspect-square rounded-full overflow-hidden">
                            <Image src={"https://linktree.sirv.com/Images/icons/logo.gif"} alt="logo" height={60} width={60} />
                        </div>
                        <span className="font-semibold max-w-[20rem]">
                            {getSupportGroupText(supportGroup, 'title')}
                        </span>
                        <span className="text-sm max-w-[20rem]">
                            {getSupportGroupText(supportGroup, 'message')}
                        </span>
                        <Link
                            href={SupportGroups[supportGroup].linkTo}
                            target="_blank"
                            className="sm:max-w-[30rem] w-full p-3 bg-white text-black font-semibold rounded-2xl uppercase hover:scale-105 active:scale-95 mt-2"
                        >
                            {t('support.act_now')}
                        </Link>
                    </div>
                </div>
            </div>}
        </>
    );
}