// lib/analytics/linkClickTracker.js - OPTIMIZED VERSION WITH QUERIES
import { fireApp } from "@/important/firebase";
import { collection, doc, updateDoc, increment, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";

/**
 * Optimized function to find user by username or display name using Firestore queries
 * @param {string} identifier - Username or display name
 * @returns {Object} { userId, username } or null if not found
 */
async function findUserByIdentifier(identifier) {
    try {
        const accountsRef = collection(fireApp, "accounts");
        
        // First, try to find by username (exact match)
        console.log("🔍 Searching by username:", identifier);
        const usernameQuery = query(accountsRef, where("username", "==", identifier));
        let querySnapshot = await getDocs(usernameQuery);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            console.log("✅ Found user by username:", userDoc.id);
            return {
                userId: userDoc.id,
                username: userDoc.data().username
            };
        }
        
        // If not found by username, try by display name
        console.log("🔍 Searching by display name:", identifier);
        const displayNameQuery = query(accountsRef, where("displayName", "==", identifier));
        querySnapshot = await getDocs(displayNameQuery);
        
        if (!querySnapshot.empty) {
            const userDoc = querySnapshot.docs[0];
            console.log("✅ Found user by display name:", userDoc.id);
            return {
                userId: userDoc.id,
                username: userDoc.data().username
            };
        }
        
        // If still not found, try case-insensitive username search (requires full scan)
        console.log("🔍 Fallback: case-insensitive username search");
        const allDocsQuery = query(accountsRef);
        querySnapshot = await getDocs(allDocsQuery);
        
        const lowerIdentifier = identifier.toLowerCase();
        for (const doc of querySnapshot.docs) {
            const data = doc.data();
            if (data.username && data.username.toLowerCase() === lowerIdentifier) {
                console.log("✅ Found user by case-insensitive username:", doc.id);
                return {
                    userId: doc.id,
                    username: data.username
                };
            }
        }
        
        return null;
    } catch (error) {
        console.error("❌ Error finding user:", error);
        return null;
    }
}

/**
 * Records a link click for a user's profile
 * @param {string} identifier - Username, display name, or user ID
 * @param {Object} linkInfo - Information about the clicked link
 * @param {Object} clickerInfo - Optional info about the clicker
 */
export async function recordLinkClick(identifier, linkInfo, clickerInfo = {}) {
    try {
        console.log("🔥 Recording link click for:", identifier, "Link:", linkInfo.linkTitle);

        let userId = null;
        let actualUsername = null;

        // Check if the input is already a user ID (starts with "user")
        if (identifier.startsWith('user')) {
            console.log("🆔 Input is user ID, using directly:", identifier);
            userId = identifier;
            
            // Get the username from the user document
            const userDoc = await getDoc(doc(collection(fireApp, "accounts"), userId));
            if (userDoc.exists()) {
                actualUsername = userDoc.data().username;
                console.log("✅ Found username for user ID:", actualUsername);
            } else {
                console.error("❌ User document not found for ID:", userId);
                return;
            }
        } else {
            // Use optimized search function
            const userInfo = await findUserByIdentifier(identifier);
            if (userInfo) {
                userId = userInfo.userId;
                actualUsername = userInfo.username;
                console.log("✅ Found user:", userId, "with username:", actualUsername);
            } else {
                console.error("❌ User not found for identifier:", identifier);
                return;
            }
        }

        // Record the click
        await recordClickData(userId, actualUsername, linkInfo, clickerInfo);
        
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
 * Most efficient version - use this when you have the user ID
 * @param {string} userId - The user ID (like "user2648OK")
 * @param {Object} linkInfo - Information about the clicked link
 * @param {Object} clickerInfo - Optional info about the clicker
 */
export async function recordLinkClickByUserId(userId, linkInfo, clickerInfo = {}) {
    try {
        console.log("🔥 Recording link click by user ID:", userId, "Link:", linkInfo.linkTitle);

        // Get username for the analytics record
        const userDoc = await getDoc(doc(collection(fireApp, "accounts"), userId));
        if (!userDoc.exists()) {
            console.error("❌ User document not found for ID:", userId);
            return;
        }

        const actualUsername = userDoc.data().username;
        console.log("✅ Found username for user ID:", actualUsername);

        // Record the click
        await recordClickData(userId, actualUsername, linkInfo, clickerInfo);
        
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