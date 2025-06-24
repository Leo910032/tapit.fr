// app/dashboard/(dashboard pages)/analytics/page.jsx - OPTIMIZED VERSION
"use client"
import React, { useEffect, useState, useRef } from "react";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { useTranslation } from "@/lib/useTranslation";
import Image from "next/image";
import { fireApp } from "@/important/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { fastUserLookup } from "@/lib/userLookup"; // ✅ Import fast lookup

// Mobile-Optimized Analytics Header Component
function MobileAnalyticsHeader({ username, isConnected, userId }) {
    const { t } = useTranslation();
    const [lastUpdateTime, setLastUpdateTime] = useState(new Date());

    useEffect(() => {
        if (isConnected) {
            const timer = setInterval(() => setLastUpdateTime(new Date()), 1000);
            return () => clearInterval(timer);
        }
    }, [isConnected]);
    
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
                    {/* ✅ Show user ID for debugging in dev mode */}
                    {process.env.NODE_ENV === 'development' && userId && (
                        <p className="text-xs text-blue-500 mt-1 font-mono">
                            ID: {userId}
                        </p>
                    )}
                </div>
                
                {/* Real-time connection indicator */}
                <div className="flex items-center gap-2 self-start">
                    <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                    <span className="text-xs text-gray-500">
                        {isConnected ? 
                            (t("analytics.live_connection") || "Live Analytics") : 
                            (t("analytics.disconnected") || "Reconnecting...")
                        }
                    </span>
                    {/* ✅ Connection timestamp */}
                    {isConnected && (
                        <span className="text-xs text-green-600">
                            • Updated {lastUpdateTime.toLocaleTimeString()}
                        </span>
                    )}
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
                                    ? 'bg-blue-500 text-white shadow-md transform scale-105'
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

// ✅ Enhanced Mobile Overview Cards Component
function MobileOverviewCards({ analyticsData, selectedPeriod, isConnected, lastUpdate }) {
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

    // ✅ Calculate engagement rate (CTR)
    const engagementRate = currentData.views > 0 ? ((currentData.clicks / currentData.views) * 100) : 0;

    return (
        <div className="mb-4">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">
                    {getPeriodLabel()} {t('analytics.overview_title') || 'Overview'}
                </h2>
                {lastUpdate && (
                    <span className="text-xs text-gray-500">
                        {new Date(lastUpdate).toLocaleTimeString()}
                    </span>
                )}
            </div>
            
            {/* Main Metrics Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                {/* Views Card */}
                <div className="bg-white rounded-lg shadow-sm border p-4 relative overflow-hidden">
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
                <div className="bg-white rounded-lg shadow-sm border p-4 relative overflow-hidden">
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

            {/* ✅ Engagement Rate Card */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg p-4 text-white shadow-lg">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm opacity-90 mb-1">
                            {t('analytics.engagement_rate') || 'Engagement Rate'}
                        </p>
                        <p className="text-2xl font-bold">
                            {engagementRate.toFixed(1)}%
                        </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-full p-3">
                        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
                            <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                </div>
                <p className="text-xs opacity-75 mt-2">
                    {t('analytics.engagement_description') || 'Clicks per view ratio for the period'}
                </p>
            </div>
        </div>
    );
}

// ✅ Enhanced Mobile Statistics Grid Component
function MobileStatisticsGrid({ analytics, isConnected }) {
    const { t } = useTranslation();

    const statisticsCards = [
        {
            title: t('analytics.stats.today') || 'Today',
            views: analytics?.todayViews || 0,
            clicks: analytics?.todayClicks || 0,
            color: 'blue'
        },
        {
            title: t('analytics.stats.this_week') || 'This Week',
            views: analytics?.thisWeekViews || 0,
            clicks: analytics?.thisWeekClicks || 0,
            color: 'green'
        },
        {
            title: t('analytics.stats.this_month') || 'This Month',
            views: analytics?.thisMonthViews || 0,
            clicks: analytics?.thisMonthClicks || 0,
            color: 'purple'
        },
        {
            title: t('analytics.stats.all_time') || 'All Time',
            views: analytics?.totalViews || 0,
            clicks: analytics?.totalClicks || 0,
            color: 'orange'
        }
    ];

    return (
        <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {t('analytics.complete_statistics') || 'Complete Statistics'}
            </h2>
            <div className="grid grid-cols-2 gap-3">
                {statisticsCards.map((card, index) => (
                    <div key={index} className={`bg-white rounded-lg shadow-sm border p-3 border-l-4 border-l-${card.color}-500`}>
                        <div className="flex items-center justify-between mb-2">
                            <h3 className="text-sm font-semibold text-gray-700">
                                {card.title}
                            </h3>
                            {isConnected && (
                                <div className={`animate-pulse bg-${card.color}-500 w-1.5 h-1.5 rounded-full`}></div>
                            )}
                        </div>
                        <div className="space-y-1 text-xs">
                            <p>Views: <span className="font-bold text-gray-900">{card.views.toLocaleString()}</span></p>
                            <p>Clicks: <span className="font-bold text-gray-900">{card.clicks.toLocaleString()}</span></p>
                            <p className="pt-1 border-t border-gray-100 mt-1">CTR: <span className="font-bold text-gray-900">{card.views > 0 ? ((card.clicks / card.views) * 100).toFixed(1) : '0.0'}%</span></p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}


// ✅ Enhanced Mobile Top Links Component with Real-time Updates
function MobileTopClickedLinks({ analytics, isConnected }) {
    const { t } = useTranslation();
    const [showAll, setShowAll] = useState(false);
    const [recentlyUpdated, setRecentlyUpdated] = useState(new Set());
    const prevClicksRef = useRef({});

    useEffect(() => {
        if (!analytics?.topLinks) return;
    
        const newUpdated = new Set();
        const currentClicks = {};
    
        analytics.topLinks.forEach(link => {
            currentClicks[link.linkId] = link.totalClicks || 0;
            if (prevClicksRef.current[link.linkId] < currentClicks[link.linkId]) {
                newUpdated.add(link.linkId);
            }
        });
    
        if (newUpdated.size > 0) {
            setRecentlyUpdated(newUpdated);
            const timer = setTimeout(() => setRecentlyUpdated(new Set()), 3000);
            return () => clearTimeout(timer);
        }
    
        prevClicksRef.current = currentClicks;
    }, [analytics?.topLinks]);


    if (!analytics?.topLinks?.length) {
        return null; // Don't render an empty state here, let MobileRecentActivity handle it.
    }

    // Function to get the root domain from URL
    function getRootNameFromUrl(url) {
        try {
            const urlObj = new URL(url.startsWith('http') ? url : `https://${url}`);
            return urlObj.hostname.replace('www.', '');
        } catch (error) {
            return '';
        }
    }

    // Get link icon
    const getLinkIcon = (url) => {
        if (!url) return 'https://linktree.sirv.com/Images/brands/link-svgrepo-com.svg';
        const rootName = getRootNameFromUrl(url);
        
        const iconMap = {
            'instagram.com': 'https://linktree.sirv.com/Images/brands/instagram.svg',
            'twitter.com': 'https://linktree.sirv.com/Images/brands/twitter.svg',
            'tiktok.com': 'https://linktree.sirv.com/Images/brands/tiktok.svg',
            'youtube.com': 'https://linktree.sirv.com/Images/brands/youtube.svg',
            'spotify.com': 'https://linktree.sirv.com/Images/brands/spotify.svg',
            'facebook.com': 'https://linktree.sirv.com/Images/brands/facebook.svg',
            'linkedin.com': 'https://linktree.sirv.com/Images/brands/linkedin.svg',
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
                        <div 
                            key={link.linkId} 
                            className={`flex items-center gap-3 p-3 rounded-lg transition-all duration-500 ${
                                recentlyUpdated.has(link.linkId) 
                                    ? 'bg-green-50 border border-green-200 shadow-md transform scale-105' 
                                    : 'bg-gray-50'
                            }`}
                        >
                            {/* Rank Badge */}
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                                index === 0 ? 'bg-yellow-400 text-yellow-800' :
                                index === 1 ? 'bg-gray-300 text-gray-700' :
                                index === 2 ? 'bg-amber-500 text-amber-900' :
                                'bg-blue-100 text-blue-600'
                            }`}>
                                {index < 3 ? ['🥇', '🥈', '🥉'][index] : index + 1}
                            </div>

                            {/* Link Icon */}
                            <div className="flex-shrink-0 h-8 w-8 rounded-lg p-1 bg-white border flex items-center justify-center">
                                <Image 
                                    src={getLinkIcon(link.url)}
                                    alt={link.type || 'link'}
                                    width={24}
                                    height={24}
                                    className="object-contain h-full w-full"
                                />
                            </div>

                            {/* Link Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 truncate text-sm">
                                    {link.title || t('analytics.untitled_link') || 'Untitled Link'}
                                </p>
                                <p className="text-xs text-gray-500 truncate">
                                    {getRootNameFromUrl(link.url) || link.url}
                                </p>
                            </div>

                            {/* Click Count with Animation */}
                            <div className="text-right flex-shrink-0">
                                <p className={`text-lg font-bold transition-colors duration-300 ${
                                    recentlyUpdated.has(link.linkId) ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                    {link.totalClicks || 0}
                                    {recentlyUpdated.has(link.linkId) && (
                                        <span className="ml-1 animate-ping absolute opacity-75 h-2 w-2 rounded-full bg-green-400"></span>
                                    )}
                                </p>
                                <p className="text-xs text-gray-500">clicks</p>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Show More/Less Button */}
                {analytics.topLinks.length > 5 && (
                    <div className="mt-4 pt-3 border-t border-gray-200 text-center">
                        <button 
                            onClick={() => setShowAll(!showAll)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium transition-colors"
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


// ✅ Enhanced Recent Activity Component (for users with no links/activity)
function MobileRecentActivity({ analytics, isConnected, username }) {
    const { t } = useTranslation();

    // This component now primarily serves as a placeholder for new users
    // or users who haven't added any links yet.
    if (analytics && analytics.topLinks && analytics.topLinks.length > 0) {
        return null;
    }
    
    return (
        <div className="bg-white rounded-lg shadow-sm border p-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-3">
                {t('analytics.get_started') || 'Get Started'}
            </h2>
            <div className="text-center py-6">
                <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                    <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                    </svg>
                </div>
                <p className="text-gray-600 mb-2 text-sm font-medium">
                    {t('analytics.no_link_data') || 'No link data to display'}
                </p>
                <p className="text-xs text-gray-500 mb-4">
                    {t('analytics.add_links_to_track') || 'Add some links to your profile to see your analytics here!'}
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
                                onClick={() => {
                                    navigator.clipboard.writeText(`https://www.tapit.fr/${username}`);
                                    // Simple feedback without extra libraries
                                    alert('URL copied to clipboard!');
                                }}
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
        </div>
    );
}

export default function AnalyticsPage() {
    const { t } = useTranslation();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState("");
    const [userId, setUserId] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [lastUpdate, setLastUpdate] = useState(null);
    const [connectionRetries, setConnectionRetries] = useState(0);
    const [selectedPeriod, setSelectedPeriod] = useState('today');
    const [analyticsData, setAnalyticsData] = useState({
        today: { views: 0, clicks: 0 },
        week: { views: 0, clicks: 0 },
        month: { views: 0, clicks: 0 },
        all: { views: 0, clicks: 0 }
    });

    useEffect(() => {
        let unsubscribe = null;
        let retryTimeout = null;

        const setupRealtimeAnalytics = async (retryCount = 0) => {
            try {
                if (retryCount === 0) setLoading(true);
                const currentUser = testForActiveSession();
                
                if (!currentUser) {
                    setError(t("analytics.not_authenticated") || "Not authenticated");
                    setLoading(false);
                    return;
                }

                setUserId(currentUser);

                if (!username) {
                    const userInfo = await fastUserLookup(currentUser);
                    if (userInfo?.username) {
                        setUsername(userInfo.username);
                    } else {
                        const userData = await fetchUserData(currentUser);
                        if (!userData) {
                            setError(t("analytics.user_data_not_found") || "User data not found");
                            setLoading(false);
                            return;
                        }
                        setUsername(userData.username || currentUser);
                    }
                }

                const analyticsRef = doc(collection(fireApp, "Analytics"), currentUser);
                
                unsubscribe = onSnapshot(analyticsRef, (docSnapshot) => {
                    setIsConnected(true);
                    setLastUpdate(new Date());
                    setConnectionRetries(0);
                    
                    const data = docSnapshot.exists() ? docSnapshot.data() : {};
                    const processedAnalytics = processAnalyticsData(data, username);
                    
                    setAnalyticsData({
                        today: { views: processedAnalytics.todayViews, clicks: processedAnalytics.todayClicks },
                        week: { views: processedAnalytics.thisWeekViews, clicks: processedAnalytics.thisWeekClicks },
                        month: { views: processedAnalytics.thisMonthViews, clicks: processedAnalytics.thisMonthClicks },
                        all: { views: processedAnalytics.totalViews, clicks: processedAnalytics.totalClicks }
                    });
                    
                    setAnalytics(processedAnalytics);
                    setLoading(false);

                }, (error) => {
                    console.error("❌ Analytics listener error:", error);
                    setIsConnected(false);
                    const newRetryCount = retryCount + 1;
                    setConnectionRetries(newRetryCount);
                    
                    if (newRetryCount < 5) {
                        const retryDelay = Math.min(1000 * Math.pow(2, newRetryCount), 30000);
                        retryTimeout = setTimeout(() => setupRealtimeAnalytics(newRetryCount), retryDelay);
                    } else {
                        setError(t("analytics.connection_failed") || "Connection failed after multiple attempts");
                        setLoading(false);
                    }
                });

            } catch (err) {
                console.error("❌ Error setting up analytics:", err);
                setError(t("analytics.setup_failed") || "Failed to setup analytics");
                setLoading(false);
                setIsConnected(false);
            }
        };

        setupRealtimeAnalytics();

        return () => {
            if (unsubscribe) unsubscribe();
            if (retryTimeout) clearTimeout(retryTimeout);
        };
    }, [t, username]);

    const getWeekKey = () => {
        const now = new Date();
        const yearStart = new Date(now.getFullYear(), 0, 1);
        const weekNumber = Math.ceil(((now - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
        return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
    };

    const getMonthKey = () => {
        const now = new Date();
        return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    };

    const processAnalyticsData = (data, currentUsername) => {
        const today = new Date().toISOString().split('T')[0];
        const weekKey = getWeekKey();
        const monthKey = getMonthKey();

        const topLinks = Object.entries(data.linkClicks || {})
            .map(([linkId, linkData]) => ({
                linkId,
                title: linkData.title || 'Untitled Link',
                url: linkData.url || '',
                type: linkData.type || 'custom',
                totalClicks: linkData.totalClicks || 0,
                ...linkData
            }))
            .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0));
        
        return {
            totalViews: data.totalViews || 0,
            todayViews: data.dailyViews?.[today] || 0,
            thisWeekViews: data.weeklyViews?.[weekKey] || 0,
            thisMonthViews: data.monthlyViews?.[monthKey] || 0,
            totalClicks: data.totalClicks || 0,
            todayClicks: data.dailyTotalClicks?.[today] || 0,
            thisWeekClicks: data.weeklyTotalClicks?.[weekKey] || 0,
            thisMonthClicks: data.monthlyTotalClicks?.[monthKey] || 0,
            topLinks,
            lastUpdated: data.lastUpdated,
            username: currentUsername
        };
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[400px]">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <div className="absolute inset-0 rounded-full h-12 w-12 border-t-2 border-purple-500 animate-pulse"></div>
                    </div>
                    <div className="text-center">
                        <span className="text-gray-700 text-sm font-medium">
                            {t("analytics.loading") || "Loading analytics..."}
                        </span>
                        {connectionRetries > 0 && (
                            <p className="text-xs text-gray-500 mt-1">
                                Retrying connection... (attempt {connectionRetries})
                            </p>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[400px]">
                <div className="text-center max-w-md bg-white p-6 rounded-lg shadow-md">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">
                        {t("analytics.error_loading") || "Analytics Unavailable"}
                    </h3>
                    <p className="text-sm mb-4 text-gray-600">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {t("analytics.retry") || "Retry"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 pb-20 bg-gray-50">
            <MobileAnalyticsHeader 
                username={username} 
                isConnected={isConnected} 
                userId={userId}
            />
            <MobilePeriodNavigation 
                selectedPeriod={selectedPeriod} 
                setSelectedPeriod={setSelectedPeriod} 
            />
            <MobileOverviewCards 
                analyticsData={analyticsData}
                selectedPeriod={selectedPeriod}
                isConnected={isConnected}
                lastUpdate={lastUpdate}
            />
            <MobileStatisticsGrid 
                analytics={analytics}
                isConnected={isConnected}
            />
            <MobileTopClickedLinks 
                analytics={analytics} 
                isConnected={isConnected} 
            />
            <MobileRecentActivity 
                analytics={analytics} 
                isConnected={isConnected} 
                username={username}
            />
            <div className="h-4"></div>
        </div>
    );
}