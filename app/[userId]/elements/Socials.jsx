// app/[userId]/elements/Socials.jsx (Updated with click tracking)
import { useSocialsList } from "@/lib/SocialsList";
import { isSuitableForWhiteText } from "@/lib/utilities";
import Image from "next/image";
import Link from "next/link";
import { recordLinkClick } from "@/lib/analytics/linkClickTracker";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { useEffect, useState } from "react";

export default function Socials({ socialArray, themeFontColor, userId }) {
    const SocialsList = useSocialsList(); // Use the translated hook
    const [username, setUsername] = useState("");

    useEffect(() => {
        // Get username for analytics tracking
        async function getUsername() {
            if (userId) {
                try {
                    const userData = await fetchUserData(userId);
                    setUsername(userData?.username || "");
                } catch (error) {
                    console.error("Failed to get username:", error);
                }
            }
        }
        getUsername();
    }, [userId]);

    const handleSocialClick = async (social, socialData) => {
        if (!username) return;

        try {
            const socialUrl = socialData.valueType !== "url" 
                ? `${socialData.baseUrl}${social.value}` 
                : social.value;

            await recordLinkClick(username, {
                linkId: `social_${social.type}_${social.id}`,
                linkTitle: socialData.title,
                linkUrl: socialUrl,
                linkType: "social"
            }, {
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                referrer: typeof window !== 'undefined' ? document.referrer : '',
                recordDetailed: false
            });

            console.log("✅ Social click recorded:", socialData.title);
        } catch (error) {
            console.error("❌ Failed to record social click:", error);
        }
    };

    return (
        <div className="flex gap-2 justify-center flex-wrap max-w-full sArray">
            {socialArray.map((social, index) => {
                if (social.active) {
                    // Find the social data using the type
                    const socialData = SocialsList.find(s => s.type === social.type);
                    
                    if (!socialData) {
                        return null; // Skip if social data not found
                    }

                    const socialUrl = socialData.valueType !== "url" 
                        ? `${socialData.baseUrl}${social.value}` 
                        : social.value;

                    return (
                        <Link
                            key={index}
                            href={socialUrl}
                            target="_blank"
                            className={`hover:scale-[1.25] active:scale-95 min-w-fit sIcon ${isSuitableForWhiteText(themeFontColor) ? "filter invert" : ""}`}
                            onClick={() => handleSocialClick(social, socialData)}
                        >
                            <Image 
                                src={socialData.icon} 
                                alt={socialData.title} 
                                width={40} 
                                height={40} 
                                style={{ filter: "drop-shadow(inset 0 0 10px #fff)" }} 
                            />
                        </Link>
                    )
                }
            })}
        </div>
    );
}