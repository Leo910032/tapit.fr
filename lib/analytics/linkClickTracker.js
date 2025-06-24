// lib/analytics/linkClickTracker.js - FINAL OPTIMIZED VERSION
import { fireApp } from "@/important/firebase";
import { collection, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";
import { fastUserLookup } from "@/lib/userLookup";

/**
 * SUPER FAST link click tracking using lookup table
 * @param {string} identifier - User ID, username, or display name
 * @param {Object} linkInfo - Information about the clicked link
 * @param {Object} clickerInfo - Optional info about the clicker
 */
export async function recordLinkClick(identifier, linkInfo, clickerInfo = {}) {
    try {
        console.log("🔥 Recording link click for:", identifier, "Link:", linkInfo.linkTitle);

        // Super fast lookup - single document read
        const userInfo = await fastUserLookup(identifier);
        
        if (!userInfo) {
            console.error("❌ User not found in lookup table:", identifier);
            return;
        }
        
        console.log("✅ Found user via lookup:", userInfo.userId, userInfo.username);
        
        // Record the click using the found user ID
        await recordClickData(userInfo.userId, userInfo.username, linkInfo, clickerInfo);
        
        console.log("🎉 Successfully recorded link click!");

    } catch (error) {
        console.error("❌ Error recording link click:", error);
        console.error("🔍 Error details:", {
            message: error.message,
            identifier,
            linkInfo
        });
    }
}

/**
 * Most efficient version - use this when you have the user ID directly
 * @param {string} userId - The user ID (like "user2648OK")
 * @param {Object} linkInfo - Information about the clicked link
 * @param {Object} clickerInfo - Optional info about the clicker
 */
export async function recordLinkClickByUserId(userId, linkInfo, clickerInfo = {}) {
    try {
        console.log("🔥 Recording link click by user ID:", userId, "Link:", linkInfo.linkTitle);

        // Get user info from lookup table (still faster than accounts collection)
        const userInfo = await fastUserLookup(userId);
        
        if (!userInfo) {
            console.error("❌ User not found in lookup table for ID:", userId);
            return;
        }

        console.log("✅ Found user via lookup:", userInfo.username);

        // Record the click
        await recordClickData(userId, userInfo.username, linkInfo, clickerInfo);
        
        console.log("🎉 Successfully recorded link click!");

    } catch (error) {
        console.error("❌ Error recording link click by user ID:", error);
        throw error;
    }
}

/**
 * Internal function to record click data to Firestore
 */
async function recordClickData(userId, username, linkInfo, clickerInfo) {
    const analyticsRef = doc(collection(fireApp, "Analytics"), userId);
    const today = new Date().toISOString().split('T')[0];
    
    console.log("📊 Recording click data for user:", userId);
    
    // Check if analytics document exists
    const analyticsDoc = await getDoc(analyticsRef);
    console.log("📈 Analytics document exists:", analyticsDoc.exists());
    
    // Prepare click data
    const clickData = {
        totalClicks: increment(1),
        [`dailyClicks.${today}`]: increment(1),
        [`weeklyClicks.${getWeekKey()}`]: increment(1),
        [`monthlyClicks.${getMonthKey()}`]: increment(1),
        [`linkClicks.${linkInfo.linkId}.totalClicks`]: increment(1),
        [`linkClicks.${linkInfo.linkId}.title`]: linkInfo.linkTitle,
        [`linkClicks.${linkInfo.linkId}.url`]: linkInfo.linkUrl,
        [`linkClicks.${linkInfo.linkId}.type`]: linkInfo.linkType,
        [`linkClicks.${linkInfo.linkId}.lastClicked`]: new Date(),
        lastUpdated: new Date()
    };

    if (!analyticsDoc.exists()) {
        console.log("🆕 Creating new analytics document with click data...");
        await setDoc(analyticsRef, {
            username: username,
            totalViews: 0,
            totalClicks: 1,
            dailyViews: {},
            dailyClicks: {
                [today]: 1
            },
            weeklyViews: {},
            weeklyClicks: {
                [getWeekKey()]: 1
            },
            monthlyViews: {},
            monthlyClicks: {
                [getMonthKey()]: 1
            },
            linkClicks: {
                [linkInfo.linkId]: {
                    totalClicks: 1,
                    title: linkInfo.linkTitle,
                    url: linkInfo.linkUrl,
                    type: linkInfo.linkType,
                    lastClicked: new Date()
                }
            },
            lastUpdated: new Date(),
            createdAt: new Date()
        });
        console.log("✅ Created new analytics document");
    } else {
        console.log("🔄 Updating existing analytics with click data...");
        await updateDoc(analyticsRef, clickData);
        console.log("✅ Updated analytics document");
    }

    // Optional: Record detailed click logs
    if (clickerInfo.recordDetailed) {
        await recordDetailedClick(username, linkInfo, clickerInfo);
    }
}

/**
 * Records detailed click information for advanced analytics
 */
async function recordDetailedClick(username, linkInfo, clickerInfo) {
    try {
        console.log("📝 Recording detailed click log...");
        const clickLogsRef = collection(fireApp, "ClickLogs");
        const clickId = `${username}_${linkInfo.linkId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await setDoc(doc(clickLogsRef, clickId), {
            userId: username,
            linkId: linkInfo.linkId,
            linkTitle: linkInfo.linkTitle,
            linkUrl: linkInfo.linkUrl,
            linkType: linkInfo.linkType,
            timestamp: new Date(),
            date: new Date().toISOString().split('T')[0],
            clickerInfo: {
                userAgent: clickerInfo.userAgent || '',
                referrer: clickerInfo.referrer || '',
                country: clickerInfo.country || '',
                city: clickerInfo.city || ''
            }
        });
        console.log("✅ Recorded detailed click log");
    } catch (error) {
        console.error("❌ Error recording detailed click:", error);
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
 * Gets analytics data including click metrics by user ID
 * @param {string} currentUserId - The authenticated user's ID
 * @returns {Object} Analytics data including clicks
 */
export async function getAnalyticsWithClicks(currentUserId) {
    try {
        console.log("📊 Fetching analytics with clicks for user ID:", currentUserId);
        
        const analyticsRef = doc(collection(fireApp, "Analytics"), currentUserId);
        const analyticsDoc = await getDoc(analyticsRef);
        
        if (analyticsDoc.exists()) {
            const data = analyticsDoc.data();
            
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
        console.error("❌ Error fetching analytics with clicks:", error);
        return null;
    }
}