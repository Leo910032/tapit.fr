// app/[userId]/components/ExchangeButton.jsx - RESPONSIVE VERSION
"use client"
import { useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import ExchangeModal from './ExchangeModal';

export default function ExchangeButton({ username, userInfo, fastLookupUsed }) {
    const { t } = useTranslation();
    const [isModalOpen, setIsModalOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsModalOpen(true)}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-3 md:px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
                {/* Exchange Icon */}
                <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
                
                {/* Text - Hidden on small screens, visible on md+ */}
                <span className="hidden md:block">
                    {t('exchange.button_text') || 'Exchange Contact'}
                </span>
                
                {/* Mobile-only text (shorter) */}
                <span className="block md:hidden text-sm">
                    Exchange
                </span>
            </button>
            
            <ExchangeModal 
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                profileOwnerUsername={username}
                profileOwnerId={userInfo?.userId}
            />
        </>
    );
}