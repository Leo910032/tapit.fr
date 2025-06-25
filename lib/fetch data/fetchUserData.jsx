// lib/fetch data/fetchUserData.js - ENHANCED VERSION
import { fastUserLookup } from "@/lib/userLookup"; // ✅ Import fast lookup
import { fireApp } from "@/important/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";

/**
 * Enhanced fetchUserData that tries fast lookup first, then falls back to original method
 * @param {string} username - Username to look up
 * @returns {string|null} - User ID if found, null otherwise
 */
export async function fetchUserData(username) {
    console.log('🔍 fetchUserData called with:', username);
    
    try {
        // ✅ Try fast lookup first
        const fastResult = await fastUserLookup(username);
        if (fastResult && fastResult.userId) {
            console.log('⚡ Fast lookup successful in fetchUserData:', fastResult.userId);
            return fastResult.userId;
        }
        
        console.log('🔄 Fast lookup failed, using original method...');
        
        // ✅ Fallback to original method
        const collectionRef = collection(fireApp, "accounts");
        const q = query(collectionRef, where("username", "==", username));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
            const userId = querySnapshot.docs[0].id;
            console.log('✅ Original method successful:', userId);
            return userId;
        } else {
            console.log('❌ User not found with original method');
            return null;
        }
    } catch (error) {
        console.error('❌ Error in fetchUserData:', error);
        
        // Final fallback to original method only
        try {
            console.log('🆘 Final fallback to original method...');
            const collectionRef = collection(fireApp, "accounts");
            const q = query(collectionRef, where("username", "==", username));
            const querySnapshot = await getDocs(q);
            
            if (!querySnapshot.empty) {
                const userId = querySnapshot.docs[0].id;
                console.log('✅ Final fallback successful:', userId);
                return userId;
            } else {
                console.log('❌ Final fallback failed');
                return null;
            }
        } catch (finalError) {
            console.error('❌ Final fallback error:', finalError);
            return null;
        }
    }
}