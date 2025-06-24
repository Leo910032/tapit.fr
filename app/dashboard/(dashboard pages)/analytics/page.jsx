"use client"
import React, { useEffect, useState } from "react";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { useTranslation } from "@/lib/useTranslation";
import { fireApp } from "@/important/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { fastUserLookup } from "@/lib/userLookup";

// Import components
import AnalyticsHeader from "./components/AnalyticsHeader";
import PeriodNavigation from "./components/PeriodNavigation";
import OverviewCards from "./components/OverviewCards";
import PerformanceChart from "./components/PerformanceChart";
import LinkTypeDistribution from "./components/LinkTypeDistribution";
import LinkAnalyticsChart from "./components/LinkAnalyticsChart";

export default function AnalyticsPage() {
    const { t } = useTranslation();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    
    // analyticsData state is no longer needed here, as OverviewCards will calculate dynamically
    // based on the full 'analytics' object. Removed it for clarity in the explanation,
    // but the actual code doesn't strictly need its removal if you prefer to keep it.
    // However, it will not be used by OverviewCards anymore.

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

    const processAnalyticsData = (data) => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const weekKey = getWeekKey();
        const monthKey = getMonthKey();

        const topLinks = Object.entries(data.linkClicks || {})
            .map(([linkId, linkData]) => ({
                linkId,
                title: linkData.title || 'Untitled Link',
                url: linkData.url || '',
                type: linkData.type || 'custom',
                totalClicks: linkData.totalClicks || 0,
                // These 'todayClicks', 'weekClicks', 'monthClicks' are based on the CURRENT period keys,
                // not historical aggregation for the charts.
                todayClicks: linkData.dailyClicks?.[today] || 0,
                weekClicks: data.weeklyClicks?.[weekKey] || 0,
                monthClicks: data.monthlyClicks?.[monthKey] || 0,
                createdAt: linkData.createdAt || new Date().toISOString(),
                lastClicked: linkData.lastClicked,
            }))
            .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0));

        return {
            totalViews: data.totalViews || 0,
            todayViews: data.dailyViews?.[today] || 0,
            yesterdayViews: data.dailyViews?.[yesterday] || 0,
            thisWeekViews: data.weeklyViews?.[weekKey] || 0,
            thisMonthViews: data.monthlyViews?.[monthKey] || 0,
            totalClicks: data.totalClicks || 0,
            todayClicks: data.dailyClicks?.[today] || 0,
            yesterdayClicks: data.dailyClicks?.[yesterday] || 0,
            thisWeekClicks: data.weeklyClicks?.[weekKey] || 0,
            thisMonthClicks: data.monthlyClicks?.[monthKey] || 0,
            dailyViews: data.dailyViews || {}, // Pass full daily data
            dailyClicks: data.dailyClicks || {}, // Pass full daily data
            topLinks,
        };
    };

    useEffect(() => {
        const setupRealtimeAnalytics = async () => {
            try {
                const currentUser = testForActiveSession();
                if (!currentUser) {
                    setError("Not authenticated");
                    setLoading(false);
                    return;
                }

                const userInfo = await fastUserLookup(currentUser) || await fetchUserData(currentUser);
                if (userInfo?.username) setUsername(userInfo.username);

                const analyticsRef = doc(collection(fireApp, "Analytics"), currentUser);
                const unsubscribe = onSnapshot(analyticsRef, (docSnapshot) => {
                    setIsConnected(true);
                    const data = docSnapshot.exists() ? docSnapshot.data() : {};
                    const processed = processAnalyticsData(data);
                    
                    setAnalytics(processed);
                    // analyticsData state is no longer set here, as OverviewCards will derive directly from 'analytics'
                    setLoading(false);
                }, (err) => {
                    console.error("Firebase listener error:", err);
                    setError("Failed to connect to real-time analytics.");
                    setLoading(false);
                });
                return () => unsubscribe();
            } catch (err) {
                console.error("Setup error:", err);
                setLoading(false);
                setError("Failed to load analytics data.");
            }
        };
        setupRealtimeAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900"></div>
                <span className="ml-3 text-sm">Loading Analytics...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex items-center justify-center h-full">
                <div className="text-center">
                    <div className="text-red-500 text-sm mb-2">⚠️ Error</div>
                    <div className="text-gray-600 text-xs">{error}</div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 py-2 flex flex-col max-h-full overflow-y-auto pb-20">
            <div className="p-4 space-y-4">
                {/* Compact Header */}
                <div className="mb-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-lg font-bold text-gray-900">
                                {t('analytics.title') || 'Analytics'}
                            </h1>
                            <p className="text-xs text-gray-600 mt-1">
                                @{username}
                            </p>
                        </div>
                        <div className="flex items-center text-xs">
                            <div className={`w-2 h-2 rounded-full mr-2 ${isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`}></div>
                            <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                                {isConnected ? t('analytics.live_updates_enabled') : 'contacts.offline_updates_enabled'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Compact Period Navigation */}
                <div className="bg-white rounded-lg border p-3">
                    <div className="grid grid-cols-4 gap-1">
                        {[
                            { id: 'today', label: 'Today' },
                            { id: 'week', label: 'week' },
                            { id: 'month', label: 'month' },
                            { id: 'all', label: 'all' }
                        ].map((period) => (
                            <button
                                key={period.id}
                                onClick={() => setSelectedPeriod(period.id)}
                                className={`px-2 py-2 text-xs font-medium rounded-md transition-colors ${
                                    selectedPeriod === period.id
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                {t(`analytics.${period.id}`) || period.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Compact Overview Cards */}
                {/* ✅ FIX: Pass the full 'analytics' object instead of 'analyticsData' */}
                <OverviewCards
                    analytics={analytics} // Now passing the full processed analytics object
                    selectedPeriod={selectedPeriod}
                    isConnected={isConnected}
                />

{/* Full Width Performance Chart */}
<div className="bg-white rounded-lg border p-4">
    <div className="h-64 w-full">
        <PerformanceChart analytics={analytics} />
    </div>
</div>

                {/* Compact Statistics Grid (inlined) */}
                <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('analytics.quick_stats')}</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('analytics.total_links_')}</span>
                                <span className="font-medium">{analytics?.topLinks?.length || 0}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('analytics.active_links')}</span>
                                <span className="font-medium">{analytics?.topLinks?.filter(link => link.totalClicks > 0).length || 0}</span>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('analytics.Avg_CTR')}</span>
                                <span className="font-medium">
                                    {analytics?.totalViews > 0 ? ((analytics?.totalClicks / analytics?.totalViews) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-600">{t('analytics.Best_Day')}</span>
                                <span className="font-medium">
                                    {analytics?.dailyViews ? 
                                        Object.entries(analytics.dailyViews)
                                            .sort(([,a], [,b]) => b - a)[0]?.[1] || 0 
                                        : 0
                                    }
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Compact Top Links (inlined) */}
                <div className="bg-white rounded-lg border p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-3">{t('analytics.Top_Links')}</h3>
                    <div className="space-y-2">
                        {analytics?.topLinks?.slice(0, 5).map((link, index) => (
                            <div key={link.linkId} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                                <div className="flex items-center gap-2 flex-1 min-w-0">
                                    <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                                        <span className="text-xs font-bold text-blue-600">#{index + 1}</span>
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-xs font-medium text-gray-900 truncate">
                                            {link.title}
                                        </p>
                                        <p className="text-xs text-gray-500 truncate">
                                            {link.type}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <p className="text-xs font-bold text-gray-900">{link.totalClicks}</p>
                                    <p className="text-xs text-gray-500">{t('analytics.clicks')}</p>
                                </div>
                            </div>
                        )) || (
                            <div className="text-center py-4">
                                <p className="text-xs text-gray-500">{t('analytics.link_NA')}</p>
                            </div>
                            
                        )}
                        
                    </div>
                    

                    
                </div>

                {/* Main Link Analytics Chart */}
                <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm">
                    <div className="h-81"> 
                        <LinkAnalyticsChart analytics={analytics} isConnected={isConnected} />
                    </div>
                </div>

                {/* Performance Summary (inlined) */}
                <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg border p-4">
                    <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('analytics.Performance_summary')}</h3>
                    <div className="space-y-2 text-xs">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">{t('analytics.Total_engagement')}</span>
                            <span className="font-bold text-purple-600">
                                {(analytics?.totalViews || 0) + (analytics?.totalClicks || 0)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">{t('analytics.Most_active_period')}</span>
                            <span className="font-medium text-gray-900">
                                {analytics?.dailyViews && analytics?.dailyViews[Object.keys(analytics.dailyViews).sort().reverse()[0]] > 0 ? Object.keys(analytics.dailyViews).sort().reverse()[0] : 'N/A'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-600">{t('analytics.Growth_trend')}</span>
                            <span className={`font-medium ${
                                (analytics?.todayViews || 0) > (analytics?.yesterdayViews || 0) 
                                    ? 'text-green-600' : 'text-red-600'
                            }`}>
                                {(analytics?.todayViews || 0) > (analytics?.yesterdayViews || 0) ? t('analytics.Growing') : t('analytics.Declining')}
                            </span>
                        </div>
                    </div>
                    
                </div>
            </div>
            <div className="h-10"></div> {/* Spacer at the bottom */}
        </div>
    );
}