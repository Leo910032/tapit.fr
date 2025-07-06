// lib/analytics/linkClickTracker.js - ENHANCED WITH TRAFFIC SOURCE TRACKING
import { fireApp } from "@/important/firebase";
import { collection, doc, updateDoc, increment, setDoc, getDoc } from "firebase/firestore";
import { fastUserLookup } from "@/lib/userLookup";

/**
 * ✅ NEW: Session storage for traffic source (using in-memory storage for Claude.ai)
 */
let sessionTrafficData = null;

/**
 * ✅ NEW: Detect traffic source from referrer
 */
function detectTrafficSource(referrer, utmParams = {}) {
    // Check UTM parameters first (most reliable)
    if (utmParams.utm_source) {
        return {
            source: utmParams.utm_source.toLowerCase(),
            medium: utmParams.utm_medium || 'unknown',
            campaign: utmParams.utm_campaign || 'unknown',
            content: utmParams.utm_content || 'unknown',
            term: utmParams.utm_term || 'unknown',
            type: 'utm'
        };
    }

    // If no referrer, it's direct traffic
    if (!referrer) {
        return {
            source: 'direct',
            medium: 'direct',
            campaign: 'direct',
            type: 'direct'
        };
    }

    try {
        const url = new URL(referrer);
        const domain = url.hostname.toLowerCase();

        // Social media detection
        if (domain.includes('instagram.com') || domain.includes('ig.me')) {
            return {
                source: 'instagram',
                medium: 'social',
                campaign: 'bio_link',
                type: 'social'
            };
        } else if (domain.includes('tiktok.com')) {
            return {
                source: 'tiktok',
                medium: 'social',
                campaign: 'bio_link',
                type: 'social'
            };
        } else if (domain.includes('twitter.com') || domain.includes('x.com')) {
            return {
                source: 'twitter',
                medium: 'social',
                campaign: 'bio_link',
                type: 'social'
            };
        } else if (domain.includes('facebook.com') || domain.includes('fb.com')) {
            return {
                source: 'facebook',
                medium: 'social',
                campaign: 'bio_link',
                type: 'social'
            };
        } else if (domain.includes('linkedin.com')) {
            return {
                source: 'linkedin',
                medium: 'social',
                campaign: 'bio_link',
                type: 'social'
            };
        } else if (domain.includes('youtube.com') || domain.includes('youtu.be')) {
            return {
                source: 'youtube',
                medium: 'social',
                campaign: 'video_description',
                type: 'social'
            };
        } else if (domain.includes('snapchat.com')) {
            return {
                source: 'snapchat',
                medium: 'social',
                campaign: 'bio_link',
                type: 'social'
            };
        } else if (domain.includes('pinterest.com')) {
            return {
                source: 'pinterest',
                medium: 'social',
                campaign: 'pin',
                type: 'social'
            };
        } else if (domain.includes('reddit.com')) {
            return {
                source: 'reddit',
                medium: 'social',
                campaign: 'post',
                type: 'social'
            };
        } 
        // Search engines
        else if (domain.includes('google.')) {
            return {
                source: 'google',
                medium: 'search',
                campaign: 'organic',
                type: 'search'
            };
        } else if (domain.includes('bing.com')) {
            return {
                source: 'bing',
                medium: 'search',
                campaign: 'organic',
                type: 'search'
            };
        } else if (domain.includes('yahoo.com')) {
            return {
                source: 'yahoo',
                medium: 'search',
                campaign: 'organic',
                type: 'search'
            };
        }
        // Other referrals
        else {
            return {
                source: domain,
                medium: 'referral',
                campaign: 'referral',
                type: 'referral'
            };
        }
    } catch (error) {
        console.error('Error parsing referrer:', error);
        return {
            source: 'unknown',
            medium: 'unknown',
            campaign: 'unknown',
            type: 'unknown'
        };
    }
}

/**
 * ✅ NEW: Get UTM parameters from URL
 */
