// app/nfc-cards/customize/page.jsx - FULLY REFACTORED
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fireApp } from "@/important/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";

import { fetchProducts } from "@/lib/fetch data/fetchProducts";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";

// Import the new components
import CustomizationForm from "./components/CustomizationForm";
import LivePreview from "./components/LivePreview";

const DEFAULT_SVG = `<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg"><rect width="500" height="300" rx="15" fill="#e5e7eb"/><text x="250" y="150" text-anchor="middle" font-family="Arial" font-size="20" fill="#9ca3af">Select a card to begin</text></svg>`;

export default function CustomizePage() {
    const router = useRouter();
    
    // State for data and page status
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // State for user's customization inputs
    const [userName, setUserName] = useState("Your Name");
    const [companyName, setCompanyName] = useState("Your Company");
    const [displaySvg, setDisplaySvg] = useState(DEFAULT_SVG);

    // Fetch products when the page loads
    useEffect(() => {
        const getProducts = async () => {
            const fetchedProducts = await fetchProducts();
            setProducts(fetchedProducts);
            if (fetchedProducts.length > 0) {
                setSelectedProduct(fetchedProducts[0]); // Auto-select the first product
            }
            setIsLoading(false);
        };
        getProducts();
    }, []);

    // This effect runs whenever the user's input or the selected product changes
    useEffect(() => {
        if (!selectedProduct || !selectedProduct.templateSvg) {
            setDisplaySvg(DEFAULT_SVG);
            return;
        }
        
        // Start with the clean template from the selected product
        let updatedSvg = selectedProduct.templateSvg;
        
        // Replace placeholders with current state values
        updatedSvg = updatedSvg.replace(/__USER_NAME__/g, userName || "");
        updatedSvg = updatedSvg.replace(/__COMPANY_NAME__/g, companyName || "");
        
        setDisplaySvg(updatedSvg);
    }, [userName, companyName, selectedProduct]);

    const handleProceedToCheckout = async () => {
        const userId = testForActiveSession(true);
        if (!userId) {
            toast.error("Please log in to save your card.");
            router.push(`/login?returnTo=/nfc-cards/customize`);
            return;
        }
        if (!selectedProduct) {
            toast.error("Please select a card type first.");
            return;
        }

        setIsSaving(true);
        const loadingToast = toast.loading("Saving your custom card...");

        try {
            const userCardsCollectionRef = collection(fireApp, "AccountData", userId, "userCards");
            const newCardData = {
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                customName: userName.trim(),
                companyName: companyName.trim(),
                createdAt: serverTimestamp(),
                linkedProfile: userId,
                customizedSvg: displaySvg, // Save the final, generated SVG
            };

            const newCardDoc = await addDoc(userCardsCollectionRef, newCardData);
            toast.dismiss(loadingToast);
            toast.success("Card saved! Proceeding to checkout...");

            sessionStorage.setItem('cartItem', JSON.stringify({ cardId: newCardDoc.id, price: selectedProduct.price }));
            setTimeout(() => router.push('/nfc-cards/checkout'), 1500);

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
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
                <CustomizationForm
                    products={products}
                    selectedProduct={selectedProduct}
                    userName={userName}
                    companyName={companyName}
                    onProductSelect={setSelectedProduct}
                    onUserNameChange={setUserName}
                    onCompanyNameChange={setCompanyName}
                />
                <LivePreview
                    displaySvg={displaySvg}
                    isSaving={isSaving}
                    selectedProduct={selectedProduct}
                    onProceedToCheckout={handleProceedToCheckout}
                />
            </div>
        </div>
    );
}