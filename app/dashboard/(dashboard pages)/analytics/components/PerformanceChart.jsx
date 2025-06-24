// app/dashboard/(dashboard pages)/analytics/components/PerformanceChart.jsx
"use client";
import { useTranslation } from "@/lib/useTranslation";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function PerformanceChart({ analytics }) {
    const { t } = useTranslation();

    // Prepare data for the last 7 days
    const chartData = Array.from({ length: 7 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateKey = d.toISOString().split('T')[0];
        
        return {
            name: d.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric' }),
            views: analytics?.dailyViews?.[dateKey] || 0,
            clicks: analytics?.dailyClicks?.[dateKey] || 0,
        };
    }).reverse();

    return (
        <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t('analytics.performance_last_7_days') || 'Performance (Last 7 Days)'}
                </h2>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <LineChart
                            data={chartData}
                            margin={{ top: 5, right: 20, left: -10, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis dataKey="name" stroke="#6b7280" fontSize={12} />
                            <YAxis stroke="#6b7280" fontSize={12} />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '0.5rem',
                                }}
                            />
                            <Legend />
                            <Line type="monotone" dataKey="views" stroke="#3b82f6" strokeWidth={2} name="Profile Views" />
                            <Line type="monotone" dataKey="clicks" stroke="#8b5cf6" strokeWidth={2} name="Link Clicks" />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}