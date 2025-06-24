// app/dashboard/(dashboard pages)/analytics/components/LinkAnalyticsChart.jsx
"use client"
import { useTranslation } from "@/lib/useTranslation";
import Image from "next/image";

export default function LinkAnalyticsChart({ analytics, isConnected }) {
    const { t } = useTranslation();
    
    if (!analytics?.topLinks?.length) {
        return (
            <div className="mb-8">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-semibold text-gray-900">
                            {t('analytics.link_performance') || 'Link Performance'}
                        </h2>
                        {isConnected && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                                <span>{t('analytics.real_time_updates') || 'Real-time updates'}</span>
                            </div>
                        )}
                    </div>
                    
                    <div className="text-center py-8">
                        <Image 
                            src="https://linktree.sirv.com/Images/icons/links.svg"
                            alt="no data"
                            width={48}
                            height={48}
                            className="mx-auto mb-4 opacity-50"
                        />
                        <p className="text-gray-600 mb-2">
                            {t('analytics.no_link_data') || 'No link data yet'}
                        </p>
                        <p className="text-sm text-gray-500">
                            {t('analytics.add_links_to_track') || 'Add links to your profile to track their performance!'}
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    // Prepare data for charts
    const chartData = analytics.topLinks.slice(0, 8).map((link, index) => ({
        name: link.title?.length > 15 ? `${link.title.substring(0, 15)}...` : link.title || 'Untitled',
        clicks: link.totalClicks || 0,
        fullTitle: link.title || 'Untitled Link',
        type: link.type || 'custom',
        percentage: 0 // Will be calculated below
    }));

    // Calculate percentages
    const totalClicks = chartData.reduce((sum, item) => sum + item.clicks, 0);
    chartData.forEach(item => {
        item.percentage = totalClicks > 0 ? (item.clicks / totalClicks) * 100 : 0;
    });

    // Colors for the charts
    const colors = [
        '#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', 
        '#EF4444', '#EC4899', '#14B8A6', '#F97316'
    ];

    // Get link type color
    const getLinkTypeColor = (type) => {
        switch (type?.toLowerCase()) {
            case 'instagram':
                return 'from-purple-500 to-pink-500';
            case 'twitter':
                return 'from-blue-400 to-blue-500';
            case 'tiktok':
                return 'from-gray-800 to-black';
            case 'youtube':
                return 'from-red-500 to-red-600';
            case 'spotify':
                return 'from-green-500 to-green-600';
            case 'social':
                return 'from-purple-500 to-purple-600';
            case 'video':
                return 'from-red-400 to-red-500';
            case 'music':
                return 'from-indigo-500 to-indigo-600';
            default:
                return 'from-gray-500 to-gray-600';
        }
    };

    // Find max clicks for scaling
    const maxClicks = Math.max(...chartData.map(item => item.clicks));

    return (
        <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t('analytics.link_performance') || 'Link Performance'}
                    </h2>
                    {isConnected && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                            <span>{t('analytics.real_time_updates') || 'Real-time updates'}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Bar Chart */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-4">
                            {t('analytics.clicks_by_link') || 'Clicks by Link'}
                        </h3>
                        <div className="space-y-3">
                            {chartData.map((item, index) => (
                                <div key={index} className="group">
                                    <div className="flex items-center justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-700 truncate max-w-32">
                                            {item.name}
                                        </span>
                                        <span className="text-sm font-bold text-gray-900">
                                            {item.clicks}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-3 relative overflow-hidden">
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
                    </div>

                    {/* Pie Chart Alternative - Donut Progress */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-4">
                            {t('analytics.click_distribution') || 'Click Distribution'}
                        </h3>
                        
                        {/* Top Links with Visual Indicators */}
                        <div className="space-y-3">
                            {chartData.slice(0, 6).map((item, index) => (
                                <div key={index} className="flex items-center gap-3">
                                    <div 
                                        className="w-4 h-4 rounded-full flex-shrink-0"
                                        style={{ backgroundColor: colors[index % colors.length] }}
                                    ></div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700 truncate">
                                                {item.name}
                                            </span>
                                            <span className="text-sm font-bold text-gray-900 ml-2">
                                                {item.clicks}
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                                            <div 
                                                className="h-full rounded-full transition-all duration-1000 ease-out"
                                                style={{ 
                                                    backgroundColor: colors[index % colors.length],
                                                    width: `${item.percentage}%`
                                                }}
                                            ></div>
                                        </div>
                                        <span className="text-xs text-gray-500">
                                            {item.percentage.toFixed(1)}% {t('analytics.total_clicks_analytics')}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Legend */}
                      
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {analytics.topLinks.length}
                            </p>
                            <p className="text-sm text-gray-600">
                                {t('analytics.total_links') || 'Total Links'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {analytics.totalClicks || 0}
                            </p>
                            <p className="text-sm text-gray-600">
                                {t('analytics.total_clicks') || 'Total Clicks'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                                {analytics.topLinks.length > 0 ? Math.round((analytics.totalClicks || 0) / analytics.topLinks.length) : 0}
                            </p>
                            <p className="text-sm text-gray-600">
                                {t('analytics.avg_clicks_per_link') || 'Avg. Clicks per Link'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}