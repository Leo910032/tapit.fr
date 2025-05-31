// app/dashboard/(dashboard pages)/analytics/components/TopClickedLinks.jsx
"use client"
import Image from "next/image";
import { useTranslation } from "@/lib/useTranslation";

export default function TopClickedLinks({ analytics, isConnected }) {
    const { t } = useTranslation();

    if (!analytics?.topLinks?.length) {
        return null;
    }

    // Get link type icon
    const getLinkTypeIcon = (type) => {
        switch (type?.toLowerCase()) {
            case 'social':
                return 'https://linktree.sirv.com/Images/icons/social.svg';
            case 'instagram':
                return 'https://linktree.sirv.com/Images/brands/instagram.svg';
            case 'twitter':
                return 'https://linktree.sirv.com/Images/brands/twitter.svg';
            case 'tiktok':
                return 'https://linktree.sirv.com/Images/brands/tiktok.svg';
            case 'youtube':
                return 'https://linktree.sirv.com/Images/brands/youtube.svg';
            case 'spotify':
                return 'https://linktree.sirv.com/Images/brands/spotify.svg';
            case 'video':
                return 'https://linktree.sirv.com/Images/brands/video.svg';
            case 'music':
                return 'https://linktree.sirv.com/Images/brands/music.svg';
            default:
                return 'https://linktree.sirv.com/Images/icons/links.svg';
        }
    };

    // Get link type color
    const getLinkTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'instagram':
                return 'bg-gradient-to-r from-purple-500 to-pink-500';
            case 'twitter':
                return 'bg-blue-400';
            case 'tiktok':
                return 'bg-black';
            case 'youtube':
                return 'bg-red-500';
            case 'spotify':
                return 'bg-green-500';
            case 'social':
                return 'bg-purple-500';
            case 'video':
                return 'bg-red-400';
            case 'music':
                return 'bg-indigo-500';
            default:
                return 'bg-gray-500';
        }
    };

    return (
        <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-6 mb-20">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t('analytics.top_clicked_links') || 'Top Clicked Links'}
                    </h2>
                    {isConnected && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                            <span>{t('analytics.real_time_updates') || 'Real-time updates'}</span>
                        </div>
                    )}
                </div>
                
                <div className="space-y-4">
                    {analytics.topLinks.map((link, index) => (
                        <div key={link.linkId} className="group flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 hover:shadow-md">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                                {/* Rank Badge */}
                                <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold ${
                                    index === 0 ? 'bg-yellow-500' :
                                    index === 1 ? 'bg-gray-400' :
                                    index === 2 ? 'bg-amber-600' :
                                    'bg-blue-500'
                                }`}>
                                    {index === 0 ? '🥇' : 
                                     index === 1 ? '🥈' : 
                                     index === 2 ? '🥉' : 
                                     `#${index + 1}`}
                                </div>

                                {/* Link Icon */}
                                <div className={`flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center ${getLinkTypeColor(link.type)}`}>
                                    <Image 
                                        src={getLinkTypeIcon(link.type)}
                                        alt={link.type || 'link'}
                                        width={20}
                                        height={20}
                                        className={link.type?.toLowerCase() === 'tiktok' ? 'filter invert' : ''}
                                    />
                                </div>

                                {/* Link Info */}
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-1">
                                        <p className="font-medium text-gray-900 truncate">
                                            {link.title || t('analytics.untitled_link') || 'Untitled Link'}
                                        </p>
                                        {link.type && (
                                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full text-white ${getLinkTypeColor(link.type)}`}>
                                                {link.type}
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-sm text-gray-500 truncate">
                                        {link.url}
                                    </p>
                                    <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                                        <span>
                                            {t('analytics.created')}: {new Date(link.createdAt).toLocaleDateString()}
                                        </span>
                                        {link.lastClicked && (
                                            <span>
                                                {t('analytics.last_clicked')}: {new Date(link.lastClicked).toLocaleDateString()}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Click Statistics */}
                            <div className="flex items-center space-x-6 text-right">
                                <div className="hidden sm:block">
                                    <p className="text-sm text-gray-500">
                                        {t('analytics.today')}
                                    </p>
                                    <p className="text-lg font-semibold text-blue-600">
                                        {link.todayClicks || 0}
                                    </p>
                                </div>
                                <div className="hidden md:block">
                                    <p className="text-sm text-gray-500">
                                        {t('analytics.this_week')}
                                    </p>
                                    <p className="text-lg font-semibold text-indigo-600">
                                        {link.weekClicks || 0}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-500">
                                        {t('analytics.total')}
                                    </p>
                                    <p className="text-2xl font-bold text-gray-900">
                                        {link.totalClicks || 0}
                                    </p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center space-x-2 ml-4">
                                <button
                                    onClick={() => window.open(link.url, '_blank')}
                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                                    title={t('analytics.visit_link') || 'Visit Link'}
                                >
                                    <Image 
                                        src="https://linktree.sirv.com/Images/icons/external-link.svg"
                                        alt="visit"
                                        width={16}
                                        height={16}
                                    />
                                </button>
                                <button
                                    onClick={() => navigator.clipboard.writeText(link.url)}
                                    className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors duration-200"
                                    title={t('analytics.copy_link') || 'Copy Link'}
                                >
                                    <Image 
                                        src="https://linktree.sirv.com/Images/icons/copy.svg"
                                        alt="copy"
                                        width={16}
                                        height={16}
                                    />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Show More Button */}
                {analytics.topLinks.length > 5 && (
                    <div className="mt-6 text-center">
                        <button className="px-6 py-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors duration-200 font-medium">
                            {t('analytics.show_all_links') || 'Show All Links'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
