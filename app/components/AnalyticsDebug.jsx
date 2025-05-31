// components/AnalyticsDebug.jsx - Use this to debug analytics
"use client"
import { useEffect, useState } from 'react';
import { fireApp } from "@/important/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";

export default function AnalyticsDebug({ userId }) {
    const [debugInfo, setDebugInfo] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function debugAnalytics() {
            try {
                console.log("🔍 Starting analytics debug for userId:", userId);
                
                // 1. Check accounts collection
                console.log("📋 Checking accounts collection...");
                const accountsRef = collection(fireApp, "accounts");
                const accountsSnapshot = await getDocs(accountsRef);
                
                let foundUser = null;
                const allUsers = [];
                
                accountsSnapshot.forEach((doc) => {
                    const data = doc.data();
                    allUsers.push({
                        id: doc.id,
                        username: data.username,
                        email: data.email
                    });
                    
                    console.log("👤 Found user:", doc.id, "username:", data.username);
                    
                    if (doc.id === userId) {
                        foundUser = { id: doc.id, ...data };
                    }
                });

                // 2. Check Analytics collection
                console.log("📊 Checking Analytics collection...");
                const analyticsRef = doc(collection(fireApp, "Analytics"), userId);
                const analyticsDoc = await getDoc(analyticsRef);
                
                const analyticsData = analyticsDoc.exists() ? analyticsDoc.data() : null;

                // 3. Check AccountData collection
                console.log("🏠 Checking AccountData collection...");
                const accountDataRef = doc(collection(fireApp, "AccountData"), userId);
                const accountDataDoc = await getDoc(accountDataRef);
                
                const accountData = accountDataDoc.exists() ? accountDataDoc.data() : null;

                setDebugInfo({
                    userId,
                    foundUser,
                    allUsers,
                    analyticsExists: analyticsDoc.exists(),
                    analyticsData,
                    accountDataExists: accountDataDoc.exists(),
                    accountData: accountData ? {
                        hasLinks: !!accountData.links,
                        linksCount: accountData.links ? accountData.links.length : 0,
                        links: accountData.links || [],
                        username: accountData.username || 'Not found'
                    } : null
                });

                setLoading(false);
            } catch (error) {
                console.error("❌ Debug error:", error);
                setDebugInfo({ error: error.message });
                setLoading(false);
            }
        }

        if (userId) {
            debugAnalytics();
        }
    }, [userId]);

    if (loading) {
        return <div className="p-4 bg-yellow-100 rounded">🔍 Debugging analytics...</div>;
    }

    return (
        <div className="p-4 bg-gray-100 rounded-lg text-xs font-mono max-h-96 overflow-auto">
            <h3 className="font-bold text-lg mb-2">🔍 Analytics Debug Info</h3>
            
            <div className="mb-4">
                <h4 className="font-semibold">User ID:</h4>
                <p>{debugInfo.userId}</p>
            </div>

            <div className="mb-4">
                <h4 className="font-semibold">Found User in Accounts:</h4>
                <pre>{JSON.stringify(debugInfo.foundUser, null, 2)}</pre>
            </div>

            <div className="mb-4">
                <h4 className="font-semibold">All Users in System:</h4>
                <pre>{JSON.stringify(debugInfo.allUsers, null, 2)}</pre>
            </div>

            <div className="mb-4">
                <h4 className="font-semibold">Analytics Document Exists:</h4>
                <p className={debugInfo.analyticsExists ? "text-green-600" : "text-red-600"}>
                    {debugInfo.analyticsExists ? "✅ Yes" : "❌ No"}
                </p>
            </div>

            {debugInfo.analyticsData && (
                <div className="mb-4">
                    <h4 className="font-semibold">Analytics Data:</h4>
                    <pre>{JSON.stringify(debugInfo.analyticsData, null, 2)}</pre>
                </div>
            )}

            <div className="mb-4">
                <h4 className="font-semibold">Account Data:</h4>
                <pre>{JSON.stringify(debugInfo.accountData, null, 2)}</pre>
            </div>

            {debugInfo.error && (
                <div className="mb-4 text-red-600">
                    <h4 className="font-semibold">Error:</h4>
                    <p>{debugInfo.error}</p>
                </div>
            )}

            <div className="mt-4 p-2 bg-blue-100 rounded">
                <h4 className="font-semibold">🛠️ Troubleshooting Steps:</h4>
                <ul className="list-disc list-inside text-sm">
                    <li>Verify userId matches a document in the 'accounts' collection</li>
                    <li>Check if Analytics document exists for this userId</li>
                    <li>Ensure buttons are passing correct linkId and userId</li>
                    <li>Check browser console for click tracking logs</li>
                    <li>Verify Firestore security rules allow write access to Analytics collection</li>
                </ul>
            </div>
        </div>
    );
}
