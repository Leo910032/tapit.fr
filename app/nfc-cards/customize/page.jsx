// app/nfc-cards/customize/page.jsx - FINAL VERSION
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fireApp } from "@/important/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";

import { fetchProducts } from "@/lib/fetch data/fetchProducts";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";

export default function CustomizePage() {
    const router = useRouter();
    
    // State for managing products from Firestore
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);

    // State for user's customization
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [customName, setCustomName] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    // Fetch products from Firestore when the component mounts
    useEffect(() => {
        const getProducts = async () => {
            const fetchedProducts = await fetchProducts();
            setProducts(fetchedProducts);
            setIsLoading(false);
        };
        getProducts();
    }, []);

    const handleAddToCart = async () => {
        // 1. Check for authentication
        const userId = testForActiveSession(true); // true = skip redirect
        if (!userId) {
            toast.error("Please log in to customize a card.");
            // Redirect to login, passing the current page as the return destination
            router.push(`/login?returnTo=/nfc-cards/customize`);
            return;
        }

        // 2. Validate user input
        if (!selectedProduct) {
            toast.error("Please select a card type first.");
            return;
        }
        if (!customName.trim()) {
            toast.error("Please give your card a name.");
            return;
        }

        setIsSaving(true);
        const loadingToast = toast.loading("Adding to your account...");

        try {
            // 3. Define the path to the user's sub-collection
            // This creates a new 'userCards' collection for each user if it doesn't exist
            const userCardsCollectionRef = collection(fireApp, "AccountData", userId, "userCards");

            // 4. Prepare the data to be saved
            const newCardData = {
                productId: selectedProduct.id,      // e.g., "metal-premium-001"
                productName: selectedProduct.name,  // e.g., "Premium Metal Card"
                customName: customName.trim(),      // The name the user gave it
                createdAt: serverTimestamp(),       // Firestore server timestamp
                linkedProfile: userId,              // The user's main profile this card will link to
                // Add more customization fields here in the future (e.g., color, logoUrl)
            };

            // 5. Add the new document to Firestore
            const newCardDoc = await addDoc(userCardsCollectionRef, newCardData);
            console.log("✅ New card saved with ID:", newCardDoc.id);
            toast.dismiss(loadingToast);
            toast.success("Card added! Redirecting to checkout...");

            // 6. Add the new card ID to session storage for the checkout page to use
            sessionStorage.setItem('cartItem', JSON.stringify({ cardId: newCardDoc.id, price: selectedProduct.price }));

            // 7. Redirect to the checkout page
            setTimeout(() => {
                router.push('/nfc-cards/checkout');
            }, 1500);

        } catch (error) {
            console.error("❌ Error saving card:", error);
            toast.dismiss(loadingToast);
            toast.error("Something went wrong. Please try again.");
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return <div className="pt-32 text-center">Loading products...</div>;
    }

    return (
        <div className="container mx-auto px-4 pt-32 pb-16">
            <Toaster position="bottom-center" />
            <div className="max-w-3xl mx-auto">
                {/* Step 1: Choose Card Type */}
                <div className="mb-12">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 1: Choose Your Card</h1>
                    <p className="text-gray-600">Select the type of card youd like to personalize.</p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                        {products.map((product) => (
                            <div 
                                key={product.id}
                                onClick={() => setSelectedProduct(product)}
                                className={`p-6 bg-white rounded-lg border-2 cursor-pointer transition-all ${selectedProduct?.id === product.id ? 'border-themeGreen shadow-lg scale-105' : 'border-gray-200 hover:border-gray-400'}`}
                            >
                                <Image src={product.image} alt={product.name} width={400} height={250} className="rounded-md w-full object-cover mb-4" />
                                <h3 className="text-xl font-semibold text-gray-800">{product.name}</h3>
                                <p className="text-gray-500 text-sm my-2">{product.description}</p>
                                <p className="text-2xl font-bold text-gray-900">${product.price}</p>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Step 2: Personalize (only shows after a card is selected) */}
                {selectedProduct && (
                    <div className="bg-white p-8 rounded-lg shadow-md border animate-fade-in">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Step 2: Personalize It</h2>
                        <p className="text-gray-600 mb-6">Give your <span className="font-semibold">{selectedProduct.name}</span> a unique name.</p>
                        
                        <div>
                            <label htmlFor="cardName" className="block text-sm font-medium text-gray-700 mb-1">
                                Card Name (e.g., My Work Card)
                            </label>
                            <input
                                type="text"
                                id="cardName"
                                value={customName}
                                onChange={(e) => setCustomName(e.target.value)}
                                placeholder="Enter a name for your card"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-themeGreen focus:border-themeGreen"
                            />
                        </div>

                        <button
                            onClick={handleAddToCart}
                            disabled={isSaving || !customName.trim()}
                            className="w-full mt-8 bg-themeGreen text-white px-8 py-4 rounded-lg font-semibold hover:scale-105 active:scale-95 transition-transform disabled:bg-gray-400 disabled:cursor-not-allowed"
                        >
                            {isSaving ? "Saving..." : `Add to Cart & Checkout ($${selectedProduct.price})`}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}