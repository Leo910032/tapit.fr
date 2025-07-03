// app/nfc-cards/customize/page.jsx - UPDATED VERSION
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { fireApp } from "@/important/firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { toast, Toaster } from "react-hot-toast";

import { fetchProducts } from "@/lib/fetch data/fetchProducts";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";

// Base SVG template - in a real app, this would come from the selectedProduct
const BASE_SVG_TEMPLATE = `
<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg" font-family="Arial">
  <rect x="0" y="0" width="500" height="300" rx="15" ry="15" fill="#D4AF37" /><linearGradient id="goldGradient" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#FFD700" /><stop offset="25%" stop-color="#FFDF00" /><stop offset="50%" stop-color="#D4AF37" /><stop offset="75%" stop-color="#CFB53B" /><stop offset="100%" stop-color="#C5B358" /></linearGradient><rect x="0" y="0" width="500" height="300" rx="15" ry="15" fill="url(#goldGradient)" opacity="0.8" /><g opacity="0.2"><rect x="50" y="20" width="400" height="5" fill="#FFFFFF" /><rect x="100" y="40" width="300" height="3" fill="#FFFFFF" /></g>
  <text x="30" y="60" font-size="28" font-weight="bold" fill="#FFFFFF" fill-opacity="0.9">__USER_NAME__</text>
  <text x="30" y="90" font-size="18" fill="#FFFFFF" fill-opacity="0.7">__COMPANY_NAME__</text>
  <text x="470" y="280" text-anchor="end" font-size="16" font-weight="bold" fill="#FFFFFF" fill-opacity="0.6">Tapit.fr</text>
</svg>
`;

export default function CustomizePage() {
    const router = useRouter();
    
    const [products, setProducts] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // --- NEW STATE for customization ---
    const [userName, setUserName] = useState("Your Name");
    const [companyName, setCompanyName] = useState("Your Company");
    const [displaySvg, setDisplaySvg] = useState(BASE_SVG_TEMPLATE);

    useEffect(() => {
        const getProducts = async () => {
            const fetchedProducts = await fetchProducts();
            setProducts(fetchedProducts);
            // Pre-select the first product for a better UX
            if (fetchedProducts.length > 0) {
                setSelectedProduct(fetchedProducts[0]);
            }
            setIsLoading(false);
        };
        getProducts();
    }, []);

    // --- NEW useEffect to update the SVG preview in real-time ---
    useEffect(() => {
        let updatedSvg = BASE_SVG_TEMPLATE;
        // In a real app, you'd get the template from `selectedProduct.templateSvg`
        
        updatedSvg = updatedSvg.replace('__USER_NAME__', userName || "Your Name");
        updatedSvg = updatedSvg.replace('__COMPANY_NAME__', companyName || "Your Company");
        
        setDisplaySvg(updatedSvg);
    }, [userName, companyName, selectedProduct]); // Re-run when inputs or product change

    const handleProceedToCheckout = async () => {
        const userId = testForActiveSession(true);
        if (!userId) {
            toast.error("Please log in to customize a card.");
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
                customName: userName.trim(), // Using the user's name as the card name
                companyName: companyName.trim(),
                createdAt: serverTimestamp(),
                linkedProfile: userId,
                // --- NEW: Store the final, customized SVG string ---
                customizedSvg: displaySvg,
            };

            const newCardDoc = await addDoc(userCardsCollectionRef, newCardData);
            toast.dismiss(loadingToast);
            toast.success("Card saved! Redirecting to checkout...");

            sessionStorage.setItem('cartItem', JSON.stringify({ cardId: newCardDoc.id, price: selectedProduct.price }));

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
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
                {/* Left Side: Inputs */}
                <div>
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 1: Personalize Your Card</h1>
                        <p className="text-gray-600">Enter the details you want to appear on the card.</p>
                        <div className="mt-6 space-y-4">
                            <div>
                                <label htmlFor="userName" className="block text-sm font-medium text-gray-700">Name</label>
                                <input type="text" id="userName" value={userName} onChange={(e) => setUserName(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-themeGreen"/>
                            </div>
                            <div>
                                <label htmlFor="companyName" className="block text-sm font-medium text-gray-700">Company / Title</label>
                                <input type="text" id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-themeGreen"/>
                            </div>
                        </div>
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">Step 2: Choose Card Type</h2>
                        <p className="text-gray-600">The design will adapt to the card you select.</p>
                        <div className="space-y-4 mt-6">
                            {products.map((product) => (
                                <div key={product.id} onClick={() => setSelectedProduct(product)} className={`p-4 bg-white rounded-lg border-2 flex items-center gap-4 cursor-pointer transition-all ${selectedProduct?.id === product.id ? 'border-themeGreen shadow-md' : 'border-gray-200'}`}>
                                    <Image src={product.image} alt={product.name} width={100} height={60} className="rounded-md object-cover"/>
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{product.name}</h3>
                                        <p className="text-lg font-bold text-gray-900">${product.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Side: Preview & Checkout */}
                <div className="sticky top-32 h-fit">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Live Preview</h2>
                    {/* --- NEW: SVG Preview using dangerouslySetInnerHTML --- */}
                    <div
                        className="w-full aspect-[500/300] bg-gray-100 rounded-lg overflow-hidden shadow-lg"
                        dangerouslySetInnerHTML={{ __html: displaySvg }}
                    />
                    
                    <button
                        onClick={handleProceedToCheckout}
                        disabled={isSaving || !selectedProduct}
                        className="w-full mt-8 bg-themeGreen text-white px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 active:scale-95 transition-transform disabled:bg-gray-400"
                    >
                        {isSaving ? "Saving..." : `Save & Proceed to Checkout ($${selectedProduct?.price || '0.00'})`}
                    </button>
                </div>
            </div>
        </div>
    );
}