// app/[userId]/elements/Button.jsx - UPDATED WITH SESSION TRACKING
"use client"
import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { hexToRgba, makeValidUrl } from "@/lib/utilities";
import { collection, doc, onSnapshot } from "firebase/firestore";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import IconDiv from "./IconDiv";
import "./style/3d.css";
import { getCompanyFromUrl } from "@/lib/BrandLinks";
import { availableFonts_Classic } from "@/lib/FontsList";
import ButtonText from "./ButtonText";
import { FaCopy } from "react-icons/fa6";
import { toast } from "react-hot-toast";
import { useTranslation } from "@/lib/useTranslation";
import { recordLinkClickByUserId, getSessionTrafficData } from "@/lib/analytics/linkClickTracker";

export default function Button({ url, content, userId, linkId, linkType = "custom" }) {
    const [modifierClass, setModifierClass] = useState("");
    const [specialElements, setSpecialElements] = useState(null);
    const [selectedTheme, setSelectedTheme] = useState('');
    const [btnType, setBtnType] = useState(0);
    const [btnShadowColor, setBtnShadowColor] = useState('');
    const [btnFontColor, setBtnFontColor] = useState('');
    const [themeTextColour, setThemeTextColour] = useState("");
    const [btnColor, setBtnColor] = useState('');
    const [accentColor, setAccentColor] = useState([]);
    const [btnFontStyle, setBtnFontStyle] = useState(null);
    const [selectedFontClass, setSelectedFontClass] = useState("");
    const [currentUserId, setCurrentUserId] = useState("");
    const router = useRouter();
    const { t } = useTranslation();

    const [isHovered, setIsHovered] = useState(false);
    const urlRef = useRef(null)

    const [modifierStyles, setModifierStyles] = useState({
        backgroundColor: "",
        color: "",
        boxShadow: "",
    });

    /**
     * ✅ ENHANCED: Link click handler with traffic source tracking
     */
    const handleLinkClick = async (e) => {
        console.log("🔥 Link clicked:", content);
        
        if (!currentUserId) {
            console.warn("⚠️ No user ID available for click tracking");
            return;
        }

        if (!linkId) {
            console.warn("⚠️ No linkId provided for click tracking");
            return;
        }

        try {
            // ✅ NEW: Get current session traffic data
            const trafficData = getSessionTrafficData();
            console.log("🎯 Recording click with traffic source:", trafficData);

            recordLinkClickByUserId(currentUserId, {
                linkId: linkId || `link_${Date.now()}`,
                linkTitle: content,
                linkUrl: url,
                linkType: linkType
            }, {
                userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                referrer: typeof window !== 'undefined' ? document.referrer : '',
                recordDetailed: false,
                // ✅ NEW: Traffic source is now automatically included in the tracker
                // No need to pass it manually as it's handled by getSessionTrafficData()
            }).then(() => {
                console.log("✅ Link click recorded successfully with traffic source:", content);
            }).catch((error) => {
                console.error("❌ Failed to record link click:", error);
            });

        } catch (error) {
            console.error("❌ Failed to record link click:", error);
        }
    };

    /**
     * Copy link functionality
     */
    const handleCopy = (myUrl) => {
        if (myUrl) {
            navigator.clipboard.writeText(myUrl);
            toast.success(
                t('button.link_copied'),
                {
                    style: {
                        border: '1px solid #6fc276',
                        padding: '16px',
                        color: '#6fc276',
                    },
                    iconTheme: {
                        primary: '#6fc276',
                        secondary: '#FFFAEE',
                    },
                }
            );
        }
    };

    /**
     * Extract root domain from URL
     */
    function getRootNameFromUrl(url) {
        try {
            const urlObj = new URL(makeValidUrl(url));
            const rootName = urlObj.hostname;
            return rootName;
        } catch (error) {
            console.log(error.message, url);
            throw new Error(error);
        }
    }

    // Rest of your existing useEffect hooks remain the same...
    useEffect(() => {
        async function fetchInfo() {
            try {
                const currentUser = await fetchUserData(userId);

                if (!currentUser) {
                    router.push("/");
                    return;
                }

                console.log("👤 Current user data:", currentUser);

                let actualUserId = '';

                if (typeof currentUser === 'string') {
                    actualUserId = currentUser;
                    console.log("🆔 Using user ID directly:", actualUserId);
                    setCurrentUserId(actualUserId);
                    
                    const collectionRef = collection(fireApp, "AccountData");
                    const docRef = doc(collectionRef, currentUser);
                    
                    onSnapshot(docRef, (docSnapshot) => {
                        if (docSnapshot.exists()) {
                            const accountData = docSnapshot.data();
                            console.log("📋 Account data:", accountData);
                            
                            const { btnType, btnShadowColor, btnFontColor, themeFontColor, btnColor, selectedTheme, fontType } = accountData;
                            const fontName = availableFonts_Classic[fontType ? fontType - 1 : 0];
                            setSelectedFontClass(fontName?.class || '');
                            setThemeTextColour(themeFontColor ? themeFontColor : "");
                            setBtnColor(btnColor ? btnColor : "#fff");
                            setSelectedTheme(selectedTheme);
                            setBtnFontColor(btnFontColor ? btnFontColor : "#000");
                            setBtnShadowColor(btnShadowColor ? btnShadowColor : "#000");
                            setBtnType(btnType);
                        }
                    });
                } else if (currentUser.userId || currentUser.id) {
                    actualUserId = currentUser.userId || currentUser.id;
                    console.log("🆔 Extracted user ID from object:", actualUserId);
                    setCurrentUserId(actualUserId);
                } else {
                    actualUserId = userId;
                    console.log("🆔 Fallback to userId parameter:", actualUserId);
                    setCurrentUserId(actualUserId);
                }

            } catch (error) {
                console.error("❌ Error in fetchInfo:", error);
            }
        }

        fetchInfo();
    }, [router, userId]);

    // Debug logging
    useEffect(() => {
        console.log("🔍 Button debug info:", {
            currentUserId,
            linkId,
            content,
            url,
            linkType,
            userId,
            sessionTrafficData: getSessionTrafficData()
        });
    }, [currentUserId, linkId, content, url, linkType, userId]);

    // Rest of your existing styling useEffect hooks remain the same...
    // (All the theme and styling logic stays unchanged)

    return (
        selectedTheme !== "New Mario" ? (
        <div
            className={`${modifierClass} userBtn relative justify-between items-center flex hover:scale-[1.025] md:w-[35rem] sm:w-[30rem] w-clamp`}
            style={{...modifierStyles, borderColor: selectedTheme === "Matrix" ? `${themeTextColour}` : ""}}
        >
            <Link
                className={`cursor-pointer flex gap-3 items-center min-h-10 py-3 px-3 flex-1`}
                href={makeValidUrl(url)}
                target="_blank"
                onClick={handleLinkClick}
            >
                {specialElements}
                <IconDiv url={url} />
                <ButtonText btnFontStyle={btnFontStyle} content={content} fontClass={selectedFontClass} />
            </Link>
            <div onClick={()=>handleCopy(url)} className="absolute p-2 h-9 right-3 grid place-items-center aspect-square rounded-full border border-white group cursor-pointer bg-black text-white hover:scale-105 active:scale-90">
                <FaCopy className="rotate-10 group-hover:rotate-0" />
            </div>
        </div>)
        :
        (
        <div className="userBtn relative overflow-x-hidden overflow-y-hidden flex justify-between items-center h-16 md:w-[35rem] sm:w-[30rem] w-clamp">
            {Array(9).fill("").map((_, brick_index) => (
                <Image
                    src={"https://linktree.sirv.com/Images/Scene/Mario/mario-brick.png"}
                    alt="Mario Brick"
                    width={650}
                    key={brick_index}
                    onClick={()=>urlRef.current?.click()}
                    onMouseEnter={()=>setIsHovered(true)}
                    onMouseLeave={()=>setIsHovered(false)}
                    height={660}
                    className="h-16 w-auto object-contain hover:-translate-y-2 cursor-pointer"
                />
            ))}
            <Link
                className={` absolute top-0 left-0 z-30 pointer-events-none cursor-pointer flex gap-3 items-center min-h-10 py-3 px-3 flex-1`}
                href={makeValidUrl(url)}
                target="_blank"
                ref={urlRef}
                onClick={handleLinkClick}
            >
                <div className="grid place-items-center">
                    <Image
                        src={"https://linktree.sirv.com/Images/Scene/Mario/mario-box.png"}
                        alt="Mario Box"
                        width={650}
                        height={660}
                        className={`h-12 w-auto object-contain hover:-translate-y-2 ${isHovered ? "rotate-2" : ""}`}
                    />

                    <div className={`${isHovered ? "rotate-2" : ""} absolute`}>
                        <IconDiv url={url} unique="Mario" />
                    </div>
                </div>
                <ButtonText btnFontStyle={btnFontStyle} content={(<SuperFont text={content} isHovered={isHovered} fontClass={selectedFontClass} />)} fontClass={selectedFontClass} />
            </Link>
            <div onClick={() => handleCopy(url)} className="absolute p-2 h-9 right-3 grid place-items-center aspect-square rounded-full border border-white group cursor-pointer bg-black text-white hover:scale-105 active:scale-90">
                <FaCopy className="rotate-10 group-hover:rotate-0" />
            </div>
        </div>
        )
    );
}

// SuperFont component remains the same
const SuperFont = ({ text, isHovered, fontClass }) => {
    const colors = ['#fff', '#fff', '#fff', '#fff', '#fff'];

    const coloredText = text.split('').map((char, index) => (
        <span className={`${fontClass} md:text-2xl sm:text-xl text-lg drop-shadow-[4px_4px_0px_rgba(0,0,0,1)] bg-transparent`} key={index} style={{ color: isHovered ? "#3b82f6" : colors[index % colors.length] }}>
            {char}
        </span>
    ));

    return <div>{coloredText}</div>;
};