// lib/simpleMigration.js - ULTRA SIMPLE VERSION
import { fireApp } from "@/important/firebase";
import { collection, doc, setDoc, getDocs } from "firebase/firestore";

/**
 * Ultra simple migration - processes one user at a time
 */
export async function simpleMigrateUsers() {
    try {
        console.log("🚀 Starting simple migration...");
        
        const accountsRef = collection(fireApp, "accounts");
        const accountDataRef = collection(fireApp, "AccountData");
        const lookupRef = collection(fireApp, "UserLookup");
        
        // Get all accounts
        const accountsSnapshot = await getDocs(accountsRef);
        const accountDataSnapshot = await getDocs(accountDataRef);
        
        // Create account data map
        const accountDataMap = new Map();
        accountDataSnapshot.forEach(doc => {
            accountDataMap.set(doc.id, doc.data());
        });
        
        console.log(`📊 Found ${accountsSnapshot.size} accounts to migrate`);
        
        let processed = 0;
        
        // Process each user one by one
        for (const accountDoc of accountsSnapshot.docs) {
            const userId = accountDoc.id;
            const accountData = accountDoc.data();
            const accountDetails = accountDataMap.get(userId);
            
            console.log(`🔄 Processing user ${processed + 1}/${accountsSnapshot.size}: ${accountData.username}`);
            
            const lookupData = {
                userId,
                username: accountData.username,
                displayName: accountDetails?.displayName || accountData.displayName || accountData.username,
                email: accountData.email,
                updatedAt: new Date()
            };
            
            try {
                // Create lookup by user ID
                await setDoc(doc(lookupRef, userId), { ...lookupData, type: 'userId' });
                
                // Create lookup by username
                if (accountData.username) {
                    await setDoc(doc(lookupRef, `username_${accountData.username.toLowerCase()}`), { 
                        ...lookupData, type: 'username' 
                    });
                }
                
                // Create lookup by display name
                if (lookupData.displayName && lookupData.displayName !== accountData.username) {
                    await setDoc(doc(lookupRef, `displayName_${lookupData.displayName}`), { 
                        ...lookupData, type: 'displayName' 
                    });
                }
                
                // Create lookup by email
                if (accountData.email) {
                    await setDoc(doc(lookupRef, `email_${accountData.email.toLowerCase()}`), { 
                        ...lookupData, type: 'email' 
                    });
                }
                
                processed++;
                console.log(`✅ Processed user: ${accountData.username}`);
                
                // Small delay to be nice to Firestore
                await new Promise(resolve => setTimeout(resolve, 200));
                
            } catch (userError) {
                console.error(`❌ Failed to process user ${accountData.username}:`, userError);
                // Continue with next user
            }
        }
        
        console.log(`✅ Successfully migrated ${processed} users to lookup table`);
        
    } catch (error) {
        console.error("❌ Error in simple migration:", error);
        throw error;
    }
}