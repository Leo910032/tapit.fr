// app/dashboard/(dashboard pages)/analytics/components/TrafficSourcesChart.jsx - NEW COMPONENT
"use client"
import { useTranslation } from "@/lib/useTranslation";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';

export default function TrafficSourcesChart({ analytics }) {
    const { t } = useTranslation();

    // Guard clause if analytics data is not yet available
    if (!analytics || !analytics.trafficSources) {
        return (
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t('analytics.traffic_sources') || 'Traffic Sources'}
                </h2>
                <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                    {t('analytics.no_traffic_data') || 'No traffic source data available yet.'}
                </div>
            </div>
        );
    }

    // Process traffic sources data
    const trafficData = Object.entries(analytics.trafficSources)
        .map(([source, data]) => ({
            name: getSourceDisplayName(source),
            clicks: data.clicks || 0,
            views: data.views || 0,
            medium: data.medium || 'unknown',
            source: source
        }))
        .sort((a, b) => (b.clicks + b.views) - (a.clicks + a.views));

    // Only render if we have actual data points
    if (trafficData.length === 0 || trafficData.every(item => item.clicks === 0 && item.views === 0)) {
        return (
            <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t('analytics.traffic_sources') || 'Traffic Sources'}
                </h2>
                <div className="h-48 flex items-center justify-center text-gray-500 text-sm">
                    {t('analytics.no_traffic_data') || 'No traffic source data available yet.'}
                </div>
            </div>
        );
    }

    // Colors for different traffic sources
    const getSourceColor = (source, medium) => {
        if (medium === 'social') {
            switch (source) {
                case 'instagram': return '#E1306C';
                case 'tiktok': return '#000000';
                case 'twitter': return '#1DA1F2';
                case 'facebook': return '#4267B2';
                case 'linkedin': return '#0077B5';
                case 'youtube': return '#FF0000';
                case 'snapchat': return '#FFFC00';
                case 'discord': return '#5865F2';
                case 'reddit': return '#FF4500';
                case 'pinterest': return '#BD081C';
                default: return '#8B5CF6';
            }
        } else if (medium === 'search') {
            switch (source) {
                case 'google': return '#4285F4';
                case 'bing': return '#0078D4';
                case 'yahoo': return '#720E9E';
                case 'duckduckgo': return '#DE5833';
                default: return '#10B981';
            }
        } else if (medium === 'direct') {
            return '#6B7280';
        } else if (medium === 'email') {
            return '#F59E0B';
        } else if (medium === 'referral') {
            return '#EC4899';
        } else {
            return '#3B82F6';
        }
    };

    const COLORS = trafficData.map(item => getSourceColor(item.source, item.medium));

    return (
        <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-sm border">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
                {t('analytics.traffic_sources') || 'Traffic Sources'}
            </h2>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pie Chart */}
                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                        {t('analytics.source_distribution') || 'Source Distribution'}
                    </h3>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <PieChart>
                                <Pie
                                    data={trafficData}
                                    cx="50%"
                                    cy="50%"
                                    labelLine={false}
                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                    outerRadius={80}
                                    fill="#8884d8"
                                    dataKey="clicks"
                                >
                                    {trafficData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip formatter={(value, name) => [value, name === 'clicks' ? 'Clicks' : 'Views']} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Bar Chart */}
                <div>
                    <h3 className="text-lg font-medium text-gray-800 mb-4">
                        {t('analytics.clicks_by_source') || 'Clicks by Source'}
                    </h3>
                    <div style={{ width: '100%', height: 250 }}>
                        <ResponsiveContainer>
                            <BarChart data={trafficData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                <CartesianGrid strokeDasharray="3 3" />
                                <XAxis 
                                    dataKey="name" 
                                    tick={{ fontSize: 12 }}
                                    angle={-45}
                                    textAnchor="end"
                                    height={60}
                                />
                                <YAxis tick={{ fontSize: 12 }} />
                                <Tooltip />
                                <Bar dataKey="clicks" fill="#3B82F6" />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Traffic Sources Table */}
            <div className="mt-6">
                <h3 className="text-lg font-medium text-gray-800 mb-4">
                    {t('analytics.detailed_breakdown') || 'Detailed Breakdown'}
                </h3>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('analytics.source') || 'Source'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('analytics.medium') || 'Medium'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('analytics.clicks') || 'Clicks'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('analytics.views') || 'Views'}
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('analytics.conversion_rate') || 'CTR'}
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {trafficData.map((source, index) => (
                                <tr key={source.source} className="hover:bg-gray-50">
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div 
                                                className="w-3 h-3 rounded-full mr-3"
                                                style={{ backgroundColor: COLORS[index] }}
                                            ></div>
                                            <span className="text-sm font-medium text-gray-900 capitalize">
                                                {getSourceIcon(source.source)} {source.name}
                                            </span>
                                        </div>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap">
                                        <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getMediumBadgeClass(source.medium)}`}>
                                            {source.medium}
                                        </span>
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                                        {source.clicks}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {source.views}
                                    </td>
                                    <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {source.views > 0 ? ((source.clicks / source.views) * 100).toFixed(1) : 0}%
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

// Helper functions
function getSourceDisplayName(source) {
    const displayNames = {
        'instagram': 'Instagram',
        'tiktok': 'TikTok',
        'twitter': 'Twitter',
        'facebook': 'Facebook',
        'linkedin': 'LinkedIn',
        'youtube': 'YouTube',
        'snapchat': 'Snapchat',
        'discord': 'Discord',
        'reddit': 'Reddit',
        'pinterest': 'Pinterest',
        'google': 'Google',
        'bing': 'Bing',
        'yahoo': 'Yahoo',
        'duckduckgo': 'DuckDuckGo',
        'direct': 'Direct',
        'email': 'Email',
        'unknown': 'Unknown'
    };
    return displayNames[source] || source.charAt(0).toUpperCase() + source.slice(1);
}

function getSourceIcon(source) {
    const icons = {
        'instagram': '📸',
        'tiktok': '🎵',
        'twitter': '🐦',
        'facebook': '👤',
        'linkedin': '💼',
        'youtube': '📺',
        'snapchat': '👻',
        'discord': '🎮',
        'reddit': '🤖',
        'pinterest': '📌',
        'google': '🔍',
        'bing': '🔍',
        'yahoo': '🔍',
        'duckduckgo': '🔍',
        'direct': '🔗',
        'email': '📧',
        'unknown': '❓'
    };
    return icons[source] || '🌐';
}

function getMediumBadgeClass(medium) {
    switch (medium) {
        case 'social':
            return 'bg-purple-100 text-purple-800';
        case 'search':
            return 'bg-green-100 text-green-800';
        case 'direct':
            return 'bg-gray-100 text-gray-800';
        case 'email':
            return 'bg-yellow-100 text-yellow-800';
        case 'referral':
            return 'bg-pink-100 text-pink-800';
        default:
            return 'bg-blue-100 text-blue-800';
    }
}