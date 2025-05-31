// app/dashboard/(dashboard pages)/analytics/page.jsx - Enhanced with date range navigation
"use client"
import React, { useEffect, useState } from "react";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { useTranslation } from "@/lib/useTranslation";
import Image from "next/image";
import { fireApp } from "@/important/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";

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
                        
                        // Process link clicks data
                        const linkClicks = data.linkClicks || {};
                        const topLinks = Object.entries(linkClicks)
                            .map(([linkId, linkData]) => ({
                                linkId,
                                ...linkData
                            }))
                            .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0))
                            .slice(0, 5); // Top 5 clicked links
                        
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

    const getChangeIndicator = (current, previous) => {
        if (previous === 0) return null;
        const change = ((current - previous) / previous) * 100;
        const isPositive = change > 0;
        
        return (
            <div className={`flex items-center text-sm ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <Image 
                    src={`https://linktree.sirv.com/Images/icons/arrow.svg`}
                    alt="trend"
                    width={12}
                    height={12}
                    className={`mr-1 ${isPositive ? '-rotate-90' : 'rotate-90'}`}
                />
                {Math.abs(change).toFixed(1)}%
            </div>
        );
    };

    // Get current period data
    const getCurrentData = () => {
        return analyticsData[selectedPeriod] || { views: 0, clicks: 0 };
    };

    // Get period label
    const getPeriodLabel = () => {
        switch (selectedPeriod) {
            case 'today': return t('analytics.period.today') || 'Today';
            case 'week': return t('analytics.period.this_week') || 'This Week';
            case 'month': return t('analytics.period.this_month') || 'This Month';
            case 'all': return t('analytics.period.all_time') || 'All Time';
            default: return 'Today';
        }
    };

    // Navigation items
    const navigationItems = [
        { id: 'today', label: t('analytics.nav.today') || 'Today', icon: '📅' },
        { id: 'week', label: t('analytics.nav.week') || 'Week', icon: '📊' },
        { id: 'month', label: t('analytics.nav.month') || 'Month', icon: '📈' },
        { id: 'all', label: t('analytics.nav.all_time') || 'All Time', icon: '🚀' }
    ];

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-3">{t("analytics.loading") || "Loading analytics..."}</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-red-600 min-h-[400px]">
                <div className="text-center">
                    <div className="mb-4">
                        <Image 
                            src="https://linktree.sirv.com/Images/icons/svgexport-40.svg"
                            alt="error"
                            width={48}
                            height={48}
                            className="mx-auto opacity-50"
                        />
                    </div>
                    <p className="text-lg font-semibold mb-2">
                        {t("analytics.error_loading") || "Error Loading Analytics"}
                    </p>
                    <p className="text-sm">{error}</p>
                </div>
            </div>
        );
    }

    const currentData = getCurrentData();

    return (
        <div className="p-4 lg:p-6 w-full h-full min-h-screen flex flex-col">
            {/* Header */}
            <div className="mb-6 lg:mb-8">
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            {t('analytics.title') || 'Analytics Dashboard'}
                        </h1>
                        <p className="text-gray-600">
                            {t('analytics.subtitle') || 'Track your profile views and link clicks'}
                        </p>
                        {username && (
                            <p className="text-sm text-gray-500 mt-2">
                                {t('analytics.profile') || 'Profile:'} @{username}
                            </p>
                        )}
                    </div>
                    
                    {/* Real-time connection indicator */}
                    <div className="flex items-center gap-2">
                        <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
                        <span className="text-sm text-gray-500">
                            {isConnected ? 
                                (t("analytics.live_connection") || "Live") : 
                                (t("analytics.disconnected") || "Disconnected")
                            }
                        </span>
                    </div>
                </div>
            </div>

         {/* Date Range Navigation - UPDATED with even spacing */}
            <div className="mb-8">
                <div className="bg-white rounded-xl shadow-sm border p-2">
                    {/* Changed from flex flex-wrap gap-2 to grid with equal columns */}
                    <div className="grid grid-cols-4 gap-2">
                        {navigationItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setSelectedPeriod(item.id)}
                                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                                    selectedPeriod === item.id
                                        ? 'bg-blue-500 text-white shadow-md'
                                        : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                                }`}
                            >
                                <span className="text-lg">{item.icon}</span>
                                <span className="hidden sm:inline">{item.label}</span>
                                <span className="sm:hidden">{item.label.split(' ')[0]}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Current Period Overview */}
            <div className="mb-8">
                <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                    {t('analytics.overview_title', { period: getPeriodLabel() }) || `${getPeriodLabel()} Overview`}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Views Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-6 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Image 
                                    src="https://linktree.sirv.com/Images/icons/analytics.svg"
                                    alt="views"
                                    width={28}
                                    height={28}
                                />
                            </div>
                            {isConnected && (
                                <div className="animate-pulse bg-blue-500 w-2 h-2 rounded-full"></div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">
                                {t('analytics.profile_views') || 'Profile Views'}
                            </p>
                            <p className="text-4xl font-bold text-gray-900 transition-all duration-500">
                                {currentData.views.toLocaleString()}
                            </p>
                            {selectedPeriod === 'today' && getChangeIndicator(analytics?.todayViews || 0, analytics?.yesterdayViews || 0)}
                        </div>
                    </div>

                    {/* Clicks Card */}
                    <div className="bg-white rounded-xl shadow-sm border p-6 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <Image 
                                    src="https://linktree.sirv.com/Images/icons/links.svg"
                                    alt="clicks"
                                    width={28}
                                    height={28}
                                />
                            </div>
                            {isConnected && (
                                <div className="animate-pulse bg-indigo-500 w-2 h-2 rounded-full"></div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">
                                {t('analytics.link_clicks') || 'Link Clicks'}
                            </p>
                            <p className="text-4xl font-bold text-gray-900 transition-all duration-500">
                                {currentData.clicks.toLocaleString()}
                            </p>
                            {selectedPeriod === 'today' && getChangeIndicator(analytics?.todayClicks || 0, analytics?.yesterdayClicks || 0)}
                        </div>
                    </div>
                </div>
            </div>

            {/* All Time Statistics Grid */}
            <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t('analytics.complete_statistics') || 'Complete Statistics'}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Today */}
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">
                            {t('analytics.stats.today') || 'Today'}
                        </h3>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-blue-600">
                                {analytics?.todayViews || 0} {t('analytics.stats.views') || 'views'}
                            </p>
                            <p className="text-lg font-bold text-indigo-600">
                                {analytics?.todayClicks || 0} {t('analytics.stats.clicks') || 'clicks'}
                            </p>
                        </div>
                    </div>

                    {/* This Week */}
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">
                            {t('analytics.stats.this_week') || 'This Week'}
                        </h3>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-blue-600">
                                {analytics?.thisWeekViews || 0} {t('analytics.stats.views') || 'views'}
                            </p>
                            <p className="text-lg font-bold text-indigo-600">
                                {analytics?.thisWeekClicks || 0} {t('analytics.stats.clicks') || 'clicks'}
                            </p>
                        </div>
                    </div>

                    {/* This Month */}
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">
                            {t('analytics.stats.this_month') || 'This Month'}
                        </h3>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-blue-600">
                                {analytics?.thisMonthViews || 0} {t('analytics.stats.views') || 'views'}
                            </p>
                            <p className="text-lg font-bold text-indigo-600">
                                {analytics?.thisMonthClicks || 0} {t('analytics.stats.clicks') || 'clicks'}
                            </p>
                        </div>
                    </div>

                    {/* All Time */}
                    <div className="bg-white rounded-lg shadow-sm border p-4">
                        <h3 className="text-sm font-medium text-gray-600 mb-2">
                            {t('analytics.stats.all_time') || 'All Time'}
                        </h3>
                        <div className="space-y-1">
                            <p className="text-lg font-bold text-blue-600">
                                {analytics?.totalViews || 0} {t('analytics.stats.views') || 'views'}
                            </p>
                            <p className="text-lg font-bold text-indigo-600">
                                {analytics?.totalClicks || 0} {t('analytics.stats.clicks') || 'clicks'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Clicked Links */}
            {analytics?.topLinks?.length > 0 && (
                <div className="mb-8">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
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
                                <div key={link.linkId} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium">
                                            #{index + 1}
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium text-gray-900 truncate max-w-xs">
                                                {link.title || t('analytics.untitled_link') || 'Untitled Link'}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                                {link.url}
                                            </p>
                                            {link.lastClicked && (
                                                <p className="text-xs text-gray-400">
                                                    {t('analytics.last_clicked') || 'Last clicked'}: {new Date(link.lastClicked.seconds * 1000).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-gray-900">
                                            {link.totalClicks?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            {t('analytics.stats.clicks') || 'clicks'}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6 flex-1">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t('analytics.recent_activity') || 'Recent Activity'}
                    </h2>
                    {isConnected && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                            <span>{t('analytics.real_time_updates') || 'Real-time updates'}</span>
                        </div>
                    )}
                </div>
                
                {analytics && (analytics.totalViews > 0 || analytics.totalClicks > 0) ? (
                    <div className="space-y-4">
                        {analytics.totalViews > 0 && (
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-blue-100 p-2 rounded-lg">
                                        <Image 
                                            src="https://linktree.sirv.com/Images/icons/analytics.svg"
                                            alt="view"
                                            width={16}
                                            height={16}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {t('analytics.profile_views') || 'Profile Views'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {analytics?.lastUpdated ? 
                                                `${t('analytics.last_updated') || 'Last updated'}: ${new Date(analytics.lastUpdated.seconds * 1000).toLocaleDateString()}` :
                                                'No recent activity'
                                            }
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900 transition-all duration-500">
                                        {analytics?.totalViews?.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {t('analytics.total') || 'Total'}
                                    </p>
                                </div>
                            </div>
                        )}
                        
                        {analytics.totalClicks > 0 && (
                            <div className="flex items-center justify-between py-3 border-b border-gray-100">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-indigo-100 p-2 rounded-lg">
                                        <Image 
                                            src="https://linktree.sirv.com/Images/icons/links.svg"
                                            alt="click"
                                            width={16}
                                            height={16}
                                        />
                                    </div>
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {t('analytics.link_clicks') || 'Link Clicks'}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {t('analytics.total_interactions_description') || 'Total interactions with your links'}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900 transition-all duration-500">
                                        {analytics?.totalClicks?.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {t('analytics.stats.clicks') || 'clicks'}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <Image 
                            src="https://linktree.sirv.com/Images/icons/analytics.svg"
                            alt="no data"
                            width={48}
                            height={48}
                            className="mx-auto mb-4 opacity-50"
                        />
                        <p className="text-gray-600 mb-2">
                            {t('analytics.no_activity_yet') || 'No activity yet'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {t('analytics.share_to_track') || 'Share your profile to start tracking views and clicks!'}
                        </p>
                        {username && (
                            <div className="mt-4">
                                <p className="text-sm text-blue-600 break-all">
                                    https://www.tapit.fr/{username}
                                </p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}