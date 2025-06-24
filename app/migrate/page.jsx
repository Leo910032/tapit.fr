// lib/userLookup.js - FIXED VERSION
import { fireApp } from "@/important/firebase";
import { collection, doc, setDoc, getDoc, getDocs } from "firebase/firestore";

/**
 * Creates/updates lookup entries when a user is created or updated
 * Call this in your createAccount and updateProfile functions
 */
export async function updateUserLookup(userId, username, displayName, email = null) {
    try {
        console.log("🔄 Updating user lookup for:", { userId, username, displayName, email });
        
        const lookupRef = collection(fireApp, "UserLookup");
        
        const lookupData = {
            userId,
            username,
            displayName,
            email,
            updatedAt: new Date()
        };
        
        // Create lookup entries one by one (more reliable than batch)
        const promises = [];
        
        // Create lookup by user ID (primary key)
        promises.push(
            setDoc(doc(lookupRef, userId), {
                ...lookupData,
                type: 'userId'
            })
        );
        
        // Create lookup by username (lowercase for case-insensitive)
        if (username) {
            promises.push(
                setDoc(doc(lookupRef, `username_${username.toLowerCase()}`), {
                    ...lookupData,
                    type: 'username'
                })
            );
        }
        
        // Create lookup by display name
        if (displayName && displayName !== username) {
            promises.push(
                setDoc(doc(lookupRef, `displayName_${displayName}`), {
                    ...lookupData,
                    type: 'displayName'
                })
            );
        }
        
        // Create lookup by email (optional)
        if (email) {
            promises.push(
                setDoc(doc(lookupRef, `email_${email.toLowerCase()}`), {
                    ...lookupData,
                    type: 'email'
                })
            );
        }
        
        await Promise.all(promises);
        console.log("✅ Updated user lookup successfully");
        
    } catch (error) {
        console.error("❌ Error updating user lookup:", error);
        throw error;
    }
}

/**
 * Fast user lookup using the lookup table
 * @param {string} identifier - Can be userId, username, displayName, or email
 * @returns {Object|null} User data or null if not found
 */
export async function fastUserLookup(identifier) {
    try {
        console.log("🔍 Fast lookup for:", identifier);
        
        const lookupRef = collection(fireApp, "UserLookup");
        
        // Try direct lookup first (for user IDs)
        let lookupDoc = await getDoc(doc(lookupRef, identifier));
        
        if (lookupDoc.exists()) {
            console.log("✅ Found by direct lookup");
            return lookupDoc.data();
        }
        
        // Try prefixed lookups
        const prefixes = ['username_', 'displayName_', 'email_'];
        
        for (const prefix of prefixes) {
            const key = `${prefix}${identifier.toLowerCase()}`;
            lookupDoc = await getDoc(doc(lookupRef, key));
            
            if (lookupDoc.exists()) {
                console.log(`✅ Found by ${prefix} lookup`);
                return lookupDoc.data();
            }
        }
        
        console.log("❌ User not found in lookup table");
        return null;
        
    } catch (error) {
        console.error("❌ Error in fast user lookup:", error);
        return null;
    }
}

/**
 * Migrates existing users to the lookup table - FIXED VERSION
 * Run this once to populate the lookup table with existing users
 */
export async function migrateUsersToLookupTable() {
    try {
        console.log("🚀 Starting user migration to lookup table...");
        
        const accountsRef = collection(fireApp, "accounts");
        const accountDataRef = collection(fireApp, "AccountData");
        
        // Get all accounts
        const accountsSnapshot = await getDocs(accountsRef);
        const accountDataSnapshot = await getDocs(accountDataRef);
        
        // Create maps for quick lookup
        const accountDataMap = new Map();
        accountDataSnapshot.forEach(doc => {
            accountDataMap.set(doc.id, doc.data());
        });
        
        console.log(`📊 Found ${accountsSnapshot.size} accounts to migrate`);
        
        const lookupRef = collection(fireApp, "UserLookup");
        let count = 0;
        const batchSize = 10; // Process in smaller batches
        
        // Process accounts in batches to avoid overwhelming Firestore
        const accounts = [];
        accountsSnapshot.forEach(doc => {
            accounts.push({ id: doc.id, data: doc.data() });
        });
        
        for (let i = 0; i < accounts.length; i += batchSize) {
            const batch = accounts.slice(i, i + batchSize);
            const promises = [];
            
            console.log(`🔄 Processing batch ${Math.floor(i/batchSize) + 1}/${Math.ceil(accounts.length/batchSize)}`);
            
            batch.forEach(({ id: userId, data: accountData }) => {
                const accountDetails = accountDataMap.get(userId);
                
                const lookupData = {
                    userId,
                    username: accountData.username,
                    displayName: accountDetails?.displayName || accountData.displayName || accountData.username,
                    email: accountData.email,
                    updatedAt: new Date()
                };
                
                // Add lookup entries for this user
                promises.push(
                    setDoc(doc(lookupRef, userId), { ...lookupData, type: 'userId' })
                );
                
                if (accountData.username) {
                    promises.push(
                        setDoc(doc(lookupRef, `username_${accountData.username.toLowerCase()}`), { 
                            ...lookupData, type: 'username' 
                        })
                    );
                }
                
                if (lookupData.displayName && lookupData.displayName !== accountData.username) {
                    promises.push(
                        setDoc(doc(lookupRef, `displayName_${lookupData.displayName}`), { 
                            ...lookupData, type: 'displayName' 
                        })
                    );
                }
                
                if (accountData.email) {
                    promises.push(
                        setDoc(doc(lookupRef, `email_${accountData.email.toLowerCase()}`), { 
                            ...lookupData, type: 'email' 
                        })
                    );
                }
                
                count++;
            });
            
            // Wait for this batch to complete before processing the next
            await Promise.all(promises);
            console.log(`✅ Completed batch ${Math.floor(i/batchSize) + 1}, processed ${Math.min(i + batchSize, accounts.length)} users`);
            
            // Small delay to be nice to Firestore
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        console.log(`✅ Successfully migrated ${count} users to lookup table`);
        
    } catch (error) {
        console.error("❌ Error migrating users to lookup table:", error);
        throw error;
    }
}

/**
 * Removes lookup entries for a user (for cleanup)
 */
export async function removeUserLookup(userId, username, displayName, email = null) {
    try {
        console.log("🗑️ Removing user lookup for:", userId);
        
        const lookupRef = collection(fireApp, "UserLookup");
        const promises = [];
        
        // Remove all lookup entries
        promises.push(setDoc(doc(lookupRef, userId), {}, { merge: false })); // Delete by setting empty
        
        if (username) {
            promises.push(setDoc(doc(lookupRef, `username_${username.toLowerCase()}`), {}, { merge: false }));
        }
        
        if (displayName) {
            promises.push(setDoc(doc(lookupRef, `displayName_${displayName}`), {}, { merge: false }));
        }
        
        if (email) {
            promises.push(setDoc(doc(lookupRef, `email_${email.toLowerCase()}`), {}, { merge: false }));
        }
        
        await Promise.all(promises);
        console.log("✅ Removed user lookup successfully");
        
    } catch (error) {
        console.error("❌ Error removing user lookup:", error);
        throw error;
    }
}