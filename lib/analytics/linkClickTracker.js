// lib/analytics/linkClickTracker.js - FIXED LINKID NORMALIZATION
import { fireApp } from "@/important/firebase";
import { collection, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";
import { fastUserLookup } from "@/lib/userLookup";

/**
 * ✅ NEW: Normalize linkId to ensure consistency
 */
function normalizeLinkId(linkId, title = '') {
    if (!linkId) return generateLinkId({ linkTitle: title });
    
    // Clean up file download IDs
    if (linkId.startsWith('file_download_')) {
        // Remove file extension and extra spaces for consistency
        let cleanId = linkId
            .replace(/\.(docx|pdf|txt|jpg|png|gif|mp4|mp3|zip|rar)$/i, '') // Remove common extensions
            .replace(/\s+/g, ' ') // Normalize spaces
            .trim(); // Remove trailing spaces
        
        console.log('🔧 Normalized file linkId:', linkId, '->', cleanId);
        return cleanId;
    }
    
    return linkId;
}

/**
 * ✅ IMPROVED: Process and normalize link information with better linkId handling
 */
function processLinkInfo(linkInfo) {
    let processedInfo = { ...linkInfo };
    
    // ✅ CRITICAL: Normalize the linkId first
    processedInfo.linkId = normalizeLinkId(linkInfo.linkId, linkInfo.linkTitle);
    
    // Handle file download links
    if (processedInfo.linkId && processedInfo.linkId.startsWith('file_download_')) {
        processedInfo.linkType = 'file_download';
        processedInfo.displayType = 'File';
        
        // Clean up the title for file downloads
        if (linkInfo.linkTitle && linkInfo.linkTitle.startsWith('Download ')) {
            processedInfo.cleanTitle = linkInfo.linkTitle.replace('Download ', '').trim();
        } else {
            processedInfo.cleanTitle = linkInfo.linkTitle;
        }
        
        // Extract filename from linkId for better title
        if (!processedInfo.cleanTitle || processedInfo.cleanTitle === 'Untitled Link') {
            const filename = processedInfo.linkId.replace('file_download_', '').trim();
            if (filename) {
                processedInfo.cleanTitle = filename;
                processedInfo.linkTitle = filename;
            }
        }
    } else {
        // Regular links
        processedInfo.linkType = linkInfo.linkType || 'custom';
        processedInfo.displayType = linkInfo.linkType || 'Custom';
        processedInfo.cleanTitle = linkInfo.linkTitle;
    }
    
    // Ensure we have all required fields
    processedInfo.linkTitle = processedInfo.linkTitle || processedInfo.cleanTitle || 'Untitled Link';
    processedInfo.linkUrl = linkInfo.linkUrl || '';
    
    console.log("📝 Processed link info:", {
        original: linkInfo,
        processed: processedInfo
    });
    
    return processedInfo;
}

/**
 * SUPER FAST link click tracking with improved linkId handling
 */
export async function recordLinkClick(identifier, linkInfo, clickerInfo = {}) {
    try {
        console.log("🔥 Recording link click for:", identifier, "Link:", linkInfo.linkTitle);
        console.log("🔍 Original linkInfo:", linkInfo);

        // Super fast lookup - single document read
        const userInfo = await fastUserLookup(identifier);
        
        if (!userInfo) {
            console.error("❌ User not found in lookup table:", identifier);
            return;
        }
        
        console.log("✅ Found user via lookup:", userInfo.userId, userInfo.username);
        
        // ✅ IMPROVED: Better linkId processing with normalization
        const processedLinkInfo = processLinkInfo(linkInfo);
        console.log("🔗 Processed link info:", processedLinkInfo);
        
        // Record the click using the found user ID
        await recordClickData(userInfo.userId, userInfo.username, processedLinkInfo, clickerInfo);
        
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
 * Generate a linkId if one doesn't exist
 */
function generateLinkId(linkInfo) {
    if (linkInfo.linkTitle) {
        // Create a simple ID from title
        return linkInfo.linkTitle
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 30);
    }
    return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Most efficient version - use this when you have the user ID directly
 */
export async function recordLinkClickByUserId(userId, linkInfo, clickerInfo = {}) {
    try {
        console.log("🔥 Recording link click by user ID:", userId, "Link:", linkInfo.linkTitle);

        // Get user info from lookup table
        const userInfo = await fastUserLookup(userId);
        
        if (!userInfo) {
            console.error("❌ User not found in lookup table for ID:", userId);
            return;
        }

        console.log("✅ Found user via lookup:", userInfo.username);

        // ✅ IMPROVED: Better linkId processing with normalization
        const processedLinkInfo = processLinkInfo(linkInfo);

        // Record the click
        await recordClickData(userId, userInfo.username, processedLinkInfo, clickerInfo);
        
        console.log("🎉 Successfully recorded link click!");

    } catch (error) {
        console.error("❌ Error recording link click by user ID:", error);
        throw error;
    }
}

/**
 * ✅ IMPROVED: Internal function to record click data with better structure
 */
async function recordClickData(userId, username, linkInfo, clickerInfo) {
    const analyticsRef = doc(collection(fireApp, "Analytics"), userId);
    const today = new Date().toISOString().split('T')[0];
    
    console.log("📊 Recording click data for user:", userId, "Link:", linkInfo.linkId);
    
    // Check if analytics document exists
    const analyticsDoc = await getDoc(analyticsRef);
    console.log("📈 Analytics document exists:", analyticsDoc.exists());
    
    // ✅ IMPROVED: Better data structure for link tracking
    const linkClickData = {
        title: linkInfo.linkTitle,
        cleanTitle: linkInfo.cleanTitle || linkInfo.linkTitle,
        url: linkInfo.linkUrl,
        type: linkInfo.linkType,
        displayType: linkInfo.displayType || linkInfo.linkType,
        lastClicked: new Date(),
        totalClicks: increment(1),
        // Add daily/weekly/monthly tracking for individual links
        [`dailyClicks.${today}`]: increment(1),
        [`weeklyClicks.${getWeekKey()}`]: increment(1),
        [`monthlyClicks.${getMonthKey()}`]: increment(1)
    };
    
    // Prepare main analytics update
    const clickData = {
        totalClicks: increment(1),
        [`dailyClicks.${today}`]: increment(1),
        [`weeklyClicks.${getWeekKey()}`]: increment(1),
        [`monthlyClicks.${getMonthKey()}`]: increment(1),
        lastUpdated: new Date()
    };
    
    // Add the link-specific data
    Object.keys(linkClickData).forEach(key => {
        clickData[`linkClicks.${linkInfo.linkId}.${key}`] = linkClickData[key];
    });

    if (!analyticsDoc.exists()) {
        console.log("🆕 Creating new analytics document with click data...");
        await setDoc(analyticsRef, {
            username: username,
            totalViews: 0,
            totalClicks: 1,
            dailyViews: {},
            dailyClicks: { [today]: 1 },
            weeklyViews: {},
            weeklyClicks: { [getWeekKey()]: 1 },
            monthlyViews: {},
            monthlyClicks: { [getMonthKey()]: 1 },
            linkClicks: {
                [linkInfo.linkId]: {
                    title: linkInfo.linkTitle,
                    cleanTitle: linkInfo.cleanTitle || linkInfo.linkTitle,
                    url: linkInfo.linkUrl,
                    type: linkInfo.linkType,
                    displayType: linkInfo.displayType || linkInfo.linkType,
                    totalClicks: 1,
                    lastClicked: new Date(),
                    dailyClicks: { [today]: 1 },
                    weeklyClicks: { [getWeekKey()]: 1 },
                    monthlyClicks: { [getMonthKey()]: 1 }
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