function getUTMParameters() {
    if (typeof window === 'undefined') return {};
    
    try {
        const params = new URLSearchParams(window.location.search);
        return {
            utm_source: params.get('utm_source'),
            utm_medium: params.get('utm_medium'),
            utm_campaign: params.get('utm_campaign'),
            utm_content: params.get('utm_content'),
            utm_term: params.get('utm_term')
        };
    } catch (error) {
        console.error('Error getting UTM parameters:', error);
        return {};
    }
}

/**
 * ✅ NEW: Initialize session traffic data on page load
 */
export function initializeSessionTracking() {
    if (typeof window === 'undefined') return;
    
    // Only set if not already set (to preserve original source)
    if (!sessionTrafficData) {
        const utmParams = getUTMParameters();
        const referrer = document.referrer;
        const trafficSource = detectTrafficSource(referrer, utmParams);
        
        sessionTrafficData = {
            ...trafficSource,
            landingPage: window.location.href,
            landingTime: new Date().toISOString(),
            userAgent: navigator.userAgent,
            referrer: referrer
        };
        
        console.log('🎯 Session traffic source initialized:', sessionTrafficData);
    }
    
    return sessionTrafficData;
}

/**
 * ✅ NEW: Get current session traffic data
 */
export function getSessionTrafficData() {
    return sessionTrafficData || initializeSessionTracking();
}

/**
 * ✅ ENHANCED: Normalize linkId to ensure consistency
 */
function normalizeLinkId(linkId, title = '') {
    if (!linkId) return generateLinkId({ linkTitle: title });
    
    // Clean up file download IDs
    if (linkId.startsWith('file_download_')) {
        let cleanId = linkId
            .replace(/\.(docx|pdf|txt|jpg|png|gif|mp4|mp3|zip|rar)$/i, '')
            .replace(/\s+/g, ' ')
            .trim();
        
        console.log('🔧 Normalized file linkId:', linkId, '->', cleanId);
        return cleanId;
    }
    
    return linkId;
}

/**
 * ✅ ENHANCED: Process and normalize link information with traffic source
 */
function processLinkInfo(linkInfo) {
    let processedInfo = { ...linkInfo };
    
    processedInfo.linkId = normalizeLinkId(linkInfo.linkId, linkInfo.linkTitle);
    
    // Handle file download links
    if (processedInfo.linkId && processedInfo.linkId.startsWith('file_download_')) {
        processedInfo.linkType = 'file_download';
        processedInfo.displayType = 'File';
        
        if (linkInfo.linkTitle && linkInfo.linkTitle.startsWith('Download ')) {
            processedInfo.cleanTitle = linkInfo.linkTitle.replace('Download ', '').trim();
        } else {
            processedInfo.cleanTitle = linkInfo.linkTitle;
        }
        
        if (!processedInfo.cleanTitle || processedInfo.cleanTitle === 'Untitled Link') {
            const filename = processedInfo.linkId.replace('file_download_', '').trim();
            if (filename) {
                processedInfo.cleanTitle = filename;
                processedInfo.linkTitle = filename;
            }
        }
    } else {
        processedInfo.linkType = linkInfo.linkType || 'custom';
        processedInfo.displayType = linkInfo.linkType || 'Custom';
        processedInfo.cleanTitle = linkInfo.linkTitle;
    }
    
    processedInfo.linkTitle = processedInfo.linkTitle || processedInfo.cleanTitle || 'Untitled Link';
    processedInfo.linkUrl = linkInfo.linkUrl || '';
    
    console.log("📝 Processed link info:", {
        original: linkInfo,
        processed: processedInfo
    });
    
    return processedInfo;
}

/**
 * ✅ ENHANCED: Link click tracking with traffic source data
 */
