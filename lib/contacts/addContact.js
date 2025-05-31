// lib/contacts/addContact.js - Updated with Geolocation Support
import { fireApp } from "@/important/firebase";
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, getDocs } from "firebase/firestore";
import { generateRandomId } from "@/lib/utilities";

/**
 * Add a contact to a profile owner's contact list with geolocation support
 */
export async function addContactToProfile(profileUsername, contactData) {
    try {
        console.log("🔥 Starting addContactToProfile for username:", profileUsername);
        console.log("📋 Contact data:", contactData);
        console.log("🌍 Location data:", contactData.location);
        
        // Find the user ID from username
        const accountsRef = collection(fireApp, "accounts");
        const querySnapshot = await getDocs(accountsRef);
        
        let userId = null;
        let actualUsername = null;
        
        console.log("🔍 Searching for username:", profileUsername);
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            if (data.username === profileUsername) {
                userId = doc.id;
                actualUsername = data.username;
                console.log("✅ Match found! User ID:", userId);
            }
        });

        if (!userId) {
            console.error("❌ User not found for username:", profileUsername);
            throw new Error(`Profile owner not found for username: ${profileUsername}`);
        }

        // Generate contact data with enhanced geolocation
        const contactId = generateRandomId();
        console.log("🆔 Generated contact ID:", contactId);
        
        const contact = {
            id: contactId,
            name: contactData.name.trim(),
            email: contactData.email.trim().toLowerCase(),
            phone: contactData.phone?.trim() || '',
            company: contactData.company?.trim() || '',
            message: contactData.message?.trim() || '',
            submittedAt: contactData.submittedAt,
            status: 'new',
            profileOwner: profileUsername,
            
            // Enhanced location data
            location: contactData.location ? {
                latitude: contactData.location.latitude,
                longitude: contactData.location.longitude,
                accuracy: contactData.location.accuracy || null,
                timestamp: contactData.location.timestamp || new Date().toISOString(),
                // Add reverse geocoding placeholder (you can enhance this later)
                address: null,
                city: null,
                country: null
            } : null,
            
            locationStatus: contactData.locationStatus || 'unavailable',
            
            // Additional metadata
            metadata: {
                userAgent: contactData.userAgent || '',
                referrer: contactData.referrer || 'direct',
                ipAddress: null, // Don't store IP for privacy
                sessionId: contactData.sessionId || null
            }
        };
        
        console.log("📝 Prepared contact object with location:", contact);
        
        // Save to Firebase
        const contactsRef = collection(fireApp, "Contacts");
        const userContactsDocRef = doc(contactsRef, userId);
        
        try {
            const docSnap = await getDoc(userContactsDocRef);
            
            if (docSnap.exists()) {
                console.log("🔄 Document exists, updating with new contact...");
                await updateDoc(userContactsDocRef, {
                    contacts: arrayUnion(contact),
                    lastUpdated: new Date().toISOString(),
                    totalContacts: docSnap.data().contacts ? docSnap.data().contacts.length + 1 : 1
                });
                console.log("✅ Successfully updated existing document");
            } else {
                console.log("🆕 Document doesn't exist, creating new one...");
                await setDoc(userContactsDocRef, {
                    userId: userId,
                    username: actualUsername,
                    contacts: [contact],
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString(),
                    totalContacts: 1,
                    // Analytics for location data
                    locationStats: {
                        totalWithLocation: contactData.location ? 1 : 0,
                        totalWithoutLocation: contactData.location ? 0 : 1,
                        locationGranted: contactData.locationStatus === 'granted' ? 1 : 0,
                        locationDenied: contactData.locationStatus === 'denied' ? 1 : 0
                    }
                });
                console.log("✅ Successfully created new document");
            }
            
            // If this contact has location data, you might want to trigger
            // additional analytics or notifications here
            if (contactData.location) {
                console.log("📍 Contact includes geolocation data - lat:", 
                    contactData.location.latitude, "lng:", contactData.location.longitude);
                
                // Optional: You could add reverse geocoding here to get address info
                // await enhanceContactWithGeocoding(contactId, contactData.location);
            }
            
        } catch (contactWriteError) {
            console.error("❌ Contact write failed:", contactWriteError);
            throw new Error(`Contact write failed: ${contactWriteError.message}`);
        }
        
        console.log("🎉 Contact added successfully:", contactId);
        return contactId;
        
    } catch (error) {
        console.error("❌ Function failed:", error.message);
        throw error;
    }
}

/**
 * Optional: Enhance contact with reverse geocoding
 * This function can be called to get readable address from coordinates
 */
export async function enhanceContactWithGeocoding(contactId, location) {
    try {
        // This would require Google Geocoding API
        // You can implement this if you want to convert coordinates to addresses
        console.log("🌐 Would enhance contact", contactId, "with geocoding for:", location);
        
        // Example implementation:
        /*
        const response = await fetch(
            `https://maps.googleapis.com/maps/api/geocode/json?latlng=${location.latitude},${location.longitude}&key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}`
        );
        
        if (response.ok) {
            const data = await response.json();
            if (data.results && data.results.length > 0) {
                const result = data.results[0];
                
                // Extract address components
                const addressComponents = result.address_components;
                let city = null;
                let country = null;
                
                addressComponents.forEach(component => {
                    if (component.types.includes('locality')) {
                        city = component.long_name;
                    }
                    if (component.types.includes('country')) {
                        country = component.long_name;
                    }
                });
                
                return {
                    address: result.formatted_address,
                    city: city,
                    country: country,
                    addressComponents: addressComponents
                };
            }
        }
        */
        
    } catch (error) {
        console.error("❌ Geocoding enhancement failed:", error);
    }
}

/**
 * Get analytics about contact locations
 */
export async function getContactLocationAnalytics(userId) {
    try {
        const contactsRef = collection(fireApp, "Contacts");
        const userContactsDocRef = doc(contactsRef, userId);
        const docSnap = await getDoc(userContactsDocRef);
        
        if (!docSnap.exists()) {
            return {
                totalContacts: 0,
                contactsWithLocation: 0,
                contactsWithoutLocation: 0,
                locationGrantRate: 0,
                uniqueLocations: 0
            };
        }
        
        const data = docSnap.data();
        const contacts = data.contacts || [];
        
        const contactsWithLocation = contacts.filter(c => c.location && c.location.latitude);
        const contactsWithoutLocation = contacts.filter(c => !c.location || !c.location.latitude);
        const locationGranted = contacts.filter(c => c.locationStatus === 'granted');
        
        // Calculate unique locations (within ~100m radius)
        const uniqueLocations = new Set();
        contactsWithLocation.forEach(contact => {
            const roundedLat = Math.round(contact.location.latitude * 1000) / 1000;
            const roundedLng = Math.round(contact.location.longitude * 1000) / 1000;
            uniqueLocations.add(`${roundedLat},${roundedLng}`);
        });
        
        return {
            totalContacts: contacts.length,
            contactsWithLocation: contactsWithLocation.length,
            contactsWithoutLocation: contactsWithoutLocation.length,
            locationGrantRate: contacts.length > 0 ? (locationGranted.length / contacts.length) * 100 : 0,
            uniqueLocations: uniqueLocations.size,
            locationsByStatus: {
                granted: contacts.filter(c => c.locationStatus === 'granted').length,
                denied: contacts.filter(c => c.locationStatus === 'denied').length,
                unavailable: contacts.filter(c => c.locationStatus === 'unavailable').length
            }
        };
        
    } catch (error) {
        console.error("❌ Error getting location analytics:", error);
        return null;
    }
}