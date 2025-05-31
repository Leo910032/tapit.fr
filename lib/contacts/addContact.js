// lib/contacts/addContact.js - DEBUG VERSION
import { fireApp } from "@/important/firebase";
import { collection, doc, setDoc, getDoc, updateDoc, arrayUnion, getDocs } from "firebase/firestore";
import { generateRandomId } from "@/lib/utilities";

/**
 * Add a contact to a profile owner's contact list - DEBUG VERSION
 */
export async function addContactToProfile(profileUsername, contactData) {
    try {
        console.log("🔥 Starting addContactToProfile for username:", profileUsername);
        console.log("📋 Contact data:", contactData);
        
        // Test 1: Can we read from accounts collection?
        console.log("📖 Test 1: Reading accounts collection...");
        const accountsRef = collection(fireApp, "accounts");
        let querySnapshot;
        
        try {
            querySnapshot = await getDocs(accountsRef);
            console.log("✅ Successfully read accounts collection. Documents found:", querySnapshot.size);
        } catch (readError) {
            console.error("❌ Failed to read accounts collection:", readError);
            throw new Error(`Cannot read accounts collection: ${readError.message}`);
        }
        
        // Test 2: Find the user
        let userId = null;
        let actualUsername = null;
        
        console.log("🔍 Test 2: Searching for username:", profileUsername);
        
        querySnapshot.forEach((doc) => {
            const data = doc.data();
            console.log("📋 Document:", doc.id, "has username:", data.username);
            
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

        console.log("👤 Found user - ID:", userId, "Username:", actualUsername);
        
        // Test 3: Can we read from Contacts collection?
        console.log("📖 Test 3: Testing read access to Contacts collection...");
        const contactsRef = collection(fireApp, "Contacts");
        const userContactsDocRef = doc(contactsRef, userId);
        
        try {
            const docSnap = await getDoc(userContactsDocRef);
            console.log("✅ Successfully read from Contacts collection. Document exists:", docSnap.exists());
            
            if (docSnap.exists()) {
                console.log("📋 Existing document data structure:", Object.keys(docSnap.data()));
            }
        } catch (readContactsError) {
            console.error("❌ Failed to read from Contacts collection:", readContactsError);
            throw new Error(`Cannot read contacts collection: ${readContactsError.message}`);
        }
        
        // Generate contact data
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
            profileOwner: profileUsername
        };
        
        console.log("📝 Prepared contact object:", contact);
        
        // Test 4: Try the simplest write operation first - create a new document
        console.log("📝 Test 4: Attempting to write to Contacts collection...");
        
        try {
            // Try creating a completely new document with a test ID first
            const testDocRef = doc(contactsRef, `test_${Date.now()}`);
            await setDoc(testDocRef, {
                test: true,
                timestamp: new Date().toISOString(),
                message: "Test document to verify write permissions"
            });
            console.log("✅ Test write successful - permissions are working");
            
            // Clean up test document immediately
            // await deleteDoc(testDocRef); // Commented out since rules don't allow delete
            
        } catch (testWriteError) {
            console.error("❌ Test write failed:", testWriteError);
            throw new Error(`Write permission test failed: ${testWriteError.message}`);
        }
        
        // Test 5: Now try the actual contact creation
        console.log("📝 Test 5: Creating actual contact document...");
        
        try {
            // Check if document exists
            const docSnap = await getDoc(userContactsDocRef);
            
            if (docSnap.exists()) {
                console.log("🔄 Document exists, trying to update with arrayUnion...");
                await updateDoc(userContactsDocRef, {
                    contacts: arrayUnion(contact),
                    lastUpdated: new Date().toISOString()
                });
                console.log("✅ Successfully updated existing document");
            } else {
                console.log("🆕 Document doesn't exist, creating new one...");
                await setDoc(userContactsDocRef, {
                    userId: userId,
                    username: actualUsername,
                    contacts: [contact],
                    createdAt: new Date().toISOString(),
                    lastUpdated: new Date().toISOString()
                });
                console.log("✅ Successfully created new document");
            }
            
        } catch (contactWriteError) {
            console.error("❌ Contact write failed:", contactWriteError);
            console.error("❌ Error code:", contactWriteError.code);
            console.error("❌ Error message:", contactWriteError.message);
            throw new Error(`Contact write failed: ${contactWriteError.message}`);
        }
        
        console.log("🎉 Contact added successfully:", contactId);
        return contactId;
        
    } catch (error) {
        console.error("❌ Function failed at:", error.message);
        console.error("🔍 Full error:", error);
        throw error;
    }
}

// Additional debug function to test permissions separately
export async function testContactsPermissions() {
    try {
        console.log("🧪 Testing Contacts collection permissions...");
        
        const contactsRef = collection(fireApp, "Contacts");
        const testDocRef = doc(contactsRef, "permission_test");
        
        // Test read
        try {
            await getDoc(testDocRef);
            console.log("✅ Read permission: OK");
        } catch (e) {
            console.error("❌ Read permission: FAILED", e.message);
        }
        
        // Test write
        try {
            await setDoc(testDocRef, {
                test: true,
                timestamp: new Date().toISOString()
            });
            console.log("✅ Write permission: OK");
        } catch (e) {
            console.error("❌ Write permission: FAILED", e.message);
        }
        
    } catch (error) {
        console.error("❌ Permission test failed:", error);
    }
}