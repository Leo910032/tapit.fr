// lib/analytics/viewTracker.js
import { fireApp } from "@/important/firebase";
import { collection, doc, updateDoc, increment, setDoc, getDoc, query, where, getDocs } from "firebase/firestore";

/**
 * Records a view for a user's profile using username
 * @param {string} username - The username whose profile was viewed
 * @param {string} viewerInfo - Optional info about the viewer (IP, user agent, etc.)
 */
export async function recordProfileView(username, viewerInfo = {}) {
    try {
        // First, find the user ID from the username by checking the accounts collection
        const accountsRef = collection(fireApp, "accounts");
        const querySnapshot = await getDocs(accountsRef);
        
        let userId = null;
        let actualUsername = null;
        
        console.log("Searching for username:", username);
        console.log("Total documents in accounts collection:", querySnapshot.size);
        
        // Loop through all documents to find the one with matching username
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("Document ID:", doc.id);
            console.log("Available fields:", Object.keys(data));
            console.log("Username field:", data.username);
            console.log("---");
            
            if (data.username === username) {
                userId = doc.id; // This is the actual user ID like "user9560YG"
                actualUsername = data.username;
                console.log("Match found! User ID:", userId, "Username:", actualUsername);
            }
        });

        if (!userId) {
            console.error("User not found for username:", username);
            return;
        }

        console.log("Found user ID:", userId, "for username:", actualUsername);

        const analyticsRef = doc(collection(fireApp, "Analytics"), userId);
        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
        
        console.log("About to check if analytics document exists...");
        
        // Check if analytics document exists
        let analyticsDoc;
        try {
            analyticsDoc = await getDoc(analyticsRef);
            console.log("✅ Successfully read analytics document. Exists:", analyticsDoc.exists());
        } catch (readError) {
            console.error("❌ Failed to read analytics document:", readError);
            throw readError;
        }
        
        if (!analyticsDoc.exists()) {
            console.log("Creating new analytics document...");
            try {
                // Create initial analytics document
                await setDoc(analyticsRef, {
                    username: actualUsername, // Store username for reference
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
                console.log("✅ Created new analytics document for user:", userId);
            } catch (createError) {
                console.error("❌ Failed to create analytics document:", createError);
                throw createError;
            }
        } else {
            console.log("Updating existing analytics document...");
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
            await recordDetailedView(actualUsername, viewerInfo);
        }

    } catch (error) {
        console.error("Error recording profile view:", error);
    }
}

/**
 * Records detailed view information for advanced analytics
 */
async function recordDetailedView(username, viewerInfo) {
    try {
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
 * Gets analytics data using the current authenticated user's ID
 * @param {string} currentUserId - The authenticated user's ID from Firebase Auth (like "user9560YG")
 * @returns {Object} Analytics data
 */
export async function getAnalyticsDataByUserId(currentUserId) {
    try {
        console.log("Fetching analytics for user ID:", currentUserId);
        
        const analyticsRef = doc(collection(fireApp, "Analytics"), currentUserId);
        const analyticsDoc = await getDoc(analyticsRef);
        
        if (analyticsDoc.exists()) {
            const data = analyticsDoc.data();
            console.log("Found analytics data:", data);
            
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
                lastUpdated: data.lastUpdated,
                username: data.username
            };
        } else {
            console.log("No analytics document found for user:", currentUserId);
        }
        
        return {
            totalViews: 0,
            todayViews: 0,
            yesterdayViews: 0,
            thisWeekViews: 0,
            thisMonthViews: 0,
            dailyViews: {},
            weeklyViews: {},
            monthlyViews: {},
            username: null
        };
    } catch (error) {
        console.error("Error fetching analytics data by user ID:", error);
        return null;
    }
}