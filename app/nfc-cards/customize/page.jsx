// app/nfc-cards/customize/page.jsx - REFACTORED WITH COMPONENTS
"use client"

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";

// Import custom components
import CustomizationForm from "./components/CustomizationForm";
import LivePreview from "./components/LivePreview";
import QRCodeGenerator from "./components/QRCodeGenerator";
import FirebaseService from "./utils/FirebaseService";

const DEFAULT_SVG = `<svg viewBox="0 0 500 300" xmlns="http://www.w3.org/2000/svg"><rect width="500" height="300" rx="15" fill="#e5e7eb"/><text x="250" y="150" text-anchor="middle" font-family="Arial" font-size="20" fill="#9ca3af">Loading products...</text></svg>`;

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
    const [username, setUsername] = useState(null);
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");
    const [currentView, setCurrentView] = useState("front");

    // Initialize Firebase and load data
    useEffect(() => {
        const initializePage = async () => {
            try {
                console.log('🔄 Starting Firebase initialization...');

                if (typeof window === 'undefined') {
                    console.log('❌ Not on client side, skipping initialization');
                    return;
                }

                // Get user authentication
                const { currentUserId, userUsername } = await FirebaseService.initializeAuth();
                setUserId(currentUserId);
                setUsername(userUsername);

                // Fetch products
                const fetchedProducts = await FirebaseService.fetchProducts();
                setProducts(fetchedProducts);
                
                if (fetchedProducts.length > 0) {
                    handleProductSelect(fetchedProducts[0]);
                }
            } catch (error) {
                console.error("❌ Error initializing page:", error);
                toast.error(`Failed to load products: ${error.message}`);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        const timeoutId = setTimeout(initializePage, 100);
        return () => clearTimeout(timeoutId);
    }, []);

    // Update SVG preview when data changes
    useEffect(() => {
        if (!selectedProduct) {
            setDisplaySvg(DEFAULT_SVG);
            return;
        }
        
        const templateSvg = currentView === "front" 
            ? selectedProduct.templateSvg 
            : selectedProduct.backTemplateSvg || selectedProduct.templateSvg;
        
        if (!templateSvg) {
            setDisplaySvg(DEFAULT_SVG);
            return;
        }
        
        let updatedSvg = templateSvg;
        
        // Replace text placeholders (only for back side now)
        if (currentView === "back") {
            selectedProduct.customizableFields?.forEach(field => {
                const value = customValues[field.id] || '';
                updatedSvg = updatedSvg.replace(new RegExp(field.placeholderKey, 'g'), value);
            });
        }

        // Replace logo placeholder (both sides)
        updatedSvg = updatedSvg.replace(/__LOGO_HREF__/g, logoUrl || "");
        
        // Handle QR code replacement
        if (userId && username && qrCodeDataUrl) {
            updatedSvg = updatedSvg.replace(/__QR_CODE_DATA_URL__/g, qrCodeDataUrl);
            updatedSvg = updatedSvg.replace(/__QR_FALLBACK_DISPLAY__/g, "none");
        } else {
            updatedSvg = updatedSvg.replace(/__QR_CODE_DATA_URL__/g, "");
            updatedSvg = updatedSvg.replace(/__QR_FALLBACK_DISPLAY__/g, "block");
        }
        
        setDisplaySvg(updatedSvg);
    }, [customValues, selectedProduct, logoUrl, userId, username, qrCodeDataUrl, currentView]);

    // Event handlers
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

    const handleLogoUpload = (url) => {
        if (url) {
            setLogoUrl(url);
            toast.success("Logo uploaded successfully!");
        } else {
            toast.error("Logo upload failed.");
        }
        setIsUploading(false);
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
            const cardId = await FirebaseService.saveCustomCard({
                userId,
                selectedProduct,
                customValues,
                logoUrl,
                displaySvg
            });
            
            toast.dismiss(loadingToast);
            toast.success("Card saved! Proceeding to checkout...");

            sessionStorage.setItem('cartItem', JSON.stringify({ 
                cardId, 
                price: selectedProduct.price 
            }));
            
            setTimeout(() => router.push('/nfc-cards/checkout'), 1500);

        } catch (error) {
            console.error("❌ Error saving card:", error);
            toast.dismiss(loadingToast);
            toast.error(error.message || "Something went wrong. Please try again.");
        } finally {
            setIsSaving(false);
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="pt-32 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-themeGreen mx-auto mb-4"></div>
                <div>Loading products from Firebase...</div>
            </div>
        );
    }

    // No products state
    if (products.length === 0) {
        return (
            <div className="pt-32 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">No products found</h1>
                <p className="text-gray-600">Please check your Firebase connection or add products to the products collection</p>
                <button 
                    onClick={() => window.location.reload()} 
                    className="mt-4 px-4 py-2 bg-themeGreen text-white rounded-lg hover:bg-green-600"
                >
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-4 pt-32 pb-16">
            <Toaster position="bottom-center" />
            
            {/* QR Code Generator (hidden component) */}
            <QRCodeGenerator 
                userId={userId}
                username={username}
                onQRCodeGenerated={setQrCodeDataUrl}
            />
            
            <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-12">
                
                {/* Left side: Customization Form */}
                <CustomizationForm
                    products={products}
                    selectedProduct={selectedProduct}
                    customValues={customValues}
                    userId={userId}
                    logoUrl={logoUrl}
                    isUploading={isUploading}
                    onProductSelect={handleProductSelect}
                    onCustomValueChange={handleCustomValueChange}
                    onLogoUploadStart={() => setIsUploading(true)}
                    onLogoUploadComplete={handleLogoUpload}
                />
                
                {/* Right side: Live Preview */}
                <LivePreview
                    displaySvg={displaySvg}
                    isSaving={isSaving}
                    selectedProduct={selectedProduct}
                    currentView={currentView}
                    onViewChange={setCurrentView}
                    onProceedToCheckout={handleProceedToCheckout}
                />
            </div>
        </div>
    );
}