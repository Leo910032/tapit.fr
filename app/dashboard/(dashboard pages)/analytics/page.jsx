// app/dashboard/(dashboard pages)/analytics/page.jsx - FULLY INTEGRATED VERSION
"use client"
import React, { useEffect, useState } from "react";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";
import { useTranslation } from "@/lib/useTranslation";
import { fireApp } from "@/important/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { fastUserLookup } from "@/lib/userLookup"; // ✅ Optimized lookup

// Import all analytics components
import AnalyticsHeader from "./components/AnalyticsHeader";
import PeriodNavigation from "./components/PeriodNavigation";
import OverviewCards from "./components/OverviewCards";
import StatisticsGrid from "./components/StatisticsGrid";
import TopClickedLinks from "./components/TopClickedLinks";
import LinkAnalyticsChart from "./components/LinkAnalyticsChart";
import ClickMap from "./components/ClickMap"; // ✅ Optimized ClickMap
import ContactsAnalytics from "./components/ContactsAnalytics"; // ✅ New ContactsAnalytics

export default function AnalyticsPage() {
    const { t } = useTranslation();
    const [analytics, setAnalytics] = useState(null);
    const [contactsData, setContactsData] = useState(null);
    const [contactsList, setContactsList] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [username, setUsername] = useState("");
    const [userId, setUserId] = useState("");
    const [isConnected, setIsConnected] = useState(false);
    const [selectedPeriod, setSelectedPeriod] = useState('all');
    const [activeView, setActiveView] = useState('overview'); // 'overview', 'links', 'contacts'
    
    const [analyticsData, setAnalyticsData] = useState({
        today: { views: 0, clicks: 0 },
        week: { views: 0, clicks: 0 },
        month: { views: 0, clicks: 0 },
        all: { views: 0, clicks: 0 }
    });

    // Helper functions
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

    const processAnalyticsData = (data, currentUsername) => {
        const today = new Date().toISOString().split('T')[0];
        const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
        const weekKey = getWeekKey();
        const monthKey = getMonthKey();

        const linkClicks = data.linkClicks || {};
        const topLinks = Object.entries(linkClicks)
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
            // Views data
            totalViews: data.totalViews || 0,
            todayViews: data.dailyViews?.[today] || 0,
            yesterdayViews: data.dailyViews?.[yesterday] || 0,
            thisWeekViews: data.weeklyViews?.[weekKey] || 0,
            thisMonthViews: data.monthlyViews?.[monthKey] || 0,
            
            // Clicks data
            totalClicks: data.totalClicks || 0,
            todayClicks: data.dailyClicks?.[today] || 0,
            yesterdayClicks: data.dailyClicks?.[yesterday] || 0,
            thisWeekClicks: data.weeklyClicks?.[weekKey] || 0,
            thisMonthClicks: data.monthlyClicks?.[monthKey] || 0,
            
            // Detailed data
            dailyViews: data.dailyViews || {},
            dailyClicks: data.dailyClicks || {},
            weeklyViews: data.weeklyViews || {},
            weeklyClicks: data.weeklyClicks || {},
            monthlyViews: data.monthlyViews || {},
            monthlyClicks: data.monthlyClicks || {},
            linkClicks: data.linkClicks || {},
            locations: data.locations || [], // For ClickMap
            topLinks,
            
            // Meta
            lastUpdated: data.lastUpdated,
            username: currentUsername
        };
    };

    useEffect(() => {
        let analyticsUnsubscribe = null;
        let contactsUnsubscribe = null;

        const setupRealtimeData = async () => {
            try {
                console.log("🚀 Setting up OPTIMIZED real-time analytics and contacts...");
                
                const currentUser = testForActiveSession();
                if (!currentUser) {
                    setError(t("analytics.not_authenticated") || "Not authenticated");
                    setLoading(false);
                    return;
                }

                console.log("👤 Current user ID:", currentUser);
                setUserId(currentUser);

                // ✅ OPTIMIZED: Use fast lookup to get username
                console.log("🔍 Using fast user lookup...");
                const userInfo = await fastUserLookup(currentUser);
                
                if (userInfo) {
                    console.log("✅ Found user via lookup:", userInfo.username);
                    setUsername(userInfo.username);
                } else {
                    // Fallback to fetchUserData
                    console.log("⚠️ Lookup failed, falling back to fetchUserData...");
                    const userData = await fetchUserData(currentUser);
                    if (!userData) {
                        setError(t("analytics.user_data_not_found") || "User data not found");
                        setLoading(false);
                        return;
                    }
                    setUsername(userData.username || currentUser);
                }

                // ✅ Setup Analytics listener
                console.log("📊 Setting up analytics listener...");
                const analyticsRef = doc(collection(fireApp, "Analytics"), currentUser);
                
                analyticsUnsubscribe = onSnapshot(analyticsRef, (docSnapshot) => {
                    console.log("📊 Analytics update received!");
                    setIsConnected(true);
                    
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data();
                        const processedAnalytics = processAnalyticsData(data, userInfo?.username || username);
                        
                        setAnalytics(processedAnalytics);
                        setAnalyticsData({
                            today: { views: processedAnalytics.todayViews, clicks: processedAnalytics.todayClicks },
                            week: { views: processedAnalytics.thisWeekViews, clicks: processedAnalytics.thisWeekClicks },
                            month: { views: processedAnalytics.thisMonthViews, clicks: processedAnalytics.thisMonthClicks },
                            all: { views: processedAnalytics.totalViews, clicks: processedAnalytics.totalClicks }
                        });
                    } else {
                        console.log("📭 No analytics document found");
                        const emptyAnalytics = {
                            totalViews: 0, todayViews: 0, thisWeekViews: 0, thisMonthViews: 0,
                            totalClicks: 0, todayClicks: 0, thisWeekClicks: 0, thisMonthClicks: 0,
                            dailyViews: {}, dailyClicks: {}, topLinks: [], locations: [],
                            username: userInfo?.username || username
                        };
                        setAnalytics(emptyAnalytics);
                        setAnalyticsData({
                            today: { views: 0, clicks: 0 }, week: { views: 0, clicks: 0 },
                            month: { views: 0, clicks: 0 }, all: { views: 0, clicks: 0 }
                        });
                    }
                    
                    setLoading(false);
                }, (error) => {
                    console.error("❌ Analytics listener error:", error);
                    setIsConnected(false);
                    setError(t("analytics.failed_to_connect") || "Failed to connect to analytics");
                    setLoading(false);
                });

                // ✅ Setup Contacts listener
                console.log("📱 Setting up contacts listener...");
                const contactsRef = doc(collection(fireApp, "Contacts"), currentUser);
                
                contactsUnsubscribe = onSnapshot(contactsRef, (docSnapshot) => {
                    console.log("📱 Contacts update received!");
                    
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data();
                        const contacts = data.contacts || [];
                        
                        console.log("📊 Contacts count:", contacts.length);
                        setContactsList(contacts);
                        
                        // Process contacts analytics
                        const contactsAnalytics = {
                            totalContacts: contacts.length,
                            contactsWithLocation: contacts.filter(c => c.location && c.location.latitude).length,
                            contactsWithoutLocation: contacts.filter(c => !c.location || !c.location.latitude).length,
                            locationStats: data.locationStats || {},
                            recentContacts: contacts
                                .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                                .slice(0, 5),
                            lastUpdated: data.lastUpdated
                        };
                        
                        setContactsData(contactsAnalytics);
                    } else {
                        console.log("📭 No contacts document found");
                        setContactsList([]);
                        setContactsData({
                            totalContacts: 0, contactsWithLocation: 0, contactsWithoutLocation: 0,
                            locationStats: {}, recentContacts: []
                        });
                    }
                }, (error) => {
                    console.error("❌ Contacts listener error:", error);
                    // Don't fail the whole page for contacts errors
                    setContactsList([]);
                    setContactsData({ totalContacts: 0, contactsWithLocation: 0, recentContacts: [] });
                });

            } catch (err) {
                console.error("❌ Error setting up real-time data:", err);
                setError(t("analytics.setup_failed") || "Failed to setup analytics");
                setLoading(false);
            }
        };

        setupRealtimeData();

        // Cleanup function
        return () => {
            if (analyticsUnsubscribe) {
                console.log("🧹 Cleaning up analytics listener");
                analyticsUnsubscribe();
            }
            if (contactsUnsubscribe) {
                console.log("🧹 Cleaning up contacts listener");
                contactsUnsubscribe();
            }
        };
    }, [username, t]);

    // Loading state
    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[400px]">
                <div className="flex flex-col items-center space-y-4">
                    <div className="relative">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                        <div className="absolute inset-0 rounded-full h-12 w-12 border-t-2 border-purple-500 animate-pulse"></div>
                    </div>
                    <div className="text-center">
                        <span className="text-gray-700 text-sm font-medium">
                            {t("analytics.loading") || "Loading analytics..."}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex items-center justify-center p-8 text-red-600 min-h-[400px]">
                <div className="text-center max-w-md">
                    <div className="mb-4">
                        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                            </svg>
                        </div>
                    </div>
                    <h3 className="text-lg font-semibold mb-2 text-gray-900">
                        {t("analytics.error_loading") || "Analytics Unavailable"}
                    </h3>
                    <p className="text-sm mb-4 text-gray-600">{error}</p>
                    <div className="flex gap-2 justify-center">
                        <button 
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            {t("analytics.retry") || "Retry"}
                        </button>
                        <button 
                            onClick={() => window.location.href = '/dashboard'}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                        >
                            {t("analytics.go_back") || "Go Back"}
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-gray-50 min-h-screen">
            {/* ✅ Analytics Header */}
            <AnalyticsHeader 
                username={username} 
                isConnected={isConnected}
                userId={userId}
            />

            {/* ✅ View Navigation Tabs */}
            <div className="mb-6">
                <div className="bg-white rounded-lg shadow-sm border p-1">
                    <div className="grid grid-cols-3 gap-1">
                        <button
                            onClick={() => setActiveView('overview')}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                                activeView === 'overview'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                            </svg>
                            {t('analytics.overview') || 'Overview'}
                        </button>
                        <button
                            onClick={() => setActiveView('links')}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                                activeView === 'links'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                            </svg>
                            {t('analytics.links') || 'Links'} 
                            {analytics?.topLinks?.length > 0 && (
                                <span className="bg-blue-100 text-blue-600 text-xs px-2 py-0.5 rounded-full">
                                    {analytics.topLinks.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveView('contacts')}
                            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
                                activeView === 'contacts'
                                    ? 'bg-blue-500 text-white shadow-md'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            {t('analytics.contacts') || 'Contacts'}
                            {contactsData?.totalContacts > 0 && (
                                <span className="bg-green-100 text-green-600 text-xs px-2 py-0.5 rounded-full">
                                    {contactsData.totalContacts}
                                </span>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* ✅ Content based on active view */}
            {activeView === 'overview' && (
                <div className="space-y-6">
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
                    
                    <StatisticsGrid analytics={analytics} />
                    
                    {/* ✅ Quick overview of top content */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {analytics?.topLinks?.length > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {t('analytics.top_performing_links') || 'Top Performing Links'}
                                    </h3>
                                    <button 
                                        onClick={() => setActiveView('links')}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        {t('analytics.view_all') || 'View All'}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {analytics.topLinks.slice(0, 3).map((link, index) => (
                                        <div key={link.linkId} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                                                    {index + 1}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-900 text-sm">{link.title}</p>
                                                    <p className="text-xs text-gray-500 capitalize">{link.type}</p>
                                                </div>
                                            </div>
                                            <span className="text-lg font-bold text-blue-600">
                                                {link.totalClicks}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                        
                        {contactsData?.totalContacts > 0 && (
                            <div className="bg-white rounded-xl shadow-sm border p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {t('analytics.recent_contacts') || 'Recent Contacts'}
                                    </h3>
                                    <button 
                                        onClick={() => setActiveView('contacts')}
                                        className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                                    >
                                        {t('analytics.view_all') || 'View All'}
                                    </button>
                                </div>
                                <div className="space-y-3">
                                    {contactsData.recentContacts.slice(0, 3).map((contact, index) => (
                                        <div key={contact.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                                                <span className="text-green-600 text-sm font-medium">
                                                    {contact.name.charAt(0).toUpperCase()}
                                                </span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="font-medium text-gray-900 text-sm truncate">{contact.name}</p>
                                                <p className="text-xs text-gray-500 truncate">{contact.email}</p>
                                            </div>
                                            {contact.location && (
                                                <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                </svg>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {activeView === 'links' && (
                <div className="space-y-6">
                    <PeriodNavigation 
                        selectedPeriod={selectedPeriod} 
                        setSelectedPeriod={setSelectedPeriod} 
                    />
                    
                    <LinkAnalyticsChart analytics={analytics} isConnected={isConnected} />
                    
                    <TopClickedLinks analytics={analytics} isConnected={isConnected} />
                    
                    {/* ✅ Location data from link clicks (if available) */}
                    {analytics?.locations && analytics.locations.length > 0 && (
                        <ClickMap 
                            analytics={analytics} 
                            contactsData={null}
                            className="mb-6"
                        />
                    )}
                </div>
            )}

            {activeView === 'contacts' && (
                <div className="space-y-6">
                    {/* ✅ Contact Analytics with Maps */}
                    <ContactsAnalytics 
                        userId={userId}
                        isConnected={isConnected}
                        contactsData={contactsData}
                        contactsList={contactsList}
                    />
                    
                    {/* ✅ Contact Locations Map */}
                    {contactsList.length > 0 && (
                        <ClickMap 
                            analytics={null}
                            contactsData={contactsList}
                            className="mb-6"
                        />
                    )}
                </div>
            )}

            {/* Bottom spacing */}
            <div className="h-16"></div>
        </div>
    );
}