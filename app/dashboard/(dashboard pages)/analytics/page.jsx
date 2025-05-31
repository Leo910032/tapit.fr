// app/dashboard/(dashboard pages)/analytics/page.jsx - Refactored to use components
"use client"
import React, { useEffect, useState } from "react";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { useTranslation } from "@/lib/useTranslation";
import Image from "next/image";
import { fireApp } from "@/important/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";

// Import all analytics components
import AnalyticsHeader from "./components/AnalyticsHeader";
import PeriodNavigation from "./components/PeriodNavigation";
import OverviewCards from "./components/OverviewCards";
import StatisticsGrid from "./components/StatisticsGrid";
import TopClickedLinks from "./components/TopClickedLinks";
import LinkAnalyticsChart from "./components/LinkAnalyticsChart";

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
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-3">{t("analytics.loading") || "Loading analytics..."}</span>
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
                    <p className="text-sm">{error}</p>
                    <button 
                        onClick={() => window.location.reload()}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                        {t("analytics.retry") || "Retry"}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="p-4 lg:p-6 w-full min-h-screen overflow-auto pb-20">
            {/* Analytics Header */}
            <AnalyticsHeader 
                username={username} 
                isConnected={isConnected} 
            />

            {/* Period Navigation */}
            <PeriodNavigation 
                selectedPeriod={selectedPeriod} 
                setSelectedPeriod={setSelectedPeriod} 
            />

            {/* Overview Cards */}
            <OverviewCards 
                analyticsData={analyticsData}
                selectedPeriod={selectedPeriod}
                analytics={analytics}
                isConnected={isConnected}
            />

            {/* Statistics Grid */}
            <StatisticsGrid 
                analytics={analytics} 
            />

            {/* Link Analytics Chart - Only show if there are links */}
            {analytics?.topLinks?.length > 0 && (
                <LinkAnalyticsChart 
                    analytics={analytics} 
                    isConnected={isConnected} 
                />
            )}

            {/* Top Clicked Links */}
            <TopClickedLinks 
                analytics={analytics} 
                isConnected={isConnected} 
            />

            {/* Recent Activity - Fallback section for users with no links */}
            {(!analytics?.topLinks?.length || analytics.topLinks.length === 0) && (
                <RecentActivity 
                    analytics={analytics} 
                    isConnected={isConnected} 
                    username={username} 
                />
            )}
        </div>
    );
}

// Recent Activity Component - For when users have no links
function RecentActivity({ analytics, isConnected, username }) {
    const { t } = useTranslation();
    
    return (
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
                                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
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
                                    <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                                    </svg>
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
                    <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                    </div>
                    <p className="text-gray-600 mb-2">
                        {t('analytics.no_activity_yet') || 'No activity yet'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                        {t('analytics.share_to_track') || 'Share your profile to start tracking views and clicks!'}
                    </p>
                    {username && (
                        <div className="bg-gray-50 rounded-lg p-4">
                            <p className="text-sm text-gray-600 mb-2">
                                {t('analytics.your_profile_url') || 'Your profile URL:'}
                            </p>
                            <div className="flex items-center justify-center gap-2">
                                <p className="text-sm font-mono text-blue-600 break-all">
                                    https://www.tapit.fr/{username}
                                </p>
                                <button
                                    onClick={() => navigator.clipboard.writeText(`https://www.tapit.fr/${username}`)}
                                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
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