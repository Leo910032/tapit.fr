// app/dashboard/(dashboard pages)/analytics/page.jsx - Mobile Optimized Version
"use client"
import React, { useEffect, useState } from "react";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { useTranslation } from "@/lib/useTranslation";
import Image from "next/image";
import { fireApp } from "@/important/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";

// Mobile-Optimized Analytics Header Component
function MobileAnalyticsHeader({ username, isConnected }) {
    const { t } = useTranslation();
    
    return (
        <div className="mb-4">
            <div className="flex flex-col gap-3">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-1">
                        {t('analytics.title') || 'Analytics'}
                    </h1>
                    <p className="text-sm text-gray-600">
                        {t('analytics.subtitle') || 'Track your profile performance'}
                    </p>
                    {username && (
                        <p className="text-xs text-gray-500 mt-1 truncate">
                            {t('analytics.profile') || 'Profile:'} @{username}
                        </p>
                    )}
                </div>
                
                {/* Real-time connection indicator */}
                <div className="flex items-center gap-2 self-start">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-500">
                        {isConnected ? 
                            (t("analytics.live_connection") || "Live") : 
                            (t("analytics.disconnected") || "Disconnected")
                        }
                    </span>
                </div>
            </div>
        </div>
    );
}

// Mobile Period Navigation Component
function MobilePeriodNavigation({ selectedPeriod, setSelectedPeriod }) {
    const { t } = useTranslation();
    
    const navigationItems = [
        { id: 'today', label: t('analytics.nav.today') || 'Today', icon: '📅' },
        { id: 'week', label: t('analytics.nav.week') || 'Week', icon: '📊' },
        { id: 'month', label: t('analytics.nav.month') || 'Month', icon: '📈' },
        { id: 'all', label: t('analytics.nav.all_time') || 'All', icon: '🚀' }
    ];

    return (
        <div className="mb-4">
            <div className="bg-white rounded-lg shadow-sm border p-1">
                <div className="grid grid-cols-4 gap-1">
                    {navigationItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setSelectedPeriod(item.id)}
                            className={`flex flex-col items-center justify-center gap-1 py-3 px-2 rounded-md text-xs font-medium transition-all duration-200 ${
                                selectedPeriod === item.id
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <span className="text-base">{item.icon}</span>
                            <span className="leading-tight">{item.label}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}

// Mobile Overview Cards Component
function MobileOverviewCards({ analyticsData, selectedPeriod, analytics, isConnected }) {
    const { t } = useTranslation();
    
    const getCurrentData = () => {
        return analyticsData[selectedPeriod] || { views: 0, clicks: 0 };
    };

    const getPeriodLabel = () => {
        switch (selectedPeriod) {
            case 'today': return t('analytics.period.today') || 'Today';
            case 'week': return t('analytics.period.this_week') || 'This Week';
            case 'month': return t('analytics.period.this_month') || 'This Month';
            case 'all': return t('analytics.period.all_time') || 'All Time';
            default: return 'Today';
        }
    };

    const currentData = getCurrentData();

    return (
        <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {getPeriodLabel()} {t('analytics.overview_title') || 'Overview'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
                {/* Views Card */}
                <div className="bg-white rounded-lg shadow-sm border p-4 relative">
                    {isConnected && (
                        <div className="absolute top-2 right-2 animate-pulse bg-blue-500 w-2 h-2 rounded-full"></div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-blue-100 p-2 rounded-lg">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                            {t('analytics.profile_views') || 'Views'}
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {currentData.views.toLocaleString()}
                    </p>
                </div>

                {/* Clicks Card */}
                <div className="bg-white rounded-lg shadow-sm border p-4 relative">
                    {isConnected && (
                        <div className="absolute top-2 right-2 animate-pulse bg-indigo-500 w-2 h-2 rounded-full"></div>
                    )}
                    <div className="flex items-center gap-2 mb-2">
                        <div className="bg-indigo-100 p-2 rounded-lg">
                            <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <span className="text-xs font-medium text-gray-600">
                            {t('analytics.link_clicks') || 'Clicks'}
                        </span>
                    </div>
                    <p className="text-2xl font-bold text-gray-900">
                        {currentData.clicks.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}

// Mobile Statistics Grid Component
function MobileStatisticsGrid({ analytics }) {
    const { t } = useTranslation();

    return (
        <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {t('analytics.complete_statistics') || 'All Statistics'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
                {/* Today */}
                <div className="bg-white rounded-lg shadow-sm border p-3">
                    <h3 className="text-xs font-medium text-gray-600 mb-2">
                        {t('analytics.stats.today') || 'Today'}
                    </h3>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-blue-600">
                            {analytics?.todayViews || 0} {t('analytics.stats.views') || 'views'}
                        </p>
                        <p className="text-sm font-bold text-indigo-600">
                            {analytics?.todayClicks || 0} {t('analytics.stats.clicks') || 'clicks'}
                        </p>
                    </div>
                </div>

                {/* This Week */}
                <div className="bg-white rounded-lg shadow-sm border p-3">
                    <h3 className="text-xs font-medium text-gray-600 mb-2">
                        {t('analytics.stats.this_week') || 'This Week'}
                    </h3>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-blue-600">
                            {analytics?.thisWeekViews || 0} {t('analytics.stats.views') || 'views'}
                        </p>
                        <p className="text-sm font-bold text-indigo-600">
                            {analytics?.thisWeekClicks || 0} {t('analytics.stats.clicks') || 'clicks'}
                        </p>
                    </div>
                </div>

                {/* This Month */}
                <div className="bg-white rounded-lg shadow-sm border p-3">
                    <h3 className="text-xs font-medium text-gray-600 mb-2">
                        {t('analytics.stats.this_month') || 'This Month'}
                    </h3>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-blue-600">
                            {analytics?.thisMonthViews || 0} {t('analytics.stats.views') || 'views'}
                        </p>
                        <p className="text-sm font-bold text-indigo-600">
                            {analytics?.thisMonthClicks || 0} {t('analytics.stats.clicks') || 'clicks'}
                        </p>
                    </div>
                </div>

                {/* All Time */}
                <div className="bg-white rounded-lg shadow-sm border p-3">
                    <h3 className="text-xs font-medium text-gray-600 mb-2">
                        {t('analytics.stats.all_time') || 'All Time'}
                    </h3>
                    <div className="space-y-1">
                        <p className="text-sm font-bold text-blue-600">
                            {analytics?.totalViews || 0} {t('analytics.stats.views') || 'views'}
                        </p>
                        <p className="text-sm font-bold text-indigo-600">
                            {analytics?.totalClicks || 0} {t('analytics.stats.clicks') || 'clicks'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Mobile Top Links Component
function MobileTopClickedLinks({ analytics, isConnected }) {
    const { t } = useTranslation();
    const [showAll, setShowAll] = useState(false);

    if (!analytics?.topLinks?.length) {
        return null;
    }

    // Function to get the root domain from URL
    function getRootNameFromUrl(url) {
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            const rootName = urlObj.hostname;
            return rootName;
        } catch (error) {
            return '';
        }
    }

    // Get link icon
    const getLinkIcon = (url) => {
        if (!url) return 'https://linktree.sirv.com/Images/brands/link-svgrepo-com.svg';
        const rootName = getRootNameFromUrl(url);
        
        // Simple mapping for common domains
        const iconMap = {
            'instagram.com': 'https://linktree.sirv.com/Images/brands/instagram.svg',
            'twitter.com': 'https://linktree.sirv.com/Images/brands/twitter.svg',
            'tiktok.com': 'https://linktree.sirv.com/Images/brands/tiktok.svg',
            'youtube.com': 'https://linktree.sirv.com/Images/brands/youtube.svg',
            'spotify.com': 'https://linktree.sirv.com/Images/brands/spotify.svg',
        };
        
        return iconMap[rootName] || 'https://linktree.sirv.com/Images/brands/link-svgrepo-com.svg';
    };

    const displayedLinks = showAll ? analytics.topLinks : analytics.topLinks.slice(0, 5);

    return (
        <div className="mb-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('analytics.top_clicked_links') || 'Top Links'}
                    </h2>
                    {isConnected && (
                        <div className="flex items-center gap-1">
                            <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                            <span className="text-xs text-green-600">Live</span>
                        </div>
                    )}
                </div>
                
                <div className="space-y-3">
                    {displayedLinks.map((link, index) => (
                        <div key={link.linkId} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                            {/* Rank Badge */}
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold ${
                                index === 0 ? 'bg-yellow-500' :
                                index === 1 ? 'bg-gray-400' :
                                index === 2 ? 'bg-amber-600' :
                                'bg-blue-500'
                            }`}>
                                {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                            </div>

                            {/* Link Icon */}
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg p-1 bg-white border">
                                <Image 
                                    src={getLinkIcon(link.url)}
                                    alt={link.type || 'link'}
                                    width={24}
                                    height={24}
                                    className="object-fit h-full w-full"
                                />
                            </div>

                            {/* Link Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate text-sm">
                                    {link.title || t('analytics.untitled_link') || 'Untitled Link'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {link.url}
                                </p>
                            </div>

                            {/* Click Count */}
                            <div className="text-right flex-shrink-0">
                                <p className="text-lg font-bold text-gray-900">
                                    {link.totalClicks || 0}
                                </p>
                                <p className="text-xs text-gray-500">clicks</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Show More/Less Button */}
                {analytics.topLinks.length > 5 && (
                    <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                        <button 
                            onClick={() => setShowAll(!showAll)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                            {showAll 
                                ? t('analytics.show_less') || 'Show Less'
                                : t('analytics.show_all_links') || `Show All (${analytics.topLinks.length})`
                            }
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}

// Mobile Link Analytics Chart Component
function MobileLinkAnalyticsChart({ analytics, isConnected }) {
    const { t } = useTranslation();
    
    if (!analytics?.topLinks?.length) {
        return (
            <div className="mb-4">
                <div className="bg-white rounded-lg shadow-sm border p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h2 className="text-lg font-semibold text-gray-900">
                            {t('analytics.link_performance') || 'Link Performance'}
                        </h2>
                        {isConnected && (
                            <div className="flex items-center gap-1">
                                <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                                <span className="text-xs text-green-600">Live</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center py-6">
                        <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                            <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                        </div>
                        <p className="text-gray-600 mb-2 text-sm">
                            {t('analytics.no_link_data') || 'No link data yet'}
                        </p>
                        <p className="text-xs text-gray-500">
                            {t('analytics.add_links_to_track') || 'Add links to your profile to track their performance!'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Prepare data for charts
    const chartData = analytics.topLinks.slice(0, 5).map((link, index) => ({
        name: link.title?.length > 12 ? `${link.title.substring(0, 12)}...` : link.title || 'Untitled',
        clicks: link.totalClicks || 0,
        fullTitle: link.title || 'Untitled Link',
        type: link.type || 'custom',
        percentage: 0
    }));

    // Calculate percentages
    const totalClicks = chartData.reduce((sum, item) => sum + item.clicks, 0);
    chartData.forEach(item => {
        item.percentage = totalClicks > 0 ? (item.clicks / totalClicks) * 100 : 0;
    });

    // Find max clicks for scaling
    const maxClicks = Math.max(...chartData.map(item => item.clicks));

    return (
        <div className="mb-4">
            <div className="bg-white rounded-lg shadow-sm border p-4">
                <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-semibold text-gray-900">
                        {t('analytics.link_performance') || 'Performance'}
                    </h2>
                    {isConnected && (
                        <div className="flex items-center gap-1">
                            <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                            <span className="text-xs text-green-600">Live</span>
                        </div>
                    )}
                </div>

                {/* Mobile Chart */}
                <div className="space-y-3">
                    {chartData.map((item, index) => (
                        <div key={index} className="group">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-sm font-medium text-gray-700 truncate max-w-24">
                                    {item.name}
                                </span>
                                <span className="text-sm font-bold text-gray-900">
                                    {item.clicks}
                                </span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                                <div 
                                    className="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all duration-1000 ease-out"
                                    style={{ 
                                        width: maxClicks > 0 ? `${(item.clicks / maxClicks) * 100}%` : '0%' 
                                    }}
                                ></div>
                            </div>
                            <div className="flex items-center justify-between mt-1">
                                <span className="text-xs text-gray-500 capitalize">
                                    {item.type}
                                </span>
                                <span className="text-xs text-gray-500">
                                    {item.percentage.toFixed(1)}%
                                </span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary Stats */}
                <div className="mt-4 pt-3 border-t border-gray-100">
                    <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                            <p className="text-lg font-bold text-blue-600">
                                {analytics.topLinks.length}
                            </p>
                            <p className="text-xs text-gray-600">
                                {t('analytics.total_links') || 'Links'}
                            </p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-green-600">
                                {analytics.totalClicks || 0}
                            </p>
                            <p className="text-xs text-gray-600">
                                {t('analytics.total_clicks') || 'Clicks'}
                            </p>
                        </div>
                        <div>
                            <p className="text-lg font-bold text-purple-600">
                                {analytics.topLinks.length > 0 ? Math.round((analytics.totalClicks || 0) / analytics.topLinks.length) : 0}
                            </p>
                            <p className="text-xs text-gray-600">
                                {t('analytics.avg_clicks_per_link') || 'Avg/Link'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Mobile Recent Activity Component
function MobileRecentActivity({ analytics, isConnected, username }) {
    const { t } = useTranslation();
    
    return (
        <div className="bg-white rounded-lg shadow-sm border p-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    {t('analytics.recent_activity') || 'Recent Activity'}
                </h2>
                {isConnected && (
                    <div className="flex items-center gap-1">
                        <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                        <span className="text-xs text-green-600">Live</span>
                    </div>
                )}
            </div>
            
            {analytics && (analytics.totalViews > 0 || analytics.totalClicks > 0) ? (
                <div className="space-y-3">
                    {analytics.totalViews > 0 && (
                        <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="bg-blue-100 p-2 rounded-lg">
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">
                                        {t('analytics.profile_views') || 'Profile Views'}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {analytics?.lastUpdated ? 
                                            `Updated: ${new Date(analytics.lastUpdated.seconds * 1000).toLocaleDateString()}` :
                                            'No recent activity'
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900 text-lg">
                                    {analytics?.totalViews?.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-600">Total</p>
                            </div>
                        </div>
                    )}
                    
                    {analytics.totalClicks > 0 && (
                        <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                                <div className="bg-indigo-100 p-2 rounded-lg">
                                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
                                </div>
                                <div>
                                    <p className="font-medium text-gray-900 text-sm">
                                        {t('analytics.link_clicks') || 'Link Clicks'}
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        {t('analytics.total_interactions_description') || 'Total interactions'}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-gray-900 text-lg">
                                    {analytics?.totalClicks?.toLocaleString()}
                                </p>
                                <p className="text-xs text-gray-600">Total</p>
                            </div>
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-center py-6">
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <p className="text-gray-600 mb-2 text-sm">
                        {t('analytics.no_activity_yet') || 'No activity yet'}
                    </p>
                    <p className="text-xs text-gray-500 mb-3">
                        {t('analytics.share_to_track') || 'Share your profile to start tracking!'}
                    </p>
                    {username && (
                        <div className="bg-gray-50 rounded-lg p-3">
                            <p className="text-xs text-gray-600 mb-2">
                                {t('analytics.your_profile_url') || 'Your profile URL:'}
                            </p>
                            <div className="flex items-center justify-between gap-2 bg-white rounded p-2 border">
                                <p className="text-xs font-mono text-blue-600 truncate flex-1">
                                    tapit.fr/{username}
                                </p>
                                <button
                                    onClick={() => navigator.clipboard.writeText(`https://www.tapit.fr/${username}`)}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors flex-shrink-0"
                                    title={t('analytics.copy_url') || 'Copy URL'}
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

export default function AnalyticsPage() {
    const { t } = useTranslation();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    
    // Date range selector state
    const [selectedPeriod, setSelectedPeriod] = useState('today'); // 'today', 'week', 'month', 'all'

    // Analytics data organized by periods
    const [analyticsData, setAnalyticsData] = useState({
        today: { views: 0, clicks: 0 },
        week: { views: 0, clicks: 0 },
        month: { views: 0, clicks: 0 },
        all: { views: 0, clicks: 0 }
    });

    useEffect(() => {
        let unsubscribe = null;

        async function setupRealtimeAnalytics() {
            try {
                const currentUser = testForActiveSession();
                console.log("Setting up real-time analytics for user:", currentUser);
                
                if (!currentUser) {
                    setError(t("analytics.not_authenticated") || "Not authenticated");
                    setLoading(false);
                    return;
                }

                const userData = await fetchUserData(currentUser);
                
                if (!userData) {
                    setError(t("analytics.user_data_not_found") || "User data not found");
                    setLoading(false);
                    return;
                }

                setUsername(userData.username);

                // Set up real-time listener for analytics document
                const analyticsRef = doc(collection(fireApp, "Analytics"), currentUser);
                
                unsubscribe = onSnapshot(analyticsRef, (docSnapshot) => {
                    console.log("📊 Analytics update received!");
                    setIsConnected(true);
                    
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data();
                        console.log("Analytics data updated:", data);
                        
                        // Calculate derived metrics
                        const today = new Date().toISOString().split('T')[0];
                        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
                        
                        // Process link clicks data with enhanced information
                        const linkClicks = data.linkClicks || {};
                        const topLinks = Object.entries(linkClicks)
                            .map(([linkId, linkData]) => ({
                                linkId,
                                title: linkData.title || 'Untitled Link',
                                url: linkData.url || '',
                                type: linkData.type || 'custom',
                                totalClicks: linkData.totalClicks || 0,
                                todayClicks: linkData.dailyClicks?.[today] || 0,
                                weekClicks: linkData.weeklyClicks?.[getWeekKey()] || 0,
                                monthClicks: linkData.monthlyClicks?.[getMonthKey()] || 0,
                                createdAt: linkData.createdAt || new Date().toISOString(),
                                lastClicked: linkData.lastClicked,
                                ...linkData
                            }))
                            .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0));
                        
                        const processedAnalytics = {
                            // Views data
                            totalViews: data.totalViews || 0,
                            todayViews: data.dailyViews?.[today] || 0,
                            yesterdayViews: data.dailyViews?.[yesterday] || 0,
                            thisWeekViews: data.weeklyViews?.[getWeekKey()] || 0,
                            thisMonthViews: data.monthlyViews?.[getMonthKey()] || 0,
                            
                            // Clicks data
                            totalClicks: data.totalClicks || 0,
                            todayClicks: data.dailyClicks?.[today] || 0,
                            yesterdayClicks: data.dailyClicks?.[yesterday] || 0,
                            thisWeekClicks: data.weeklyClicks?.[getWeekKey()] || 0,
                            thisMonthClicks: data.monthlyClicks?.[getMonthKey()] || 0,
                            
                            // Detailed data
                            dailyViews: data.dailyViews || {},
                            dailyClicks: data.dailyClicks || {},
                            weeklyViews: data.weeklyViews || {},
                            weeklyClicks: data.weeklyClicks || {},
                            monthlyViews: data.monthlyViews || {},
                            monthlyClicks: data.monthlyClicks || {},
                            linkClicks: data.linkClicks || {},
                            topLinks,
                            
                            lastUpdated: data.lastUpdated,
                            username: data.username
                        };
                        
                        // Update organized analytics data
                        setAnalyticsData({
                            today: {
                                views: processedAnalytics.todayViews,
                                clicks: processedAnalytics.todayClicks
                            },
                            week: {
                                views: processedAnalytics.thisWeekViews,
                                clicks: processedAnalytics.thisWeekClicks
                            },
                            month: {
                                views: processedAnalytics.thisMonthViews,
                                clicks: processedAnalytics.thisMonthClicks
                            },
                            all: {
                                views: processedAnalytics.totalViews,
                                clicks: processedAnalytics.totalClicks
                            }
                        });
                        
                        setAnalytics(processedAnalytics);
                    } else {
                        console.log("No analytics document found - initializing with zeros");
                        // Document doesn't exist yet, show zeros
                        const emptyAnalytics = {
                            totalViews: 0,
                            todayViews: 0,
                            yesterdayViews: 0,
                            thisWeekViews: 0,
                            thisMonthViews: 0,
                            totalClicks: 0,
                            todayClicks: 0,
                            yesterdayClicks: 0,
                            thisWeekClicks: 0,
                            thisMonthClicks: 0,
                            dailyViews: {},
                            dailyClicks: {},
                            weeklyViews: {},
                            weeklyClicks: {},
                            monthlyViews: {},
                            monthlyClicks: {},
                            linkClicks: {},
                            topLinks: [],
                            username: userData.username
                        };
                        
                        setAnalytics(emptyAnalytics);
                        setAnalyticsData({
                            today: { views: 0, clicks: 0 },
                            week: { views: 0, clicks: 0 },
                            month: { views: 0, clicks: 0 },
                            all: { views: 0, clicks: 0 }
                        });
                    }
                    
                    setLoading(false);
                }, (error) => {
                    console.error("Error in analytics listener:", error);
                    setError(t("analytics.failed_to_connect") || "Failed to connect to analytics");
                    setIsConnected(false);
                    setLoading(false);
                });

            } catch (err) {
                console.error("Error setting up analytics:", err);
                setError(t("analytics.failed_to_load") || "Failed to load analytics data");
                setLoading(false);
            }
        }

        setupRealtimeAnalytics();

        // Cleanup function to unsubscribe from listener
        return () => {
            if (unsubscribe) {
                console.log("🔌 Disconnecting analytics listener");
                unsubscribe();
            }
        };
    }, [t]);

    // Helper functions for date calculations
    function getWeekKey() {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((now - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
        return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    }

    function getMonthKey() {
        const now = new Date();
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    }

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[400px]">
                <div className="flex flex-col items-center space-y-3">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    <span className="text-gray-500 text-sm">{t("analytics.loading") || "Loading analytics..."}</span>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-red-600 min-h-[400px]">
                <div className="text-center">
                    <div className="mb-4">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    </div>
                    <p className="text-lg font-semibold mb-2">
                        {t("analytics.error_loading") || "Error Loading Analytics"}
                    </p>
                    <p className="text-sm mb-4">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {t("analytics.retry") || "Retry"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 pb-20">
            {/* Mobile Analytics Header */}
            <MobileAnalyticsHeader 
                username={username} 
                isConnected={isConnected} 
            />

            {/* Mobile Period Navigation */}
            <MobilePeriodNavigation 
                selectedPeriod={selectedPeriod} 
                setSelectedPeriod={setSelectedPeriod} 
            />

            {/* Mobile Overview Cards */}
            <MobileOverviewCards 
                analyticsData={analyticsData}
                selectedPeriod={selectedPeriod}
                analytics={analytics}
                isConnected={isConnected}
            />

            {/* Mobile Statistics Grid */}
            <MobileStatisticsGrid 
                analytics={analytics} 
            />

            {/* Mobile Link Analytics Chart - Only show if there are links */}
            {analytics?.topLinks?.length > 0 && (
                <MobileLinkAnalyticsChart 
                    analytics={analytics} 
                    isConnected={isConnected} 
                />
            )}

            {/* Mobile Top Clicked Links */}
            <MobileTopClickedLinks 
                analytics={analytics} 
                isConnected={isConnected} 
            />

            {/* Mobile Recent Activity - Fallback section for users with no links */}
            {(!analytics?.topLinks?.length || analytics.topLinks.length === 0) && (
                <MobileRecentActivity 
                    analytics={analytics} 
                    isConnected={isConnected} 
                    username={username} 
                />
            )}

            {/* Bottom Spacing for Mobile Navigation */}
            <div className="h-4"></div>
        </div>
    );
}