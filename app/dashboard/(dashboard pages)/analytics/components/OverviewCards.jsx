"use client"
import Image from "next/image";
import { useTranslation } from "@/lib/useTranslation";

export default function OverviewCards({ analyticsData, selectedPeriod, analytics, isConnected }) {
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

    const currentData = getCurrentData();

    return (
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
    );
}
