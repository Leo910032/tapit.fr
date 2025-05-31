// app/dashboard/(dashboard pages)/analytics/page.jsx (Updated with click analytics)
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
                        
                        const analyticsData = {
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
                        
                        setAnalytics(analyticsData);
                    } else {
                        console.log("No analytics document found - initializing with zeros");
                        // Document doesn't exist yet, show zeros
                        setAnalytics({
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

    return (
        <div className="p-4 lg:p-6 w-full h-full min-h-screen flex flex-col">
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

            {/* Overview Cards - Views */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Views</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                    {/* Total Views */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-blue-100 p-3 rounded-lg">
                                <Image 
                                    src="https://linktree.sirv.com/Images/icons/analytics.svg"
                                    alt="views"
                                    width={24}
                                    height={24}
                                />
                            </div>
                            {isConnected && (
                                <div className="animate-pulse bg-blue-500 w-2 h-2 rounded-full"></div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">
                                {t('analytics.total_views') || 'Total Views'}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 transition-all duration-500">
                                {analytics?.totalViews?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </div>

                    {/* Today's Views */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-green-100 p-3 rounded-lg">
                                <Image 
                                    src="https://linktree.sirv.com/Images/icons/analytics.svg"
                                    alt="today"
                                    width={24}
                                    height={24}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                {getChangeIndicator(analytics?.todayViews || 0, analytics?.yesterdayViews || 0)}
                                {isConnected && (
                                    <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">
                                {t('analytics.today_views') || "Today's Views"}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 transition-all duration-500">
                                {analytics?.todayViews?.toLocaleString() || '0'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {t('analytics.yesterday') || 'Yesterday'}: {analytics?.yesterdayViews || 0}
                            </p>
                        </div>
                    </div>

                    {/* This Week Views */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-purple-100 p-3 rounded-lg">
                                <Image 
                                    src="https://linktree.sirv.com/Images/icons/analytics.svg"
                                    alt="week"
                                    width={24}
                                    height={24}
                                />
                            </div>
                            {isConnected && (
                                <div className="animate-pulse bg-purple-500 w-2 h-2 rounded-full"></div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">
                                {t('analytics.week_views') || 'This Week'}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 transition-all duration-500">
                                {analytics?.thisWeekViews?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </div>

                    {/* This Month Views */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-orange-100 p-3 rounded-lg">
                                <Image 
                                    src="https://linktree.sirv.com/Images/icons/analytics.svg"
                                    alt="month"
                                    width={24}
                                    height={24}
                                />
                            </div>
                            {isConnected && (
                                <div className="animate-pulse bg-orange-500 w-2 h-2 rounded-full"></div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">
                                {t('analytics.month_views') || 'This Month'}
                            </p>
                            <p className="text-3xl font-bold text-gray-900 transition-all duration-500">
                                {analytics?.thisMonthViews?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Overview Cards - Clicks */}
            <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Link Clicks</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 lg:gap-6">
                    {/* Total Clicks */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-indigo-100 p-3 rounded-lg">
                                <Image 
                                    src="https://linktree.sirv.com/Images/icons/links.svg"
                                    alt="clicks"
                                    width={24}
                                    height={24}
                                />
                            </div>
                            {isConnected && (
                                <div className="animate-pulse bg-indigo-500 w-2 h-2 rounded-full"></div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">
                                Total Clicks
                            </p>
                            <p className="text-3xl font-bold text-gray-900 transition-all duration-500">
                                {analytics?.totalClicks?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </div>

                    {/* Today's Clicks */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-emerald-100 p-3 rounded-lg">
                                <Image 
                                    src="https://linktree.sirv.com/Images/icons/links.svg"
                                    alt="today clicks"
                                    width={24}
                                    height={24}
                                />
                            </div>
                            <div className="flex items-center gap-2">
                                {getChangeIndicator(analytics?.todayClicks || 0, analytics?.yesterdayClicks || 0)}
                                {isConnected && (
                                    <div className="animate-pulse bg-emerald-500 w-2 h-2 rounded-full"></div>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">
                                Today's Clicks
                            </p>
                            <p className="text-3xl font-bold text-gray-900 transition-all duration-500">
                                {analytics?.todayClicks?.toLocaleString() || '0'}
                            </p>
                            <p className="text-xs text-gray-500">
                                Yesterday: {analytics?.yesterdayClicks || 0}
                            </p>
                        </div>
                    </div>

                    {/* This Week Clicks */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-pink-100 p-3 rounded-lg">
                                <Image 
                                    src="https://linktree.sirv.com/Images/icons/links.svg"
                                    alt="week clicks"
                                    width={24}
                                    height={24}
                                />
                            </div>
                            {isConnected && (
                                <div className="animate-pulse bg-pink-500 w-2 h-2 rounded-full"></div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">
                                This Week Clicks
                            </p>
                            <p className="text-3xl font-bold text-gray-900 transition-all duration-500">
                                {analytics?.thisWeekClicks?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </div>

                    {/* This Month Clicks */}
                    <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 transition-all duration-300 hover:shadow-md">
                        <div className="flex items-center justify-between mb-4">
                            <div className="bg-yellow-100 p-3 rounded-lg">
                                <Image 
                                    src="https://linktree.sirv.com/Images/icons/links.svg"
                                    alt="month clicks"
                                    width={24}
                                    height={24}
                                />
                            </div>
                            {isConnected && (
                                <div className="animate-pulse bg-yellow-500 w-2 h-2 rounded-full"></div>
                            )}
                        </div>
                        <div className="space-y-2">
                            <p className="text-sm font-medium text-gray-600">
                                This Month Clicks
                            </p>
                            <p className="text-3xl font-bold text-gray-900 transition-all duration-500">
                                {analytics?.thisMonthClicks?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Top Clicked Links */}
            {analytics?.topLinks?.length > 0 && (
                <div className="mb-6">
                    <div className="bg-white rounded-xl shadow-sm border p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-semibold text-gray-900">
                                Top Clicked Links
                            </h2>
                            {isConnected && (
                                <div className="flex items-center gap-2 text-sm text-green-600">
                                    <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                                    <span>Real-time updates</span>
                                </div>
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            {analytics.topLinks.map((link, index) => (
                                <div key={link.linkId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                    <div className="flex items-center space-x-3">
                                        <div className="bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm font-medium">
                                            #{index + 1}
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900 truncate max-w-xs">
                                                {link.title || 'Untitled Link'}
                                            </p>
                                            <p className="text-sm text-gray-500 truncate max-w-xs">
                                                {link.url}
                                            </p>
                                            {link.lastClicked && (
                                                <p className="text-xs text-gray-400">
                                                    Last clicked: {new Date(link.lastClicked.seconds * 1000).toLocaleDateString()}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-semibold text-gray-900">
                                            {link.totalClicks?.toLocaleString() || 0}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            clicks
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-4 lg:p-6 flex-1">
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
                                            Link Clicks
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            Total interactions with your links
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="font-semibold text-gray-900 transition-all duration-500">
                                        {analytics?.totalClicks?.toLocaleString()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        clicks
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