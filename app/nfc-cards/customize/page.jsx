// app/nfc-cards/customize/page.jsx - FINAL DYNAMIC IMPORT VERSION
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import dynamic from 'next/dynamic';

// --- DYNAMIC IMPORTS ---
// These components will now only be loaded on the client-side
const CustomizationForm = dynamic(() => import('./components/CustomizationForm'), { ssr: false, loading: () => <p>Loading Form...</p> });
const LivePreview = dynamic(() => import('./components/LivePreview'), { ssr: false, loading: () => <p>Loading Preview...</p> });
const LogoUploader = dynamic(() => import('./components/LogoUploader'), { ssr: false, loading: () => <p>Loading Uploader...</p> });

// We will pass the functions needed from here, so these top-level imports are safer
import { fetchProducts } from "@/lib/fetch data/fetchProducts";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";

const DEFAULT_SVG = `<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg"><rect width="500" height="300" rx="15" fill="#e5e7eb"/><text x="250" y="150" text-anchor="middle" font-family="Arial" font-size="20" fill="#9ca3af">Select a card to begin</text></svg>`;
export default function CustomizePage() {
 const router = useRouter();
    
    // Page status
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);
    // Customization state
 const [customValues, setCustomValues] = useState({});
    const [displaySvg, setDisplaySvg] = useState(DEFAULT_SVG);
    const [isUploading, setIsUploading] = useState(false);
    const [logoUrl, setLogoUrl] = useState("");

    const [userId, setUserId] = useState(null);


    useEffect(() => {
        // This code now only runs on the client-side
        const currentUserId = testForActiveSession(true);
        setUserId(currentUserId);

        const getProducts = async () => {
            const fetchedProducts = await fetchProducts();
            setProducts(fetchedProducts);
            if (fetchedProducts.length > 0) {
                const firstProduct = fetchedProducts[0];
                handleProductSelect(firstProduct); 
            }
            setIsLoading(false);
        };
        getProducts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])
    // Effect to update the SVG preview
    useEffect(() => {
        if (!selectedProduct || !selectedProduct.templateSvg) {
            setDisplaySvg(DEFAULT_SVG);
            return;
        }
        let updatedSvg = selectedProduct.templateSvg;
        
        // Replace text placeholders
        selectedProduct.customizableFields?.forEach(field => {
            const value = customValues[field.id] || '';
            updatedSvg = updatedSvg.replace(new RegExp(field.placeholderKey, 'g'), value);
        });

        // ✅ Replace the logo placeholder
        // Fallback to an empty string to prevent the 404 error
        updatedSvg = updatedSvg.replace(/__LOGO_HREF__/g, logoUrl || "");
        
        setDisplaySvg(updatedSvg);
    }, [customValues, selectedProduct, logoUrl]); // Add logoUrl to dependencies

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
        if (!userId) { /* ... same ... */ }

        setIsSaving(true);
        const loadingToast = toast.loading("Saving your custom card...");

        try {
            // --- DYNAMICALLY IMPORT FIREBASE FUNCTIONS ---
            // This ensures they are only loaded when the button is clicked
            const { getFirestore, collection, addDoc, serverTimestamp } = await import('firebase/firestore');
            const { fireApp } = await import('@/important/firebase');
            const db = getFirestore(fireApp);

            const userCardsCollectionRef = collection(db, "AccountData", userId, "userCards");
              const newCardData = {
            productId: selectedProduct.id,
            productName: selectedProduct.name,
            customizedData: customValues,
            logoUrl: logoUrl, // <-- Save the logo URL
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
                {/* Left side: The full form */}
                <div>
                    <CustomizationForm
                        products={products}
                        selectedProduct={selectedProduct}
                        customValues={customValues}
                        onProductSelect={handleProductSelect}
                        onCustomValueChange={handleCustomValueChange}
                    />
                    <LogoUploader
                        userId={userId}
                        isUploading={isUploading}
                        onUploadStart={() => setIsUploading(true)}
                        onUploadComplete={(url) => {
                            if (url) {
                                setLogoUrl(url);
                            } else {
                                toast.error("Logo upload failed.");
                            }
                            setIsUploading(false);
                        }}
                    />
                </div>
                
                {/* Right side: The preview */}
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