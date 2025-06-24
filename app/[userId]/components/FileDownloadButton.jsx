// app/[userId]/components/FileDownloadButton.jsx
"use client"
import { fireApp } from "@/important/firebase";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useTranslation } from "@/lib/useTranslation";
import { FaDownload, FaFileAlt } from "react-icons/fa6";
import { recordLinkClick } from "@/lib/analytics/linkClickTracker";

export default function FileDownloadButton({ userId }) {
    const { t } = useTranslation();
    const [profileFile, setProfileFile] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [username, setUsername] = useState("");

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
        async function fetchProfileFile() {
            try {
                const currentUser = await fetchUserData(userId);
                if (!currentUser) {
                    setIsLoading(false);
                    return;
                }

                // Get username for analytics
                setUsername(currentUser.username || userId);

                const collectionRef = collection(fireApp, "AccountData");
                const docRef = doc(collectionRef, `${currentUser}`);

                const unsubscribe = onSnapshot(docRef, (docSnap) => {
                    if (docSnap.exists()) {
                        const { profileFile } = docSnap.data();
                        setProfileFile(profileFile || null);
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

        fetchProfileFile();
    }, [userId]);

    // Don't render anything if no file or still loading
    if (isLoading || !profileFile) {
        return null;
    }

    return (
        <div className="w-full px-5 mb-4">
            <button
                onClick={handleDownload}
                className="w-full bg-gradient-to-r from-green-500 to-blue-600 hover:from-green-600 hover:to-blue-700 text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl"
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
    );
}