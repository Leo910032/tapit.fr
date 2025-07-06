// lib/update data/updateLinks.js - Enhanced to handle system buttons
import { testForActiveSession } from "../authentication/testForActiveSession";
import { fireApp } from "@/important/firebase";
import { collection, doc, updateDoc } from "firebase/firestore";

export async function updateLinks(linksArray) {
    try {
        console.log('🔄 Updating links with system buttons:', linksArray);
        
        const currentUser = testForActiveSession();
        
        if (!currentUser) {
            throw new Error('No active session found');
        }

        const collectionRef = collection(fireApp, "AccountData");
        const docRef = doc(collectionRef, currentUser);

        // Process the links array to ensure system buttons are properly formatted
        const processedLinks = linksArray.map(link => {
            if (link.isSystem || link.type === 'system') {
                // System button - only save essential data
                return {
                    id: link.id,
                    isActive: link.isActive !== undefined ? link.isActive : true,
                    type: 'system',
                    systemType: link.systemType,
                    isSystem: true,
                    isDeletable: false,
                    title: link.title || '', // Keep title for reference
                    url: '', // System buttons don't need URLs
                };
            } else {
                // Regular link - save all data
                return {
                    id: link.id,
                    title: link.title || '',
                    url: link.url || '',
                    isActive: link.isActive !== undefined ? link.isActive : true,
                    type: link.type || 1,
                    urlKind: link.urlKind || '',
                    isDeletable: true,
                    isSystem: false
                };
            }
        });

        await updateDoc(docRef, {
            links: processedLinks
        });

        console.log('✅ Links updated successfully');
    } catch (error) {
        console.error('❌ Error updating links:', error);
        throw error;
    }
}