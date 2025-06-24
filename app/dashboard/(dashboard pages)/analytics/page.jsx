// app/dashboard/(dashboard pages)/analytics/page.jsx - COMPLETE VERSION
"use client"
import React, { useEffect, useState } from "react";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { useTranslation } from "@/lib/useTranslation";
import { fireApp } from "@/important/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { fastUserLookup } from "@/lib/userLookup";

// Import all analytics components
import AnalyticsHeader from "./components/AnalyticsHeader";
import PeriodNavigation from "./components/PeriodNavigation";
import OverviewCards from "./components/OverviewCards";
import StatisticsGrid from "./components/StatisticsGrid";
import TopClickedLinks from "./components/TopClickedLinks";
import LinkAnalyticsChart from "./components/LinkAnalyticsChart";
import PerformanceChart from "./components/PerformanceChart";
import LinkTypeDistribution from "./components/LinkTypeDistribution";

export default function AnalyticsPage() {
    const { t } = useTranslation();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState("");
    const [isConnected, setIsConnected] = useState(false);

    // This state is controlled by PeriodNavigation and read by OverviewCards
    const [selectedPeriod, setSelectedPeriod] = useState('all');

    // This state holds the pre-calculated data for each period
    const [analyticsData, setAnalyticsData] = useState({
        today: { views: 0, clicks: 0 },
        week: { views: 0, clicks: 0 },
        month: { views: 0, clicks: 0 },
        all: { views: 0, clicks: 0 }
    });

    // Helper functions for date keys
    const getWeekKey = () => { const now = new Date(); const yearStart = new Date(now.getFullYear(), 0, 1); const weekNumber = Math.ceil(((now - yearStart) / 86400000 + yearStart.getDay() + 1) / 7); return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`; };
    const getMonthKey = () => { const now = new Date(); return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`; };

    // Function to process raw data from Firestore
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
                todayClicks: linkData.dailyClicks?.[today] || 0,
                weekClicks: linkData.weeklyClicks?.[weekKey] || 0,
                monthClicks: linkData.monthlyClicks?.[monthKey] || 0,
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
            dailyViews: data.dailyViews || {},
            dailyClicks: data.dailyClicks || {},
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
                if (userInfo) setUsername(userInfo.username);

                const analyticsRef = doc(collection(fireApp, "Analytics"), currentUser);
                const unsubscribe = onSnapshot(analyticsRef, (docSnapshot) => {
                    setIsConnected(true);
                    const data = docSnapshot.exists() ? docSnapshot.data() : {};
                    const processed = processAnalyticsData(data);

                    setAnalytics(processed);
                    setAnalyticsData({
                        today: { views: processed.todayViews, clicks: processed.todayClicks },
                        week: { views: processed.thisWeekViews, clicks: processed.thisWeekClicks },
                        month: { views: processed.thisMonthViews, clicks: processed.thisMonthClicks },
                        all: { views: processed.totalViews, clicks: processed.totalClicks }
                    });
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
        return <div className="flex items-center justify-center h-screen"><div className="text-lg">Loading Analytics...</div></div>;
    }
    if (error) {
        return <div className="flex items-center justify-center h-screen"><div className="text-lg text-red-500">Error: {error}</div></div>;
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50">
            <AnalyticsHeader username={username} isConnected={isConnected} />

            <PeriodNavigation
                selectedPeriod={selectedPeriod}
                setSelectedPeriod={setSelectedPeriod}
            />

            <OverviewCards
                analyticsData={analyticsData}
                selectedPeriod={selectedPeriod}
                analytics={analytics}
                isConnected={isConnected}
            />

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-8">
                <div className="lg:col-span-3">
                    <PerformanceChart analytics={analytics} />
                </div>
                <div className="lg:col-span-2">
                    <LinkTypeDistribution analytics={analytics} />
                </div>
            </div>

            <StatisticsGrid analytics={analytics} />
            <LinkAnalyticsChart analytics={analytics} isConnected={isConnected} />
            <TopClickedLinks analytics={analytics} isConnected={isConnected} />

            <div className="h-16"></div>
        </div>
    );
}