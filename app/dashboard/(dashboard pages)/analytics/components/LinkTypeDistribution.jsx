// app/dashboard/(dashboard pages)/analytics/components/LinkTypeDistribution.jsx
"use client"
import { useTranslation } from "@/lib/useTranslation";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';

export default function LinkTypeDistribution({ analytics }) {
    const { t } = useTranslation();

    // Aggregate clicks by type
    const typeData = analytics.topLinks.reduce((acc, link) => {
        const type = link.type || 'Custom';
        if (!acc[type]) {
            acc[type] = 0;
        }
        acc[type] += link.totalClicks || 0;
        return acc;
    }, {});

    const chartData = Object.entries(typeData)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value);

    if (chartData.length === 0) {
        return null; // Don't render if no data
    }

    const COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];

    return (
        <div className="mb-8">
            <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">
                    {t('analytics.clicks_by_type') || 'Clicks by Link Type'}
                </h2>
                <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                labelLine={false}
                                outerRadius={80}
                                innerRadius={60} // This makes it a donut chart
                                fill="#8884d8"
                                dataKey="value"
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip />
                            <Legend />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}