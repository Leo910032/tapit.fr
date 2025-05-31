// lib/contacts/addContact.js
import { fireApp } from "@/important/firebase";
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion } from "firebase/firestore";
import { generateRandomId } from "@/lib/utilities";
import { fetchUserData } from "@/lib/fetch data/fetchUserData";

/**
 * Add a contact to a profile owner's contact list
 * @param {string} profileUsername - The username of the profile owner
 * @param {Object} contactData - The contact information
 * @returns {Promise} - Promise that resolves when contact is added
 */
export async function addContactToProfile(profileUsername, contactData) {
    try {
        // Get the user ID from the username
        const userData = await fetchUserData(profileUsername);
        
        if (!userData) {
            throw new Error('Profile owner not found');
        }
        
        // Generate a unique ID for this contact
        const contactId = generateRandomId();
        
        // Prepare the contact data with additional metadata
        const contact = {
            id: contactId,
            name: contactData.name.trim(),
            email: contactData.email.trim().toLowerCase(),
            phone: contactData.phone?.trim() || '',
            company: contactData.company?.trim() || '',
            message: contactData.message?.trim() || '',
            submittedAt: contactData.submittedAt,
            status: 'new', // new, viewed, archived
            profileOwner: profileUsername
        };
        
        // Reference to the contacts collection for this user
        const contactsRef = collection(fireApp, "Contacts");
        const userContactsDocRef = doc(contactsRef, userData.userId || userData);
        
        // Check if the document exists
        const docSnap = await getDoc(userContactsDocRef);
        
        if (docSnap.exists()) {
            // Document exists, add to the contacts array
            await updateDoc(userContactsDocRef, {
                contacts: arrayUnion(contact),
                lastUpdated: new Date().toISOString()
            });
        } else {
            // Document doesn't exist, create it with the first contact
            await setDoc(userContactsDocRef, {
                userId: userData.userId || userData,
                username: profileUsername,
                contacts: [contact],
                createdAt: new Date().toISOString(),
                lastUpdated: new Date().toISOString()
            });
        }
        
        console.log('Contact added successfully:', contactId);
        return contactId;
        
    } catch (error) {
        console.error('Error adding contact:', error);
        throw error;
    }
}
