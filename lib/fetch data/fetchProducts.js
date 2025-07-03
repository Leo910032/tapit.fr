// lib/fetch data/fetchProducts.js - NEW FILE
import { fireApp } from "@/important/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

export const fetchProducts = async () => {
    try {
        const productsRef = collection(fireApp, "products");
        // We query and order by 'sortOrder' to ensure they appear in the desired sequence
        const q = query(productsRef, orderBy("sortOrder", "asc")); 
        
        const querySnapshot = await getDocs(q);
        
        const products = [];
        querySnapshot.forEach((doc) => {
            // We combine the document ID and its data into one object
            products.push({
                id: doc.id,
                ...doc.data()
            });
        });

        console.log("✅ Successfully fetched products:", products);
        return products;

    } catch (error) {
        console.error("❌ Error fetching products:", error);
        // Return an empty array in case of an error
        return [];
    }
};