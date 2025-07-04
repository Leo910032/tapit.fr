"use client"
import Image from "next/image";
import SocialCard from "./mini components/SocialCard";
import { useEffect, useState } from "react";
import React from "react";
import Position from "../elements/Position";
import Link from "next/link";
import AddIconModal from "../elements/AddIconModal";
import EditIconModal from "../elements/EditIconModal";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { fireApp } from "@/important/firebase";
import { updateSocials } from "@/lib/update data/updateSocials";
import { useTranslation } from "@/lib/useTranslation";

export const SocialContext = React.createContext();

export default function SocialSetting() {
    const { t } = useTranslation();
    const [addIconModalOpen, setAddIconModalOpen] = useState(false);
    const [settingIconModalOpen, setSettingIconModalOpen] = useState({
        status: false,
        type: 0,
        operation: 0,
        active: false
    });
    const [socialsArray, setSocialsArray] = useState([]);
    const [hasLoaded, setHasLoaded] = useState(false);

    useEffect(() => {
        function fetchLinks() {
            const currentUser = testForActiveSession();
            const collectionRef = collection(fireApp, "AccountData");
            const docRef = doc(collectionRef, `${currentUser}`);

            onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const { socials } = docSnap.data();
                    setSocialsArray(socials ? socials : []);
                }
            });
        }

        fetchLinks();
    }, []);

    useEffect(() => {
        if (!hasLoaded) {
            setHasLoaded(true);
            return;
        }
        updateSocials(socialsArray);
    }, [socialsArray, hasLoaded]);

    return (
        <SocialContext.Provider value={{ socialsArray, setSocialsArray, setSettingIconModalOpen, setAddIconModalOpen, settingIconModalOpen }}>
            <div className="w-full my-4 px-2" id="Settings--SocialLinks">
                <div className="flex items-center gap-3 py-4">
                    <Image
                        src={"https://linktree.sirv.com/Images/icons/social.svg"}
                        alt="icon"
                        height={24}
                        width={24}
                    />
                    <span className="text-xl font-semibold">{t('social.social_icons')}</span>
                </div>
                <div className="p-5 bg-white rounded-lg">
                    <div className="grid gap-1">
                        <span className="font-semibold">{t('social.be_iconic')}</span>
                        <span className="opacity-90 sm:text-base text-sm">{t('social.add_icons_description')}</span>
                    </div>
                    <div className="w-fit rounded-3xl bg-btnPrimary hover:bg-btnPrimaryAlt text-white py-3 px-4 my-7 cursor-pointer active:scale-90 select-none" onClick={()=>setAddIconModalOpen(true)}>
                        {t('social.add_icon')}
                    </div>
                    {socialsArray.length > 0 && <div>
                        <SocialCard array={socialsArray} />
                        <p className="my-4 opacity-60 text-sm">{t('social.drag_drop_reorder')}</p>
                        <div className="grid gap-1 text-sm mt-5">
                            <span className="font-semibold">{t('social.position')}</span>
                            <span className="opacity-90">{t('social.display_icons_at')}</span>
                        </div>
                        <Position />
                    </div>}
                    {/* <Link className="text-btnPrimary active:text-btnPrimaryAlt underline mt-3" href={"/dashboard/analytics"}>{t('social.see_analytics')}</Link> */}
                </div>
                {addIconModalOpen && <AddIconModal />}
                {settingIconModalOpen.status && <EditIconModal />}

            </div>
        </SocialContext.Provider>
    );
}