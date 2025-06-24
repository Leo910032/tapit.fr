// lib/analytics/linkClickTracker.js - FIXED VERSION
import { fireApp } from "@/important/firebase";
import { collection, doc, updateDoc, increment, setDoc, getDoc, getDocs } from "firebase/firestore";

/**
 * Records a link click for a user's profile using username OR user ID
 * @param {string} usernameOrId - The username OR user ID whose link was clicked
 * @param {Object} linkInfo - Information about the clicked link
 * @param {string} linkInfo.linkId - Unique ID of the link
 * @param {string} linkInfo.linkTitle - Title/text of the link
 * @param {string} linkInfo.linkUrl - URL of the link
 * @param {string} linkInfo.linkType - Type of link (e.g., "social", "custom", "header")
 * @param {Object} clickerInfo - Optional info about the clicker
 */
export async function recordLinkClick(usernameOrId, linkInfo, clickerInfo = {}) {
    try {
        console.log("🔥 Recording link click for:", usernameOrId, "Link:", linkInfo.linkTitle);

        let userId = null;
        let actualUsername = null;

        // Check if the input is already a user ID (starts with "user")
        if (usernameOrId.startsWith('user')) {
            console.log("🆔 Input appears to be a user ID, using directly:", usernameOrId);
            userId = usernameOrId;
            
            // Get the username from the accounts collection for the analytics record
            const accountsRef = collection(fireApp, "accounts");
            const userDoc = await getDoc(doc(accountsRef, userId));
            
            if (userDoc.exists()) {
                actualUsername = userDoc.data().username;
                console.log("✅ Found username for user ID:", actualUsername);
            } else {
                console.error("❌ User document not found for ID:", userId);
                return;
            }
        } else {
            // It's a username, find the user ID
            console.log("👤 Input appears to be a username, searching for user ID...");
            const accountsRef = collection(fireApp, "accounts");
            const querySnapshot = await getDocs(accountsRef);
            
            console.log("🔍 Searching for username:", usernameOrId);
            console.log("📄 Total documents to search:", querySnapshot.size);
            
            // Try exact match first
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log("📋 Checking document:", doc.id, "username:", data.username);
                
                if (data.username === usernameOrId) {
                    userId = doc.id;
                    actualUsername = data.username;
                    console.log("✅ Exact match found! User ID:", userId, "Username:", actualUsername);
                }
            });

            // If no exact match, try case-insensitive match
            if (!userId) {
                console.log("🔍 No exact match, trying case-insensitive search...");
                const lowerSearchUsername = usernameOrId.toLowerCase();
                
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const lowerUsername = String(data.username || '').toLowerCase();
                    
                    if (lowerUsername === lowerSearchUsername) {
                        userId = doc.id;
                        actualUsername = data.username;
                        console.log("✅ Case-insensitive match found! User ID:", userId, "Username:", actualUsername);
                    }
                });
            }

            // If still no match, try searching by display name
            if (!userId) {
                console.log("🔍 No username match, trying display name search...");
                querySnapshot.forEach((doc) => {
                    const data = doc.data();
                    const displayName = data.displayName || '';
                    
                    if (displayName === usernameOrId) {
                        userId = doc.id;
                        actualUsername = data.username;
                        console.log("✅ Display name match found! User ID:", userId, "Username:", actualUsername);
                    }
                });
            }

            if (!userId) {
                console.error("❌ User not found for username/display name:", usernameOrId);
                return;
            }
        }

        console.log("👤 Using user ID:", userId, "with username:", actualUsername);

        const analyticsRef = doc(collection(fireApp, "Analytics"), userId);
        const today = new Date().toISOString().split('T')[0];
        
        console.log("📊 About to update analytics document...");
        
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
            // Create initial analytics document with click data
            await setDoc(analyticsRef, {
                username: actualUsername,
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
            console.log("✅ Created new analytics document with click data for user:", userId);
        } else {
            console.log("🔄 Updating existing analytics with click data...");
            // Update existing analytics with click data
            await updateDoc(analyticsRef, clickData);
            console.log("✅ Updated analytics with click data for user:", userId);
        }

        // Optional: Record detailed click logs
        if (clickerInfo.recordDetailed) {
            await recordDetailedClick(actualUsername, linkInfo, clickerInfo);
        }

        console.log("🎉 Successfully recorded link click!");

    } catch (error) {
        console.error("❌ Error recording link click:", error);
        console.error("🔍 Error details:", {
            message: error.message,
            stack: error.stack,
            usernameOrId,
            linkInfo
        });
    }
}

/**
 * Enhanced version that accepts user ID directly (RECOMMENDED)
 * @param {string} userId - The user ID (like "user2648OK")
 * @param {Object} linkInfo - Information about the clicked link
 * @param {Object} clickerInfo - Optional info about the clicker
 */
export async function recordLinkClickByUserId(userId, linkInfo, clickerInfo = {}) {
    try {
        console.log("🔥 Recording link click by user ID:", userId, "Link:", linkInfo.linkTitle);

        // Get username for the analytics record
        const accountsRef = collection(fireApp, "accounts");
        const userDoc = await getDoc(doc(accountsRef, userId));
        
        if (!userDoc.exists()) {
            console.error("❌ User document not found for ID:", userId);
            return;
        }

        const actualUsername = userDoc.data().username;
        console.log("✅ Found username for user ID:", actualUsername);

        const analyticsRef = doc(collection(fireApp, "Analytics"), userId);
        const today = new Date().toISOString().split('T')[0];
        
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
                username: actualUsername,
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
            console.log("✅ Created new analytics document with click data for user:", userId);
        } else {
            console.log("🔄 Updating existing analytics with click data...");
            await updateDoc(analyticsRef, clickData);
            console.log("✅ Updated analytics with click data for user:", userId);
        }

        console.log("🎉 Successfully recorded link click!");

    } catch (error) {
        console.error("❌ Error recording link click by user ID:", error);
        throw error;
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