export async function recordLinkClick(identifier, linkInfo, clickerInfo = {}) {
    try {
        console.log("🔥 Recording link click for:", identifier, "Link:", linkInfo.linkTitle);

        const userInfo = await fastUserLookup(identifier);
        
        if (!userInfo) {
            console.error("❌ User not found in lookup table:", identifier);
            return;
        }
        
        console.log("✅ Found user via lookup:", userInfo.userId, userInfo.username);
        
        const processedLinkInfo = processLinkInfo(linkInfo);
        
        // ✅ NEW: Get session traffic data
        const trafficData = getSessionTrafficData();
        
        // Record the click with traffic source
        await recordClickData(userInfo.userId, userInfo.username, processedLinkInfo, {
            ...clickerInfo,
            trafficSource: trafficData
        });
        
        await updateTeamAnalyticsIfNeeded(userInfo.userId);
        
        console.log("🎉 Successfully recorded link click with traffic source!", trafficData);

    } catch (error) {
        console.error("❌ Error recording link click:", error);
    }
}

/**
 * ✅ ENHANCED: Record click data with traffic source information
 */
async function recordClickData(userId, username, linkInfo, clickerInfo) {
    const analyticsRef = doc(collection(fireApp, "Analytics"), userId);
    const today = new Date().toISOString().split('T')[0];
    
    console.log("📊 Recording click data with traffic source for user:", userId);
    
    const analyticsDoc = await getDoc(analyticsRef);
    
    // ✅ NEW: Enhanced data structure with traffic source tracking
    const linkClickData = {
        title: linkInfo.linkTitle,
        cleanTitle: linkInfo.cleanTitle || linkInfo.linkTitle,
        url: linkInfo.linkUrl,
        type: linkInfo.linkType,
        displayType: linkInfo.displayType || linkInfo.linkType,
        lastClicked: new Date(),
        totalClicks: increment(1),
        [`dailyClicks.${today}`]: increment(1),
        [`weeklyClicks.${getWeekKey()}`]: increment(1),
        [`monthlyClicks.${getMonthKey()}`]: increment(1),
        
        // ✅ NEW: Traffic source tracking for each link
        ...(clickerInfo.trafficSource && {
            [`trafficSources.${clickerInfo.trafficSource.source}.totalClicks`]: increment(1),
            [`trafficSources.${clickerInfo.trafficSource.source}.${today}`]: increment(1),
            [`trafficSources.${clickerInfo.trafficSource.source}.lastClick`]: new Date(),
            [`trafficSources.${clickerInfo.trafficSource.source}.medium`]: clickerInfo.trafficSource.medium,
            [`trafficSources.${clickerInfo.trafficSource.source}.campaign`]: clickerInfo.trafficSource.campaign
        })
    };
    
    // Prepare main analytics update
    const clickData = {
        totalClicks: increment(1),
        [`dailyClicks.${today}`]: increment(1),
        [`weeklyClicks.${getWeekKey()}`]: increment(1),
        [`monthlyClicks.${getMonthKey()}`]: increment(1),
        lastUpdated: new Date(),
        
        // ✅ NEW: Global traffic source tracking
        ...(clickerInfo.trafficSource && {
            [`globalTrafficSources.${clickerInfo.trafficSource.source}.totalClicks`]: increment(1),
            [`globalTrafficSources.${clickerInfo.trafficSource.source}.${today}`]: increment(1),
            [`globalTrafficSources.${clickerInfo.trafficSource.source}.lastClick`]: new Date(),
            [`globalTrafficSources.${clickerInfo.trafficSource.source}.medium`]: clickerInfo.trafficSource.medium,
            [`globalTrafficSources.${clickerInfo.trafficSource.source}.type`]: clickerInfo.trafficSource.type
        })
    };
    
    // Add the link-specific data
    Object.keys(linkClickData).forEach(key => {
        clickData[`linkClicks.${linkInfo.linkId}.${key}`] = linkClickData[key];
    });

    if (!analyticsDoc.exists()) {
        console.log("🆕 Creating new analytics document with traffic source data...");
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
                    monthlyClicks: { [getMonthKey()]: 1 },
                    
                    // ✅ NEW: Traffic sources for this specific link
                    ...(clickerInfo.trafficSource && {
                        trafficSources: {
                            [clickerInfo.trafficSource.source]: {
                                totalClicks: 1,
                                [today]: 1,
                                lastClick: new Date(),
                                medium: clickerInfo.trafficSource.medium,
                                campaign: clickerInfo.trafficSource.campaign
                            }
                        }
                    })
                }
            },
            
            // ✅ NEW: Global traffic sources tracking
            ...(clickerInfo.trafficSource && {
                globalTrafficSources: {
                    [clickerInfo.trafficSource.source]: {
                        totalClicks: 1,
                        [today]: 1,
                        lastClick: new Date(),
                        medium: clickerInfo.trafficSource.medium,
                        type: clickerInfo.trafficSource.type
                    }
                }
            }),
            
            lastUpdated: new Date(),
            createdAt: new Date()
        });
    } else {
        console.log("🔄 Updating existing analytics with traffic source data...");
        await updateDoc(analyticsRef, clickData);
    }

    // Optional: Record detailed click logs with traffic source
    if (clickerInfo.recordDetailed) {
        await recordDetailedClick(username, linkInfo, clickerInfo);
    }
}

