// app/[userId]/components/MyLinks.jsx (Updated with better link ID passing)
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

export default function MyLinks({ userId, hasSensitiveContent }) {
    const [myLinksArray, setMyLinksArray] = useState([]);
    const [displayLinks, setDisplayLinks] = useState([]);
    const [socialArray, setSocialArray] = useState([]);
    const [socialPosition, setSocialPosition] = useState(null);
    const [themeFontColor, setThemeFontColor] = useState("");
    const [supportGroupStatus, setSupportGroupStatus] = useState(false);
    const [themeTextColour, setThemeTextColour] = useState("");
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
                const { links, themeFontColor, socials, socialPosition, supportBannerStatus, themeTextColour } = docSnapshot.data();
                setThemeTextColour(themeTextColour ? themeTextColour : "");
                setSupportGroupStatus(supportBannerStatus);
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
        setDisplayLinks(
            myLinksArray.filter((link) => link.isActive !== false)
        );
    }, [myLinksArray]);
    
    return (
        <div className={`flex flex-col gap-4 my-4 w-full px-5 py-1 items-center max-h-fit ${supportGroupStatus ? "pb-12" : ""}`}>
            {socialPosition === 0 && socialArray.length > 0 && <Socials themeFontColor={themeFontColor} socialArray={socialArray} userId={userId} />}
            {displayLinks.map((link, index) => {
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
                } else {
                    // Ensure we have a proper linkId - use the link's ID or generate a fallback
                    const linkId = link.id || `link_${index}_${Date.now()}`;
                    
                    // Determine link type more accurately
                    let linkType = "custom";
                    if (link.type === 0) {
                        linkType = "header";
                    } else if (link.urlKind && link.urlKind !== "") {
                        linkType = link.urlKind.toLowerCase();
                    }

                    console.log("🔗 Rendering button:", {
                        linkId,
                        title: link.title,
                        url: link.url,
                        linkType,
                        userId
                    });

                    return (
                        <Button 
                            key={linkId} // Use linkId as key for better React reconciliation
                            content={hasSensitiveContent ? link.title : filterProperly(link.title)} 
                            url={link.url} 
                            userId={userId}
                            linkId={linkId} // Pass the link ID for analytics
                            linkType={linkType} // Pass more specific link type
                        />
                    );
                }
            })}
            {socialPosition === 1 && socialArray.length > 0 && <Socials themeFontColor={themeFontColor} socialArray={socialArray} userId={userId} />}
        </div>
    )
}