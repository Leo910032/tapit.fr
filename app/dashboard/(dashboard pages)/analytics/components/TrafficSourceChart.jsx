// app/dashboard/(dashboard pages)/analytics/components/TrafficSourceChart.jsx
"use client"
import { useTranslation } from "@/lib/useTranslation";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function TrafficSourceChart({ analytics, isConnected }) {
    const { t } = useTranslation();

    // Process traffic source data
    const processTrafficSources = () => {
        if (!analytics?.globalTrafficSources) {
            return [];
        }

        return Object.entries(analytics.globalTrafficSources)
            .map(([source, data]) => ({
                name: source,
                clicks: data.totalClicks || 0,
                medium: data.medium || 'unknown',
                type: data.type || 'unknown',
                lastClick: data.lastClick,
                percentage: 0 // Will be calculated below
            }))
            .sort((a, b) => b.clicks - a.clicks);
    };

    const trafficData = processTrafficSources();
    
    if (!trafficData.length) {
        return (
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t('analytics.traffic_sources') || 'Traffic Sources'}
                    </h2>
                    {isConnected && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                            <span>{t('analytics.real_time_updates') || 'Real-time updates'}</span>
                        </div>
                    )}
                </div>
                
                <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                        </svg>
                    </div>
                    <p className="text-gray-600 mb-2">
                        {t('analytics.no_traffic_data') || 'No traffic source data yet'}
                    </p>
                    <p className="text-sm text-gray-500">
                        {t('analytics.traffic_data_description') || 'Share your profile to see where your visitors come from!'}
                    </p>
                </div>
            </div>
        );
    }

    // Calculate percentages
    const totalClicks = trafficData.reduce((sum, item) => sum + item.clicks, 0);
    trafficData.forEach(item => {
        item.percentage = totalClicks > 0 ? (item.clicks / totalClicks) * 100 : 0;
    });

    // Colors for different traffic sources
    const getSourceColor = (source) => {
        const colorMap = {
            'instagram': '#E1306C',
            'tiktok': '#000000',
            'twitter': '#1DA1F2',
            'facebook': '#4267B2',
            'youtube': '#FF0000',
            'linkedin': '#0077B5',
            'snapchat': '#FFFC00',
            'pinterest': '#BD081C',
            'reddit': '#FF4500',
            'google': '#4285F4',
            'direct': '#6B7280',
            'unknown': '#9CA3AF'
        };
        return colorMap[source.toLowerCase()] || '#3B82F6';
    };

    // Get source icon
    const getSourceIcon = (source) => {
        const iconMap = {
            'instagram': '📸',
            'tiktok': '🎵',
            'twitter': '🐦',
            'facebook': '👥',
            'youtube': '📺',
            'linkedin': '💼',
            'snapchat': '👻',
            'pinterest': '📌',
            'reddit': '🤖',
            'google': '🔍',
            'direct': '🔗',
            'unknown': '❓'
        };
        return iconMap[source.toLowerCase()] || '🌐';
    };

    const colors = trafficData.map(item => getSourceColor(item.name));

    return (
        <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t('analytics.traffic_sources') || 'Traffic Sources'}
                    </h2>
                    {isConnected && (
                        <div className="flex items-center gap-2 text-sm text-green-600">
                            <div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>
                            <span>{t('analytics.real_time_updates') || 'Real-time updates'}</span>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Pie Chart */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-4">
                            {t('analytics.traffic_distribution') || 'Traffic Distribution'}
                        </h3>
                        <div style={{ width: '100%', height: 300 }}>
                            <ResponsiveContainer>
                                <PieChart>
                                    <Pie
                                        data={trafficData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="clicks"
                                        label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                                    >
                                        {trafficData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={colors[index]} />
                                        ))}
                                    </Pie>
                                    <Tooltip />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Source Details */}
                    <div>
                        <h3 className="text-lg font-medium text-gray-800 mb-4">
                            {t('analytics.source_breakdown') || 'Source Breakdown'}
                        </h3>
                        <div className="space-y-3">
                            {trafficData.map((item, index) => (
                                <div key={item.name} className="group">
                                    <div className="flex items-center justify-between mb-1">
                                        <div className="flex items-center gap-2 min-w-0 flex-1">
                                            <span className="text-lg">{getSourceIcon(item.name)}</span>
                                            <span className="text-sm font-medium text-gray-700 capitalize">
                                                {item.name}
                                            </span>
                                            <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                                {item.medium}
                                            </span>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-sm font-bold text-gray-900">
                                                {item.clicks}
                                            </span>
                                            <span className="text-xs text-gray-500 ml-1">
                                                ({item.percentage.toFixed(1)}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="w-full bg-gray-200 rounded-full h-2 relative overflow-hidden">
                                        <div 
                                            className="h-full rounded-full transition-all duration-1000 ease-out"
                                            style={{ 
                                                backgroundColor: colors[index],
                                                width: `${item.percentage}%`
                                            }}
                                        ></div>
                                    </div>
                                    {item.lastClick && (
                                        <div className="mt-1">
                                            <span className="text-xs text-gray-500">
                                                Last: {new Date(item.lastClick.toDate ? item.lastClick.toDate() : item.lastClick).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">
                                {trafficData.length}
                            </p>
                            <p className="text-sm text-gray-600">
                                {t('analytics.traffic_sources_count') || 'Traffic Sources'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">
                                {trafficData.filter(source => source.type === 'social').length}
                            </p>
                            <p className="text-sm text-gray-600">
                                {t('analytics.social_sources') || 'Social Media'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">
                                {((trafficData.find(source => source.name === 'direct')?.percentage || 0)).toFixed(1)}%
                            </p>
                            <p className="text-sm text-gray-600">
                                {t('analytics.direct_traffic') || 'Direct Traffic'}
                            </p>
                        </div>
                        <div className="text-center">
                            <p className="text-2xl font-bold text-orange-600">
                                {trafficData[0]?.name || 'N/A'}
                            </p>
                            <p className="text-sm text-gray-600">
                                {t('analytics.top_source') || 'Top Source'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Top Performing Sources */}
                <div className="mt-8 pt-6 border-t border-gray-100">
                    <h4 className="text-md font-semibold text-gray-800 mb-4">
                        {t('analytics.top_performing_sources') || 'Top Performing Sources'}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {trafficData.slice(0, 3).map((source, index) => (
                            <div key={source.name} className="bg-gray-50 rounded-lg p-4">
                                <div className="flex items-center gap-3 mb-2">
                                    <div 
                                        className="w-8 h-8 rounded-full flex items-center justify-center text-white text-lg"
                                        style={{ backgroundColor: colors[index] }}
                                    >
                                        {getSourceIcon(source.name)}
                                    </div>
                                    <div>
                                        <h5 className="font-semibold text-gray-900 capitalize">
                                            {source.name}
                                        </h5>
                                        <p className="text-xs text-gray-500">
                                            {source.medium} • {source.type}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex justify-between items-center">
                                    <span className="text-lg font-bold text-gray-900">
                                        {source.clicks}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        {source.percentage.toFixed(1)}% of traffic
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}