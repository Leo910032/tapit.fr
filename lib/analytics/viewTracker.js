// lib/analytics/viewTracker.js
import { fireApp } from "@/important/firebase";
import { collection, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";

/**
 * Records a view for a user's profile
 * @param {string} userId - The user whose profile was viewed
 * @param {string} viewerInfo - Optional info about the viewer (IP, user agent, etc.)
 */
export async function recordProfileView(userId, viewerInfo = {}) {
    try {
        const currentUser = await fetchUserData(userId);
        if (!currentUser) return;

        const analyticsRef = doc(collection(fireApp, "Analytics"), currentUser);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        // Check if analytics document exists
        const analyticsDoc = await getDoc(analyticsRef);
        
        if (!analyticsDoc.exists()) {
            // Create initial analytics document
            await setDoc(analyticsRef, {
                totalViews: 1,
                dailyViews: {
                    [today]: 1
                },
                weeklyViews: {
                    [getWeekKey()]: 1
                },
                monthlyViews: {
                    [getMonthKey()]: 1
                },
                lastUpdated: new Date(),
                createdAt: new Date()
            });
        } else {
            // Update existing analytics
            const updates = {
                totalViews: increment(1),
                [`dailyViews.${today}`]: increment(1),
                [`weeklyViews.${getWeekKey()}`]: increment(1),
                [`monthlyViews.${getMonthKey()}`]: increment(1),
                lastUpdated: new Date()
            };
            
            await updateDoc(analyticsRef, updates);
        }

        // Optional: Record detailed view logs for more granular analytics
        if (viewerInfo.recordDetailed) {
            await recordDetailedView(currentUser, viewerInfo);
        }

    } catch (error) {
        console.error("Error recording profile view:", error);
    }
}

/**
 * Records detailed view information for advanced analytics
 */
async function recordDetailedView(userId, viewerInfo) {
    try {
        const viewLogsRef = collection(fireApp, "ViewLogs");
        const viewId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        
        await setDoc(doc(viewLogsRef, viewId), {
            userId,
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
    } catch (error) {
        console.error("Error recording detailed view:", error);
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
 * Fetches analytics data for a user
 * @param {string} userId - The user ID
 * @returns {Object} Analytics data
 */
export async function getAnalyticsData(userId) {
    try {
        const currentUser = await fetchUserData(userId);
        if (!currentUser) return null;

        const analyticsRef = doc(collection(fireApp, "Analytics"), currentUser);
        const analyticsDoc = await getDoc(analyticsRef);
        
        if (analyticsDoc.exists()) {
            const data = analyticsDoc.data();
            
            // Calculate some derived metrics
            const today = new Date().toISOString().split('T')[0];
            const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
            
            return {
                totalViews: data.totalViews || 0,
                todayViews: data.dailyViews?.[today] || 0,
                yesterdayViews: data.dailyViews?.[yesterday] || 0,
                thisWeekViews: data.weeklyViews?.[getWeekKey()] || 0,
                thisMonthViews: data.monthlyViews?.[getMonthKey()] || 0,
                dailyViews: data.dailyViews || {},
                weeklyViews: data.weeklyViews || {},
                monthlyViews: data.monthlyViews || {},
                lastUpdated: data.lastUpdated
            };
        }
        
        return {
            totalViews: 0,
            todayViews: 0,
            yesterdayViews: 0,
            thisWeekViews: 0,
            thisMonthViews: 0,
            dailyViews: {},
            weeklyViews: {},
            monthlyViews: {}
        };
    } catch (error) {
        console.error("Error fetching analytics data:", error);
        return null;
    }
}