/**
 * ✅ ENHANCED: Records detailed click information with traffic source
 */
async function recordDetailedClick(username, linkInfo, clickerInfo) {
    try {
        console.log("📝 Recording detailed click log with traffic source...");
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
                city: clickerInfo.city || '',
                
                // ✅ NEW: Traffic source data in detailed logs
                trafficSource: clickerInfo.trafficSource || null
            }
        });
        console.log("✅ Recorded detailed click log with traffic source");
    } catch (error) {
        console.error("❌ Error recording detailed click:", error);
    }
}

/**
 * Most efficient version - use this when you have the user ID directly
 */
export async function recordLinkClickByUserId(userId, linkInfo, clickerInfo = {}) {
    try {
        console.log("🔥 Recording link click by user ID:", userId, "Link:", linkInfo.linkTitle);

        const userInfo = await fastUserLookup(userId);
        
        if (!userInfo) {
            console.error("❌ User not found in lookup table for ID:", userId);
            return;
        }

        console.log("✅ Found user via lookup:", userInfo.username);

        const processedLinkInfo = processLinkInfo(linkInfo);
        
        // ✅ NEW: Get session traffic data
        const trafficData = getSessionTrafficData();

        await recordClickData(userId, userInfo.username, processedLinkInfo, {
            ...clickerInfo,
            trafficSource: trafficData
        });
        
        await updateTeamAnalyticsIfNeeded(userId);
        
        console.log("🎉 Successfully recorded link click with traffic source!");

    } catch (error) {
        console.error("❌ Error recording link click by user ID:", error);
        throw error;
    }
}

/**
 * Check if user is in a team and update team analytics
 */
async function updateTeamAnalyticsIfNeeded(userId) {
    try {
        const userRef = doc(fireApp, "AccountData", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists() && userSnap.data().teamId) {
            const teamId = userSnap.data().teamId;
            console.log("🏢 User is in team, triggering team analytics update:", teamId);
            
            const { aggregateTeamAnalytics } = await import('../teamManagement');
            await aggregateTeamAnalytics(teamId);
            
            console.log("✅ Team analytics updated successfully");
        }
    } catch (error) {
        console.error("❌ Failed to update team analytics:", error);
    }
}

// Helper functions
function generateLinkId(linkInfo) {
    if (linkInfo.linkTitle) {
        return linkInfo.linkTitle
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '_')
            .replace(/_+/g, '_')
            .substring(0, 30);
    }
    return `link_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function getWeekKey() {
    const now = new Date();
    const yearStart = new Date(now.getFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now - yearStart) / 86400000 + yearStart.getDay() + 1) / 7);
    return `${now.getFullYear()}-W${weekNumber.toString().padStart(2, '0')}`;
}

function getMonthKey() {
    const now = new Date();
    return `${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}`;
}