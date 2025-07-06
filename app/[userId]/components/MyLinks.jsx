// app/[userId]/components/MyLinks.jsx - Updated with System Button Support
"use client"

import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react"
import Button from "../elements/Button";
import { useRouter } from "next/navigation";
import Socials from "../elements/Socials";
import Filter from "bad-words";
import { filterProperly } from "@/lib/utilities";
import ExchangeButton from "./ExchangeButton";
import SaveContactButton from "./SaveContactButton";
import FileDownloadButton from "./FileDownloadButton";

export default function MyLinks({ userId, hasSensitiveContent }) {
    const [myLinksArray, setMyLinksArray] = useState([]);
    const [displayLinks, setDisplayLinks] = useState([]);
    const [socialArray, setSocialArray] = useState([]);
    const [socialPosition, setSocialPosition] = useState(null);
    const [themeFontColor, setThemeFontColor] = useState("");
    const [supportGroupStatus, setSupportGroupStatus] = useState(false);
    const [themeTextColour, setThemeTextColour] = useState("");
    const [profileFile, setProfileFile] = useState(null);
    const [username, setUsername] = useState("");
    const [userInfo, setUserInfo] = useState(null);
    const router = useRouter();
    const filter = new Filter();

    useEffect(() => {
        async function fetchInfo() {
            const currentUser = await fetchUserData(userId);

            if (!currentUser) {
                router.push("/");
                return;
            }

            const collectionRef = collection(fireApp, "AccountData");
            const docRef = doc(collectionRef, `${currentUser}`);

            onSnapshot(docRef, (docSnapshot) => {
                if (!docSnapshot.exists()) {
                    return;
                }
                
                const data = docSnapshot.data();
                const { 
                    links, 
                    themeFontColor, 
                    socials, 
                    socialPosition, 
                    supportBannerStatus, 
                    themeTextColour,
                    profileFile,
                    displayName,
                    username: userUsername
                } = data;

                setThemeTextColour(themeTextColour ? themeTextColour : "");
                setSupportGroupStatus(supportBannerStatus);
                setProfileFile(profileFile || null);
                setUsername(userUsername || userId);
                setUserInfo({ userId: currentUser, username: userUsername, displayName });
                
                const rtLinks = links ? links : [];
                setSocialArray(socials ? socials : []);
                setMyLinksArray(rtLinks);
                setSocialPosition(socialPosition ? socialPosition : 0);
                setThemeFontColor(themeFontColor ? themeFontColor : "");
            });
        }

        fetchInfo();
    }, [router, userId]);

    useEffect(() => {
        // Filter active links and render appropriate components
        const activeLinks = myLinksArray.filter((link) => link.isActive !== false);
        setDisplayLinks(activeLinks);
    }, [myLinksArray]);

    const renderLinkItem = (link, index) => {
        // Handle system buttons
        if (link.type === 'system' || link.isSystem) {
            switch (link.systemType) {
                case 'exchange':
                    return (
                        <ExchangeButton 
                            key={link.id}
                            username={username} 
                            userInfo={userInfo}
                            fastLookupUsed={false}
                            userId={userId}
                        />
                    );
                
                case 'save_contact':
                    return (
                        <SaveContactButton 
                            key={link.id}
                            userId={userId} 
                        />
                    );
                
                case 'file_download':
                    // Only render if file exists
                    return profileFile ? (
                        <FileDownloadButton 
                            key={link.id}
                            userId={userId} 
                        />
                    ) : null;
                
                default:
                    return null;
            }
        }

        // Handle header text
        if (link.type === 0) {
            return (
                <span 
                    key={index} 
                    style={{color: `${themeFontColor === "#000" ? themeTextColour : themeFontColor}`}} 
                    className="mx-auto font-semibold text-sm mt-2"
                >
                    {hasSensitiveContent ? link.title : filterProperly(link.title)}
                </span>
            );
        }

        // Handle regular links
        const linkId = link.id || `link_${index}_${Date.now()}`;
        let linkType = "custom";
        
        if (link.type === 0) {
            linkType = "header";
        } else if (link.urlKind && link.urlKind !== "") {
            linkType = link.urlKind.toLowerCase();
        }

        return (
            <Button 
                key={linkId}
                content={hasSensitiveContent ? link.title : filterProperly(link.title)} 
                url={link.url} 
                userId={userId}
                linkId={linkId}
                linkType={linkType}
            />
        );
    };
    
    return (
        <div className={`flex flex-col gap-4 my-4 w-full px-5 py-1 items-center max-h-fit ${supportGroupStatus ? "pb-12" : ""}`}>
            {socialPosition === 0 && socialArray.length > 0 && (
                <Socials 
                    themeFontColor={themeFontColor} 
                    socialArray={socialArray} 
                    userId={userId} 
                />
            )}
            
            {displayLinks.map((link, index) => renderLinkItem(link, index))}
            
            {socialPosition === 1 && socialArray.length > 0 && (
                <Socials 
                    themeFontColor={themeFontColor} 
                    socialArray={socialArray} 
                    userId={userId} 
                />
            )}
        </div>
    )
}