// app/nfc-cards/customize/page.jsx - CORRECTED DYNAMIC VERSION
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { fireApp } from "@/important/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";

import { fetchProducts } from "@/lib/fetch data/fetchProducts";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";

import CustomizationForm from "./components/CustomizationForm";
import LivePreview from "./components/LivePreview";

const DEFAULT_SVG = `<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg"><rect width="500" height="300" rx="15" fill="#e5e7eb"/><text x="250" y="150" text-anchor="middle" font-family="Arial" font-size="20" fill="#9ca3af">Select a card to begin</text></svg>`;

export default function CustomizePage() {
    const router = useRouter();
    
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    const [customValues, setCustomValues] = useState({});
    const [displaySvg, setDisplaySvg] = useState(DEFAULT_SVG);

    useEffect(() => {
        const getProducts = async () => {
            const fetchedProducts = await fetchProducts();
            setProducts(fetchedProducts);
            if (fetchedProducts.length > 0) {
                const firstProduct = fetchedProducts[0];
                // Call the handler to properly initialize state for the first product
                handleProductSelect(firstProduct); 
            }
            setIsLoading(false);
        };
        getProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!selectedProduct || !selectedProduct.templateSvg) {
            setDisplaySvg(DEFAULT_SVG);
            return;
        }
        let updatedSvg = selectedProduct.templateSvg;
        selectedProduct.customizableFields?.forEach(field => {
            const value = customValues[field.id] || '';
            updatedSvg = updatedSvg.replace(new RegExp(field.placeholderKey, 'g'), value);
        });
        setDisplaySvg(updatedSvg);
    }, [customValues, selectedProduct]);

    const handleCustomValueChange = (fieldId, value) => {
        setCustomValues(prev => ({ ...prev, [fieldId]: value }));
    };
    
    // --- THIS IS THE SINGLE, CORRECTLY PLACED FUNCTION ---
    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        const initialValues = {};
        product.customizableFields?.forEach(field => {
            initialValues[field.id] = field.defaultValue || '';
        });
        setCustomValues(initialValues);
    };
    
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
                customizedData: customValues,
                createdAt: serverTimestamp(),
                linkedProfile: userId,
                customizedSvg: displaySvg,
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
                    customValues={customValues}
                    onProductSelect={handleProductSelect}
                    onCustomValueChange={handleCustomValueChange}
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