
"use client"
import React, { useEffect, useState } from "react";
import { getAnalyticsData } from "@/lib/analytics/viewTracker";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { useTranslation } from "@/lib/useTranslation";
import Image from "next/image";

export default function AnalyticsPage() {
    const { t } = useTranslation();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState("");

    useEffect(() => {
        async function loadAnalytics() {
            try {
                const currentUser = testForActiveSession();
                if (!currentUser) {
                    setError("Not authenticated");
                    setLoading(false);
                    return;
                }

                const userData = await fetchUserData(currentUser);
                if (!userData) {
                    setError("User data not found");
                    setLoading(false);
                    return;
                }

                setUsername(userData.username);
                const analyticsData = await getAnalyticsData(userData.username);
                setAnalytics(analyticsData);
            } catch (err) {
                console.error("Error loading analytics:", err);
                setError("Failed to load analytics data");
            } finally {
                setLoading(false);
            }
        }

        loadAnalytics();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-3">Loading analytics...</span>
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
                    <p className="text-lg font-semibold mb-2">Error Loading Analytics</p>
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
        <div className="p-6 max-w-6xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    {t('analytics.title') || 'Analytics Dashboard'}
                </h1>
                <p className="text-gray-600">
                    {t('analytics.subtitle') || 'Track your profile views and engagement'}
                </p>
                {username && (
                    <p className="text-sm text-gray-500 mt-2">
                        Profile: @{username}
                    </p>
                )}
            </div>

            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                {/* Total Views */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-blue-100 p-3 rounded-lg">
                            <Image 
                                src="https://linktree.sirv.com/Images/icons/analytics.svg"
                                alt="views"
                                width={24}
                                height={24}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">
                            {t('analytics.total_views') || 'Total Views'}
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                            {analytics?.totalViews?.toLocaleString() || '0'}
                        </p>
                    </div>
                </div>

                {/* Today's Views */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-green-100 p-3 rounded-lg">
                            <Image 
                                src="https://linktree.sirv.com/Images/icons/analytics.svg"
                                alt="today"
                                width={24}
                                height={24}
                            />
                        </div>
                        {getChangeIndicator(analytics?.todayViews || 0, analytics?.yesterdayViews || 0)}
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">
                            {t('analytics.today_views') || "Today's Views"}
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                            {analytics?.todayViews?.toLocaleString() || '0'}
                        </p>
                        <p className="text-xs text-gray-500">
                            Yesterday: {analytics?.yesterdayViews || 0}
                        </p>
                    </div>
                </div>

                {/* This Week */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-purple-100 p-3 rounded-lg">
                            <Image 
                                src="https://linktree.sirv.com/Images/icons/analytics.svg"
                                alt="week"
                                width={24}
                                height={24}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">
                            {t('analytics.week_views') || 'This Week'}
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                            {analytics?.thisWeekViews?.toLocaleString() || '0'}
                        </p>
                    </div>
                </div>

                {/* This Month */}
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-4">
                        <div className="bg-orange-100 p-3 rounded-lg">
                            <Image 
                                src="https://linktree.sirv.com/Images/icons/analytics.svg"
                                alt="month"
                                width={24}
                                height={24}
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-gray-600">
                            {t('analytics.month_views') || 'This Month'}
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                            {analytics?.thisMonthViews?.toLocaleString() || '0'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t('analytics.recent_activity') || 'Recent Activity'}
                </h2>
                
                {analytics && analytics.totalViews > 0 ? (
                    <div className="space-y-4">
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
                                    <p className="font-medium text-gray-900">Profile Views</p>
                                    <p className="text-sm text-gray-600">
                                        {analytics?.lastUpdated ? 
                                            `Last updated: ${new Date(analytics.lastUpdated.seconds * 1000).toLocaleDateString()}` :
                                            'No recent activity'
                                        }
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-semibold text-gray-900">
                                    {analytics?.totalViews?.toLocaleString()}
                                </p>
                                <p className="text-sm text-gray-600">Total</p>
                            </div>
                        </div>
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
                        <p className="text-gray-600 mb-2">No views yet</p>
                        <p className="text-sm text-gray-500">
                            Share your profile to start tracking views!
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


{/*import GoogleMaps from './components/GoogleMaps';

export default function AnalyticsPage() {
    return (
        <div className="flex-1 py-2 flex flex-col max-h-full overflow-y-auto">
            <div className="w-full bg-white rounded-3xl my-3 flex flex-col p-6">
                <h2 className="text-xl font-semibold mb-4">Analytics Map</h2>
                <p className="text-gray-600 mb-6">
                    View geographic data and analytics for your Linktree profile.
                </p>
                <div className="w-full">
                    <GoogleMaps />
                </div>
            </div>
        </div>
    )
} */}