// app/dashboard/general components/ManageLinks.jsx - Enhanced with System Buttons
"use client"

import Image from "next/image";
import AddBtn from "../general elements/addBtn";
import DraggableList from "./Drag";
import React, { useEffect, useState } from "react";
import { generateRandomId } from "@/lib/utilities";
import { updateLinks } from "@/lib/update data/updateLinks";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { fireApp } from "@/important/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "@/lib/useTranslation";

export const ManageLinksContent = React.createContext();

export default function ManageLinks() {
    const { t } = useTranslation();
    const [data, setData] = useState([]);
    const [hasLoaded, setHasLoaded] = useState(false);
    const [profileFile, setProfileFile] = useState(null); // Track uploaded file

    // System button templates
    const getSystemButtons = () => [
        {
            id: 'system_exchange_contact',
            title: t('system_buttons.exchange_contact'),
            isActive: true,
            type: 'system',
            systemType: 'exchange',
            icon: '🔄',
            url: '', // System buttons don't need URLs
            isDeletable: false,
            isSystem: true
        },
        {
            id: 'system_save_contact',
            title: t('system_buttons.save_contact'),
            isActive: true,
            type: 'system',
            systemType: 'save_contact',
            icon: '💾',
            url: '',
            isDeletable: false,
            isSystem: true
        }
    ];

    // Create file download button when file exists
    const getFileDownloadButton = (file) => ({
        id: 'system_file_download',
        title: `📄 ${t('system_buttons.download')}: ${file.name}`,
        isActive: true,
        type: 'system',
        systemType: 'file_download',
        icon: '📄',
        url: '',
        isDeletable: false,
        isSystem: true,
        fileData: file
    });

    const addItem = () => {
        const newItem = {
            id: `${generateRandomId()}`,
            title: "",
            isActive: true,
            type: 1, // Regular link type
            url: "",
            isDeletable: true,
            isSystem: false
        };
        
        // Insert after system buttons
        const systemButtonsCount = getSystemButtons().length + (profileFile ? 1 : 0);
        const newData = [...data];
        newData.splice(systemButtonsCount, 0, newItem);
        setData(newData);
    };

    // Merge system buttons with user links
    const mergeSystemButtons = (userLinks, file) => {
        const systemButtons = getSystemButtons();
        
        // Add file download button if file exists
        if (file) {
            systemButtons.push(getFileDownloadButton(file));
        }

        // Find existing system buttons in user links and preserve their position/state
        const mergedLinks = [];
        const systemButtonsMap = new Map(systemButtons.map(btn => [btn.id, btn]));
        
        // First pass: add existing items and update system buttons
        userLinks.forEach(item => {
            if (item.isSystem && systemButtonsMap.has(item.id)) {
                // Update system button with latest template but preserve user settings
                const template = systemButtonsMap.get(item.id);
                mergedLinks.push({
                    ...template,
                    isActive: item.isActive !== undefined ? item.isActive : template.isActive,
                    title: template.title // Always use latest title for system buttons
                });
                systemButtonsMap.delete(item.id); // Mark as processed
            } else if (!item.isSystem) {
                // Regular user link
                mergedLinks.push(item);
            }
        });

        // Second pass: add any new system buttons that weren't in user links
        systemButtonsMap.forEach(button => {
            mergedLinks.unshift(button); // Add to beginning
        });

        return mergedLinks;
    };

    // Filter out system buttons when saving to backend
    const filterUserLinksOnly = (allLinks) => {
        return allLinks.map(item => {
            if (item.isSystem) {
                // Only save the essential data for system buttons
                return {
                    id: item.id,
                    isActive: item.isActive,
                    type: 'system',
                    systemType: item.systemType,
                    isSystem: true,
                    isDeletable: false
                };
            }
            return item;
        });
    };

    useEffect(() => {
        if (!hasLoaded) {
            setHasLoaded(true);
            return;
        }
        
        // Only update backend with filtered data
        const linksToSave = filterUserLinksOnly(data);
        updateLinks(linksToSave);
    }, [data, hasLoaded]);

    useEffect(() => {
        function fetchLinksAndProfile() {
            const currentUser = testForActiveSession();
            const collectionRef = collection(fireApp, "AccountData");
            const docRef = doc(collectionRef, `${currentUser}`);

            onSnapshot(docRef, (docSnap) => {
                if (docSnap.exists()) {
                    const { links, profileFile } = docSnap.data();
                    const userLinks = links ? links : [];
                    
                    // Update profile file state
                    setProfileFile(profileFile || null);
                    
                    // Merge system buttons with user links
                    const mergedData = mergeSystemButtons(userLinks, profileFile);
                    setData(mergedData);
                }
            });
        }

        fetchLinksAndProfile();
    }, []);

    return (
        <ManageLinksContent.Provider value={{ setData, data, profileFile }}>
            <div className="h-full flex-col gap-4 py-1 flex sm:px-2 px-1 transition-[min-height]">
                <AddBtn />

                <div className={`flex items-center gap-3 justify-center rounded-3xl cursor-pointer active:scale-95 active:opacity-60 active:translate-y-1 hover:scale-[1.005] border hover:bg-black hover:bg-opacity-[0.05] w-fit text-sm p-3 mt-3`} onClick={addItem}>
                    <Image src={"https://linktree.sirv.com/Images/icons/add.svg"} alt="links" height={15} width={15} />
                    <span>{t('manageLinks.add_header')}</span>
                </div>

                {/* Info banner about system buttons */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm">
                    <div className="flex items-center gap-2 text-blue-800 font-semibold mb-1">
                        <span>ℹ️</span>
                        <span>{t('system_buttons.info_title', 'System Buttons')}</span>
                    </div>
                    <p className="text-blue-700 text-xs">
                        {t('system_buttons.info_text', 'Exchange Contact, Save Contact, and File Download buttons are system features. You can reorder and toggle them, but not delete them.')}
                    </p>
                </div>

                {data.length === 0 && (
                    <div className="p-6 flex-col gap-4 flex items-center justify-center opacity-30">
                        <Image
                            src={"https://linktree.sirv.com/Images/logo-icon.svg"}
                            alt="logo"
                            height={100}
                            width={100}
                            className="opacity-50 sm:w-24 w-16"
                        />
                        <span className="text-center sm:text-base text-sm max-w-[15rem] font-semibold">
                            {t('manageLinks.show_world_who_you_are')}
                            {' '}
                            {t('manageLinks.add_link_to_get_started')}
                        </span>
                    </div>
                )}

                {data.length > 0 && <DraggableList array={data} />}
            </div>
        </ManageLinksContent.Provider>
    );
}