// lib/analytics/viewTracker.js - ENHANCED WITH TEAM ANALYTICS TRIGGERS
import { fireApp } from "@/important/firebase";
import { collection, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";
import { fastUserLookup } from "@/lib/userLookup";

/**
 * SUPER FAST profile view tracking using lookup table + TEAM ANALYTICS UPDATE
 * @param {string} identifier - Username, display name, or user ID
 * @param {Object} viewerInfo - Optional info about the viewer (IP, user agent, etc.)
 */
export async function recordProfileView(identifier, viewerInfo = {}) {
    try {
        console.log("👁️ Recording profile view for:", identifier);

        // Super fast lookup - single document read
        const userInfo = await fastUserLookup(identifier);
        
        if (!userInfo) {
            console.error("❌ User not found in lookup table:", identifier);
            return;
        }
        
        console.log("✅ Found user via lookup:", userInfo.userId, userInfo.username);
        
        // Record the view using the found user ID
        await recordViewData(userInfo.userId, userInfo.username, viewerInfo);
        
        // ✅ NEW: Check if user is in a team and trigger team analytics update
        await updateTeamAnalyticsIfNeeded(userInfo.userId);
        
        console.log("🎉 Successfully recorded profile view!");

    } catch (error) {
        console.error("❌ Error recording profile view:", error);
        console.error("🔍 Error details:", {
            message: error.message,
            identifier,
            viewerInfo
        });
    }
}

/**
 * Most efficient version - use this when you have the user ID directly
 * @param {string} userId - The user ID (like "user2648OK")
 * @param {Object} viewerInfo - Optional info about the viewer
 */
export async function recordProfileViewByUserId(userId, viewerInfo = {}) {
    try {
        console.log("👁️ Recording profile view by user ID:", userId);

        // Get user info from lookup table (still faster than accounts collection)
        const userInfo = await fastUserLookup(userId);
        
        if (!userInfo) {
            console.error("❌ User not found in lookup table for ID:", userId);
            return;
        }

        console.log("✅ Found user via lookup:", userInfo.username);

        // Record the view
        await recordViewData(userId, userInfo.username, viewerInfo);
        
        // ✅ NEW: Check if user is in a team and trigger team analytics update
        await updateTeamAnalyticsIfNeeded(userId);
        
        console.log("🎉 Successfully recorded profile view!");

    } catch (error) {
        console.error("❌ Error recording profile view by user ID:", error);
        throw error;
    }
}

/**
 * ✅ NEW: Check if user is in a team and update team analytics
 * @param {string} userId - The user ID
 */
async function updateTeamAnalyticsIfNeeded(userId) {
    try {
        // Check if user is in a team
        const userRef = doc(fireApp, "AccountData", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().teamId) {
            const teamId = userSnap.data().teamId;
            console.log("🏢 User is in team, triggering team analytics update:", teamId);
            
            // Dynamically import to avoid circular dependencies
            const { aggregateTeamAnalytics } = await import('../teamManagement');
            await aggregateTeamAnalytics(teamId);
            
            console.log("✅ Team analytics updated successfully");
        }
    } catch (error) {
        console.error("❌ Failed to update team analytics:", error);
        // Don't throw - team analytics update shouldn't break view tracking
    }
}

/**
 * Internal function to record view data to Firestore
 */
async function recordViewData(userId, username, viewerInfo) {
    const analyticsRef = doc(collection(fireApp, "Analytics"), userId);
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    
    console.log("📊 Recording view data for user:", userId);
    
    // Check if analytics document exists
    let analyticsDoc;
    try {
        analyticsDoc = await getDoc(analyticsRef);
        console.log("📈 Analytics document exists:", analyticsDoc.exists());
    } catch (readError) {
        console.error("❌ Failed to read analytics document:", readError);
        throw readError;
    }
    
    if (!analyticsDoc.exists()) {
        console.log("🆕 Creating new analytics document...");
        try {
            // Create initial analytics document
            await setDoc(analyticsRef, {
                username: username, // Store username for reference
                totalViews: 1,
                totalClicks: 0, // Initialize clicks counter
                dailyViews: {
                    [today]: 1
                },
                dailyClicks: {}, // Initialize clicks data
                weeklyViews: {
                    [getWeekKey()]: 1
                },
                weeklyClicks: {}, // Initialize clicks data
                monthlyViews: {
                    [getMonthKey()]: 1
                },
                monthlyClicks: {}, // Initialize clicks data
                linkClicks: {}, // Initialize link clicks data
                lastUpdated: new Date(),
                createdAt: new Date()
            });
            console.log("✅ Created new analytics document for user:", userId);
        } catch (createError) {
            console.error("❌ Failed to create analytics document:", createError);
            throw createError;
        }
    } else {
        console.log("🔄 Updating existing analytics document...");
        try {
            // Update existing analytics
            const updates = {
                totalViews: increment(1),
                [`dailyViews.${today}`]: increment(1),
                [`weeklyViews.${getWeekKey()}`]: increment(1),
                [`monthlyViews.${getMonthKey()}`]: increment(1),
                lastUpdated: new Date()
            };
            
            await updateDoc(analyticsRef, updates);
            console.log("✅ Updated analytics for user:", userId);
        } catch (updateError) {
            console.error("❌ Failed to update analytics document:", updateError);
            throw updateError;
        }
    }

    // Optional: Record detailed view logs for more granular analytics
    if (viewerInfo.recordDetailed) {
        await recordDetailedView(username, viewerInfo);
    }
}

/**
 * Records detailed view information for advanced analytics
 */
async function recordDetailedView(username, viewerInfo) {
    try {
        console.log("📝 Recording detailed view log...");
        const viewLogsRef = collection(fireApp, "ViewLogs");
        const viewId = `${username}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await setDoc(doc(viewLogsRef, viewId), {
            userId: username, // Store username for easier querying
            timestamp: new Date(),
            date: new Date().toISOString().split('T')[0],
            viewerInfo: {
                userAgent: viewerInfo.userAgent || '',
                referrer: viewerInfo.referrer || '',
                location: viewerInfo.location || '',
                // Don't store IP for privacy - just city/country if needed
                country: viewerInfo.country || '',
                city: viewerInfo.city || ''
            }
        });
        console.log("✅ Recorded detailed view log");
    } catch (error) {
        console.error("❌ Error recording detailed view:", error);
    }
}

/**
 * Gets the current week key (year-week format)
 */
function getWeekKey() {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

/**
 * Gets the current month key (year-month format)
 */
function getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}

/**
 * Gets comprehensive analytics data including both views and clicks by user ID
 * @param {string} currentUserId - The authenticated user's ID (like "user9560YG")
 * @returns {Object} Complete analytics data including views and clicks
 */
export async function getAnalyticsDataByUserId(currentUserId) {
    try {
        console.log("📊 Fetching comprehensive analytics for user ID:", currentUserId);
        
        const analyticsRef = doc(collection(fireApp, "Analytics"), currentUserId);
        const analyticsDoc = await getDoc(analyticsRef);
        
        if (analyticsDoc.exists()) {
            const data = analyticsDoc.data();
            console.log("✅ Found analytics data:", data);
            
            // Calculate derived metrics
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            // Get top clicked links
            const linkClicks = data.linkClicks || {};
            const topLinks = Object.entries(linkClicks)
                .map(([linkId, linkData]) => ({
                    linkId,
                    ...linkData
                }))
                .sort((a, b) => (b.totalClicks || 0) - (a.totalClicks || 0))
                .slice(0, 10); // Top 10 clicked links
            
            return {
                // Views data
                totalViews: data.totalViews || 0,
                todayViews: data.dailyViews?.[today] || 0,
                yesterdayViews: data.dailyViews?.[yesterday] || 0,
                thisWeekViews: data.weeklyViews?.[getWeekKey()] || 0,
                thisMonthViews: data.monthlyViews?.[getMonthKey()] || 0,
                
                // Clicks data
                totalClicks: data.totalClicks || 0,
                todayClicks: data.dailyClicks?.[today] || 0,
                yesterdayClicks: data.dailyClicks?.[yesterday] || 0,
                thisWeekClicks: data.weeklyClicks?.[getWeekKey()] || 0,
                thisMonthClicks: data.monthlyClicks?.[getMonthKey()] || 0,
                
                // Detailed data
                dailyViews: data.dailyViews || {},
                dailyClicks: data.dailyClicks || {},
                weeklyViews: data.weeklyViews || {},
                weeklyClicks: data.weeklyClicks || {},
                monthlyViews: data.monthlyViews || {},
                monthlyClicks: data.monthlyClicks || {},
                linkClicks: data.linkClicks || {},
                topLinks,
                
                // Meta
                lastUpdated: data.lastUpdated,
                username: data.username
            };
        } else {
            console.log("❌ No analytics document found for user:", currentUserId);
        }
        
        return {
            totalViews: 0,
            todayViews: 0,
            yesterdayViews: 0,
            thisWeekViews: 0,
            thisMonthViews: 0,
            totalClicks: 0,
            todayClicks: 0,
            yesterdayClicks: 0,
            thisWeekClicks: 0,
            thisMonthClicks: 0,
            dailyViews: {},
            dailyClicks: {},
            weeklyViews: {},
            weeklyClicks: {},
            monthlyViews: {},
            monthlyClicks: {},
            linkClicks: {},
            topLinks: [],
            username: null
        };
    } catch (error) {
        console.error("❌ Error fetching analytics data by user ID:", error);
        return null;
    }
}

/**
 * BACKWARD COMPATIBILITY: Alias for the old function name
 * @deprecated Use getAnalyticsDataByUserId instead
 */
export const getAnalyticsWithClicks = getAnalyticsDataByUserId;

/**
 * Gets analytics data for multiple users (batch operation)
 * Useful for admin dashboards or bulk operations
 * @param {string[]} userIds - Array of user IDs
 * @returns {Object} Map of userId -> analytics data
 */
export async function getBulkAnalyticsData(userIds) {
    try {
        console.log("📊 Fetching bulk analytics for", userIds.length, "users");
        
        const results = {};
        const promises = userIds.map(async (userId) => {
            try {
                const data = await getAnalyticsDataByUserId(userId);
                results[userId] = data;
            } catch (error) {
                console.error(`❌ Failed to fetch analytics for user ${userId}:`, error);
                results[userId] = null;
            }
        });
        
        await Promise.all(promises);
        
        console.log("✅ Bulk analytics fetch completed");
        return results;
        
    } catch (error) {
        console.error("❌ Error in bulk analytics fetch:", error);
        return {};
    }
}

/**
 * Gets aggregated analytics across all users (admin function)
 * @returns {Object} Aggregated analytics data
 */
export async function getGlobalAnalytics() {
    try {
        console.log("🌍 Fetching global analytics...");
        
        const analyticsRef = collection(fireApp, "Analytics");
        const querySnapshot = await getDocs(analyticsRef);
        
        let totalViews = 0;
        let totalClicks = 0;
        let totalUsers = 0;
        const dailyViews = {};
        const dailyClicks = {};
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            totalUsers++;
            totalViews += data.totalViews || 0;
            totalClicks += data.totalClicks || 0;
            
            // Aggregate daily data
            Object.entries(data.dailyViews || {}).forEach(([date, views]) => {
                dailyViews[date] = (dailyViews[date] || 0) + views;
            });
            
            Object.entries(data.dailyClicks || {}).forEach(([date, clicks]) => {
                dailyClicks[date] = (dailyClicks[date] || 0) + clicks;
            });
        });
        
        console.log("✅ Global analytics calculated");
        
        return {
            totalUsers,
            totalViews,
            totalClicks,
            averageViewsPerUser: totalUsers > 0 ? Math.round(totalViews / totalUsers) : 0,
            averageClicksPerUser: totalUsers > 0 ? Math.round(totalClicks / totalUsers) : 0,
            dailyViews,
            dailyClicks,
            generatedAt: new Date()
        };
        
    } catch (error) {
        console.error("❌ Error fetching global analytics:", error);
        return null;
    }
}