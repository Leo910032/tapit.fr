// app/[userId]/components/FileDownloadButton.jsx - COMPLETE WITH THEME SUPPORT
"use client"
import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/useTranslation";
import { FaDownload, FaFileAlt } from "react-icons/fa6";
import { recordLinkClick } from "@/lib/analytics/linkClickTracker";
import { hexToRgba } from "@/lib/utilities";

export default function FileDownloadButton({ userId }) {
    const { t } = useTranslation();
    const [profileFile, setProfileFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [username, setUsername] = useState("");
    
    // Theme state
    const [btnType, setBtnType] = useState(0);
    const [btnShadowColor, setBtnShadowColor] = useState('');
    const [btnFontColor, setBtnFontColor] = useState('');
    const [btnColor, setBtnColor] = useState('');
    const [selectedTheme, setSelectedTheme] = useState('');
    const [themeTextColour, setThemeTextColour] = useState("");

    // Get file icon based on file type
    const getFileIcon = (fileName) => {
        const extension = fileName?.split('.').pop()?.toLowerCase();
        switch (extension) {
            case 'pdf':
                return '📄';
            case 'doc':
            case 'docx':
                return '📝';
            case 'xls':
            case 'xlsx':
                return '📊';
            case 'ppt':
            case 'pptx':
                return '📽️';
            case 'txt':
                return '📃';
            default:
                return '📎';
        }
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const getButtonClasses = () => {
        let baseClasses = "w-full font-semibold py-3 px-6 transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3";
        
        if (selectedTheme === "3D Blocks") {
            return `${baseClasses} relative after:absolute after:h-2 after:w-[100.5%] after:bg-black bg-white after:-bottom-2 after:left-[1px] after:skew-x-[57deg] after:ml-[2px] before:absolute before:h-[107%] before:w-3 before:bg-[currentColor] before:top-[1px] before:border-2 before:border-black before:-right-3 before:skew-y-[30deg] before:grid before:grid-rows-2 border-2 border-black inset-2 ml-[-20px] btn`;
        }
        
        if (selectedTheme === "New Mario") {
            return `${baseClasses} relative overflow-hidden h-16 mario-button`;
        }
        
        switch (btnType) {
            case 0: 
                return `${baseClasses}`;
            case 1: 
                return `${baseClasses} rounded-lg`;
            case 2: 
                return `${baseClasses} rounded-3xl`;
            case 3: 
                return `${baseClasses} border border-black bg-opacity-0`;
            case 4: 
                return `${baseClasses} border border-black rounded-lg bg-opacity-0`;
            case 5: 
                return `${baseClasses} border border-black rounded-3xl bg-opacity-0`;
            case 6: 
                return `${baseClasses} bg-white border border-black`;
            case 7: 
                return `${baseClasses} bg-white border border-black rounded-lg`;
            case 8: 
                return `${baseClasses} bg-white border border-black rounded-3xl`;
            case 9: 
                return `${baseClasses} bg-white`;
            case 10: 
                return `${baseClasses} bg-white rounded-lg`;
            case 11: 
                return `${baseClasses} bg-white rounded-3xl`;
            case 15: 
                return `${baseClasses} border border-black bg-black rounded-3xl`;
            default:
                return baseClasses;
        }
    };

    const getButtonStyles = () => {
        // Special handling for 3D Blocks theme
        if (selectedTheme === "3D Blocks") {
            return {
                color: "#fff",
                backgroundColor: "#3B82F6" // Blue color for file download button
            };
        }
        
        if (selectedTheme === "New Mario") {
            return {
                color: "#fff",
                backgroundColor: "transparent",
                backgroundImage: `url('https://linktree.sirv.com/Images/Scene/Mario/mario-brick.png')`,
                backgroundSize: "cover",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "center"
            };
        }
        
        let styles = {
            color: btnFontColor || "#000",
            backgroundColor: btnColor || "#fff"
        };

        switch (btnType) {
            case 6:
            case 7:
            case 8:
                styles.boxShadow = `4px 4px 0 0 ${hexToRgba(btnShadowColor)}`;
                break;
            case 9:
            case 10:
            case 11:
                styles.boxShadow = `0 4px 4px 0 ${hexToRgba(btnShadowColor, 0.16)}`;
                break;
            case 12:
            case 13:
            case 15:
                styles.color = "#fff";
                styles.backgroundColor = "#000";
                break;
            default:
                // Default gradient for file download if no theme styles
                if (!btnColor || btnColor === "#fff") {
                    styles.background = "linear-gradient(135deg, #10B981 0%, #3B82F6 100%)";
                    styles.color = "#fff";
                }
                break;
        }

        // Matrix theme override
        if (selectedTheme === "Matrix") {
            styles.borderColor = themeTextColour;
        }

        return styles;
    };

    const handleDownload = async () => {
        if (!profileFile?.url) return;

        try {
            // Track the file download as a link click
            if (username) {
                await recordLinkClick(username, {
                    linkId: `file_download_${profileFile.name}`,
                    linkTitle: `Download ${profileFile.name}`,
                    linkUrl: profileFile.url,
                    linkType: "file_download"
                }, {
                    userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : '',
                    referrer: typeof window !== 'undefined' ? document.referrer : '',
                    recordDetailed: false
                });
            }

            // Open file in new tab for download
            window.open(profileFile.url, '_blank');
        } catch (error) {
            console.error('❌ Failed to track file download:', error);
            // Still allow the download even if tracking fails
            window.open(profileFile.url, '_blank');
        }
    };

    useEffect(() => {
        async function fetchThemeAndFileData() {
            try {
                const currentUser = await fetchUserData(userId);
                if (!currentUser) {
                    setIsLoading(false);
                    return;
                }

                // Get username for analytics
                setUsername(currentUser.username || userId);

                const collectionRef = collection(fireApp, "AccountData");
                const docRef = doc(collectionRef, currentUser);

                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const data = docSnap.data();
                        
                        // Set theme data
                        setBtnType(data.btnType || 0);
                        setBtnShadowColor(data.btnShadowColor || "#000");
                        setBtnFontColor(data.btnFontColor || "#000");
                        setBtnColor(data.btnColor || "#fff");
                        setSelectedTheme(data.selectedTheme || '');
                        setThemeTextColour(data.themeFontColor || "");
                        
                        // Set file data
                        setProfileFile(data.profileFile || null);
                    } else {
                        setProfileFile(null);
                    }
                    setIsLoading(false);
                });

                return () => unsubscribe();
            } catch (error) {
                console.error("Error fetching profile file:", error);
                setIsLoading(false);
            }
        }

        fetchThemeAndFileData();
    }, [userId]);

    // Don't render anything if no file or still loading
    if (isLoading || !profileFile) {
        return null;
    }

    return (
        <div className="w-full px-5 mb-4">
            {selectedTheme === "New Mario" ? (
                <div className="userBtn relative overflow-x-hidden overflow-y-hidden flex justify-between items-center h-16 w-full">         
                    {/* Mario brick background - 9 bricks for full width file button */}
                    {Array(9).fill("").map((_, brick_index) => (
                        <img
                            key={brick_index}
                            src="https://linktree.sirv.com/Images/Scene/Mario/mario-brick.png"
                            alt="Mario Brick"
                            onClick={handleDownload}
                            className="h-full w-auto object-contain hover:-translate-y-2 cursor-pointer transition-transform"
                        />
                    ))}
                    
                    {/* Mario box with file icon */}
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2 z-30">
                        <div className="relative">
                            <img
                                src="https://linktree.sirv.com/Images/Scene/Mario/mario-box.png"
                                alt="Mario Box"
                                className="h-12 w-auto object-contain hover:-translate-y-2 hover:rotate-2 transition-all cursor-pointer"
                                onClick={handleDownload}
                            />
                            {/* File icon inside the box */}
                            <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-2xl">{getFileIcon(profileFile.name)}</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Button text overlay */}
                    <div 
                        className="absolute top-0 left-0 z-20 w-full h-full flex items-center justify-center cursor-pointer text-white font-bold"
                        onClick={handleDownload}
                        style={{ 
                            textShadow: '4px 4px 0px rgba(0,0,0,1)',
                            fontSize: 'clamp(0.875rem, 2.5vw, 1.25rem)',
                            paddingLeft: '4rem' // Space for the box
                        }}
                    >
                        <div className="flex flex-col items-center">
                            <span className="text-sm font-semibold">
                                {t('file_download.download_file') || 'Download File'}
                            </span>
                            <div className="text-xs opacity-90 truncate">
                                {profileFile.name} • {formatFileSize(profileFile.size)}
                            </div>
                        </div>
                    </div>
                    
                    {/* Download icon */}
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2 z-30">
                        <FaDownload className="w-5 h-5 text-white drop-shadow-[2px_2px_0px_rgba(0,0,0,1)]" />
                    </div>
                </div>
            ) : selectedTheme === "3D Blocks" ? (
                <div className="userBtn relative justify-between items-center flex hover:scale-[1.025] w-full">
                    <button
                        onClick={handleDownload}
                        className={getButtonClasses()}
                        style={getButtonStyles()}
                    >
                        {/* File icon */}
                        <span className="text-2xl">{getFileIcon(profileFile.name)}</span>
                        
                        <div className="flex-1 text-left">
                            <div className="flex items-center gap-2">
                                <FaDownload className="w-4 h-4" />
                                <span className="text-sm font-semibold">
                                    {t('file_download.download_file') || 'Download File'}
                                </span>
                            </div>
                            <div className="text-xs opacity-90 truncate">
                                {profileFile.name} • {formatFileSize(profileFile.size)}
                            </div>
                        </div>
                    </button>
                </div>
            ) : (
                <button
                    onClick={handleDownload}
                    className={getButtonClasses()}
                    style={getButtonStyles()}
                >
                    {/* File icon */}
                    <span className="text-2xl">{getFileIcon(profileFile.name)}</span>
                    
                    <div className="flex-1 text-left">
                        <div className="flex items-center gap-2">
                            <FaDownload className="w-4 h-4" />
                            <span className="text-sm font-semibold">
                                {t('file_download.download_file') || 'Download File'}
                            </span>
                        </div>
                        <div className="text-xs opacity-90 truncate">
                            {profileFile.name} • {formatFileSize(profileFile.size)}
                        </div>
                    </div>
                </button>
            )}
        </div>
    );
}