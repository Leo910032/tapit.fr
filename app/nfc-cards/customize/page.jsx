// app/nfc-cards/customize/page.jsx - FIXED VERSION
"use client"

// ✅ FIXED: Add missing import for useRef
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import Image from "next/image";

// ✅ FIXED: Import utilities and functions
import { fetchProducts } from "@/lib/fetch data/fetchProducts";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { saveCustomCard, uploadLogo } from '@/lib/nfc/firebaseUtils';

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

    // ✅ FIXED: Initialize everything on mount
    useEffect(() => {
        const initializePage = async () => {
            try {
                // Check authentication
                const currentUserId = testForActiveSession(true);
                setUserId(currentUserId);

                // Fetch products
                const fetchedProducts = await fetchProducts();
                setProducts(fetchedProducts);
                
                if (fetchedProducts.length > 0) {
                    const firstProduct = fetchedProducts[0];
                    handleProductSelect(firstProduct); 
                }
            } catch (error) {
                console.error("Error initializing page:", error);
                toast.error("Failed to load products");
            } finally {
                setIsLoading(false);
            }
        };

        initializePage();
    }, []);

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

        // Replace the logo placeholder
        updatedSvg = updatedSvg.replace(/__LOGO_HREF__/g, logoUrl || "");
        
        setDisplaySvg(updatedSvg);
    }, [customValues, selectedProduct, logoUrl]);

    const handleCustomValueChange = (fieldId, value) => {
        setCustomValues(prev => ({ ...prev, [fieldId]: value }));
    };
    
    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        const initialValues = {};
        product.customizableFields?.forEach(field => {
            initialValues[field.id] = field.defaultValue || '';
        });
        setCustomValues(initialValues);
    };
    
    const handleProceedToCheckout = async () => {
        if (!userId) {
            toast.error("Please log in to continue");
            router.push('/nfc-cards/login?returnUrl=/nfc-cards/customize');
            return;
        }

        setIsSaving(true);
        const loadingToast = toast.loading("Saving your custom card...");

        try {
            // ✅ FIXED: Use utility function instead of direct Firebase calls
            const cardData = {
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                customizedData: customValues,
                logoUrl: logoUrl,
                customizedSvg: displaySvg,
            };
            
            const result = await saveCustomCard(userId, cardData);
            
            if (result.success) {
                toast.dismiss(loadingToast);
                toast.success("Card saved! Proceeding to checkout...");

                // Store cart item in sessionStorage
                sessionStorage.setItem('cartItem', JSON.stringify({ 
                    cardId: result.cardId, 
                    price: selectedProduct.price 
                }));
                
                setTimeout(() => router.push('/nfc-cards/checkout'), 1500);
            } else {
                throw new Error('Failed to save card');
            }

        } catch (error) {
            console.error("❌ Error saving card:", error);
            toast.dismiss(loadingToast);
            toast.error(error.message || "Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    if (isLoading) {
        return (
            <div className="pt-32 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-themeGreen mx-auto mb-4"></div>
                <div>Loading products...</div>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 pt-32 pb-16">
            <Toaster position="bottom-center" />
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
                
                {/* Left side: Customization Form */}
                <div>
                    {/* Step 1: Personalization */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                            Step 1: Personalize Your Card
                        </h1>
                        <p className="text-gray-600">
                            Enter the details you want to appear on the card.
                        </p>
                        
                        <div className="mt-6 space-y-4">
                            {selectedProduct?.customizableFields?.map(field => (
                                <div key={field.id}>
                                    <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">
                                        {field.label}
                                    </label>
                                    <input
                                        type="text"
                                        id={field.id}
                                        placeholder={field.placeholder}
                                        value={customValues[field.id] || ''}
                                        onChange={(e) => handleCustomValueChange(field.id, e.target.value)}
                                        className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-themeGreen focus:border-transparent"
                                    />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Logo Upload Section */}
                    <LogoUploader
                        userId={userId}
                        isUploading={isUploading}
                        onUploadStart={() => setIsUploading(true)}
                        onUploadComplete={(url) => {
                            if (url) {
                                setLogoUrl(url);
                                toast.success("Logo uploaded successfully!");
                            } else {
                                toast.error("Logo upload failed.");
                            }
                            setIsUploading(false);
                        }}
                    />

                    {/* Step 2: Product Selection */}
                    <div className="mt-8">
                        <h2 className="text-3xl font-bold text-gray-900 mb-2">
                            Step 2: Choose Card Type
                        </h2>
                        <p className="text-gray-600">
                            The design will adapt to the card you select.
                        </p>
                        
                        <div className="space-y-4 mt-6">
                            {products.map((product) => (
                                <div 
                                    key={product.id} 
                                    onClick={() => handleProductSelect(product)} 
                                    className={`p-4 bg-white rounded-lg border-2 flex items-center gap-4 cursor-pointer transition-all ${
                                        selectedProduct?.id === product.id 
                                            ? 'border-themeGreen shadow-md' 
                                            : 'border-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    <Image 
                                        src={product.image} 
                                        alt={product.name} 
                                        width={100} 
                                        height={60} 
                                        className="rounded-md object-cover"
                                    />
                                    <div>
                                        <h3 className="font-semibold text-gray-800">{product.name}</h3>
                                        <p className="text-lg font-bold text-gray-900">${product.price}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
                
                {/* Right side: Live Preview */}
                <div className="sticky top-32 h-fit">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Live Preview</h2>
                    
                    <div
                        className="w-full aspect-[500/300] bg-gray-100 rounded-lg overflow-hidden shadow-lg border"
                        dangerouslySetInnerHTML={{ __html: displaySvg }}
                    />
                    
                    <button
                        onClick={handleProceedToCheckout}
                        disabled={isSaving || !selectedProduct}
                        className="w-full mt-8 bg-themeGreen text-white px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 active:scale-95 transition-transform disabled:bg-gray-400 disabled:cursor-not-allowed"
                    >
                        {isSaving ? (
                            <div className="flex items-center justify-center">
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                Saving...
                            </div>
                        ) : (
                            `Save & Proceed to Checkout ($${selectedProduct?.price || '0.00'})`
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ✅ FIXED: Simplified Logo Uploader Component
function LogoUploader({ userId, onUploadStart, onUploadComplete, isUploading }) {
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Show preview immediately
        setPreview(URL.createObjectURL(file));
        onUploadStart();

        try {
            // ✅ FIXED: Use utility function
            const result = await uploadLogo(file, userId);
            
            if (result.success) {
                onUploadComplete(result.url);
            } else {
                throw new Error('Upload failed');
            }
        } catch (error) {
            console.error('Logo upload failed:', error);
            toast.error(error.message || 'Failed to upload logo');
            onUploadComplete(null);
        }
    };

    return (
        <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                Company Logo (Optional)
            </label>
            
            <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden border">
                    {preview ? (
                        <Image 
                            src={preview} 
                            alt="Logo preview" 
                            width={80} 
                            height={80} 
                            className="object-contain" 
                        />
                    ) : (
                        <span className="text-xs text-gray-400">No Logo</span>
                    )}
                </div>
                
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/svg+xml"
                    className="hidden"
                />
                
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isUploading ? 'Uploading...' : 'Choose File'}
                </button>
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, or SVG. Max 5MB.
            </p>
        </div>
    );
}