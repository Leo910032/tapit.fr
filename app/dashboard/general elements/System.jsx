// Create this file: app/dashboard/general elements/draggables/System.jsx
"use client"

import Image from 'next/image';
import { useContext, useState } from 'react';
import { Draggable } from 'react-beautiful-dnd';
import { FaInfo } from 'react-icons/fa6';
import { ManageLinksContent } from '../../general components/ManageLinks';
import { useTranslation } from "@/lib/useTranslation";

export default function System({ item, index }) {
    const { t } = useTranslation();
    const { setData } = useContext(ManageLinksContent);
    const [checkboxChecked, setCheckboxChecked] = useState(item.isActive);

    const handleCheckboxChange = (event) => {
        const newState = event.target.checked;
        setCheckboxChecked(newState);
        
        // Update the data immediately
        setData(prevData => {
            return prevData.map(i => {
                if (i.id === item.id) {
                    return {
                        ...i,
                        isActive: newState
                    };
                }
                return i;
            });
        });
    };

    // Get system button specific styling and info
    const getSystemButtonInfo = () => {
        switch (item.systemType) {
            case 'exchange':
                return {
                    bgColor: 'bg-blue-50',
                    borderColor: 'border-blue-200',
                    iconColor: 'text-blue-600',
                    textColor: 'text-blue-800',
                    description: 'Allows visitors to share their contact info with you'
                };
            case 'save_contact':
                return {
                    bgColor: 'bg-green-50',
                    borderColor: 'border-green-200',
                    iconColor: 'text-green-600',
                    textColor: 'text-green-800',
                    description: 'Lets visitors save your contact info to their device'
                };
            case 'file_download':
                return {
                    bgColor: 'bg-purple-50',
                    borderColor: 'border-purple-200',
                    iconColor: 'text-purple-600',
                    textColor: 'text-purple-800',
                    description: 'Provides download access to your uploaded file'
                };
            default:
                return {
                    bgColor: 'bg-gray-50',
                    borderColor: 'border-gray-200',
                    iconColor: 'text-gray-600',
                    textColor: 'text-gray-800',
                    description: 'System functionality'
                };
        }
    };

    const systemInfo = getSystemButtonInfo();

    return (
        <Draggable draggableId={item.id} index={index}>
            {(provided) => (
                <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className={`rounded-3xl border-2 ${systemInfo.borderColor} ${systemInfo.bgColor} flex flex-col relative overflow-hidden`}
                >
                    {/* System badge */}
                    <div className="absolute top-2 right-2 z-10">
                        <div className={`px-2 py-1 rounded-full text-xs font-semibold ${systemInfo.bgColor} ${systemInfo.textColor} border ${systemInfo.borderColor}`}>
                            SYSTEM
                        </div>
                    </div>

                    <div className="h-[8rem] items-center flex">
                        <div
                            className='active:cursor-grabbing h-full px-2 grid place-items-center'
                            {...provided.dragHandleProps}
                        >
                            <Image
                                src={"https://linktree.sirv.com/Images/icons/drag.svg"}
                                alt="drag icon"
                                height={15}
                                width={15}
                            />
                        </div>

                        <div className='flex-1 flex flex-col px-3'>
                            <div className='flex gap-3 items-center'>
                                <span className={`text-2xl ${systemInfo.iconColor}`}>
                                    {item.icon}
                                </span>
                                <div className="flex-1">
                                    <div className={`font-semibold ${systemInfo.textColor}`}>
                                        {item.title}
                                    </div>
                                    <div className={`text-xs ${systemInfo.textColor} opacity-70 mt-1`}>
                                        {systemInfo.description}
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className='grid sm:pr-2 gap-2 place-items-center'>
                            {/* Toggle switch instead of delete button */}
                            <div className='cursor-pointer scale-[0.8] sm:scale-100'>
                                <label className="relative flex justify-between items-center group p-2 text-xl">
                                    <input 
                                        type="checkbox" 
                                        onChange={handleCheckboxChange} 
                                        checked={checkboxChecked} 
                                        className="absolute left-1/2 -translate-x-1/2 w-full h-full peer appearance-none rounded-md" 
                                    />
                                    <span className="w-9 h-6 flex items-center flex-shrink-0 ml-4 p-1 bg-gray-400 rounded-full duration-300 ease-in-out peer-checked:bg-green-600 after:w-4 after:h-4 after:bg-white after:rounded-full after:shadow-md after:duration-300 peer-checked:after:translate-x-3 group-hover:after:translate-x-[2px]"></span>
                                </label>
                            </div>

                            {/* Info icon instead of delete */}
                            <div className="relative p-2 ml-3 hover:bg-black hover:bg-opacity-[0.05] cursor-pointer group rounded-lg">
                                <FaInfo className={`${systemInfo.iconColor} opacity-60 group-hover:opacity-100`} size={17} />
                                <div className="nopointer group-hover:block hidden absolute -translate-x-1/2 left-1/2 translate-y-3 bg-black text-white text-sm rounded-lg px-2 py-1 after:absolute after:h-0 after:w-0 after:border-l-[6px] after:border-r-[6px] after:border-l-transparent after:border-r-transparent after:border-b-[8px] after:border-b-black after:-top-2 after:-translate-x-1/2 after:left-1/2 w-48 text-center">
                                    {systemInfo.description}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Bottom info bar */}
                    <div className={`px-4 py-2 border-t ${systemInfo.borderColor} ${systemInfo.bgColor}`}>
                        <div className="flex items-center justify-between text-xs">
                            <span className={`${systemInfo.textColor} font-medium`}>
                                {checkboxChecked 
                                    ? 'Enabled - Visible on profile'
                                    : 'Disabled - Hidden from profile'
                                }
                            </span>
                            {item.systemType === 'file_download' && item.fileData && (
                                <span className={`${systemInfo.textColor} opacity-70`}>
                                    {item.fileData.size ? `${(item.fileData.size / 1024 / 1024).toFixed(1)}MB` : ''}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </Draggable>
    );
}