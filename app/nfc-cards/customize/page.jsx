// app/nfc-cards/customize/page.jsx - FIXED TO WORK WITH YOUR FIREBASE CONFIG
"use client"

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Toaster, toast } from "react-hot-toast";
import Image from "next/image";

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
    const [qrCodeDataUrl, setQrCodeDataUrl] = useState("");

    // ✅ FIXED: Use your existing Firebase exports
    useEffect(() => {
        const initializePage = async () => {
            try {
                console.log('🔄 Starting Firebase initialization...');

                // Check if running on client side
                if (typeof window === 'undefined') {
                    console.log('❌ Not on client side, skipping initialization');
                    return;
                }

                // ✅ Import authentication first
                const { testForActiveSession } = await import('@/lib/authentication/testForActiveSession');
                
                // Check authentication
                const currentUserId = testForActiveSession(true);
                console.log('👤 User ID:', currentUserId);
                setUserId(currentUserId);

                // ✅ Use your existing Firebase exports - fireApp is already the Firestore instance
                const { fireApp } = await import('@/important/firebase');
                
                if (!fireApp) {
                    throw new Error('Firestore is not initialized');
                }
                
                console.log('✅ Firestore imported:', !!fireApp);

                // ✅ Import Firestore functions
                const { collection, getDocs } = await import('firebase/firestore');

                console.log('🔄 Fetching products...');
                
                // ✅ FIXED: Use "products" collection (not "NFCProducts")
                const productsRef = collection(fireApp, "products");
                const querySnapshot = await getDocs(productsRef);
                
                const fetchedProducts = [];
                querySnapshot.forEach((doc) => {
                    fetchedProducts.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });

                console.log('✅ Products fetched:', fetchedProducts.length);
                setProducts(fetchedProducts);
                
                if (fetchedProducts.length > 0) {
                    const firstProduct = fetchedProducts[0];
                    handleProductSelect(firstProduct); 
                }
            } catch (error) {
                console.error("❌ Error initializing page:", error);
                console.error("Error details:", {
                    message: error.message,
                    stack: error.stack,
                    name: error.name
                });
                
                toast.error(`Failed to load products: ${error.message}`);
                setProducts([]);
            } finally {
                setIsLoading(false);
            }
        };

        // Add small delay to ensure DOM is ready
        const timeoutId = setTimeout(initializePage, 100);
        
        return () => clearTimeout(timeoutId);
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
        
        // ✅ NEW: Handle QR code replacement
        if (userId && qrCodeDataUrl) {
            // User is logged in and QR code is available
            updatedSvg = updatedSvg.replace(/__QR_CODE_DATA_URL__/g, qrCodeDataUrl);
            updatedSvg = updatedSvg.replace(/__QR_FALLBACK_DISPLAY__/g, "none");
        } else {
            // User not logged in or QR code not ready
            updatedSvg = updatedSvg.replace(/__QR_CODE_DATA_URL__/g, "");
            updatedSvg = updatedSvg.replace(/__QR_FALLBACK_DISPLAY__/g, "block");
        }
        
        setDisplaySvg(updatedSvg);
    }, [customValues, selectedProduct, logoUrl, userId, qrCodeDataUrl]);

    // ✅ NEW: Generate QR code when user is logged in
    useEffect(() => {
        const generateQRCode = async () => {
            if (!userId) {
                setQrCodeDataUrl("");
                return;
            }

            try {
                // Import QRCode dynamically to avoid SSR issues
                const QRCode = (await import('qrcode.react')).default;
                const React = (await import('react')).default;
                const { createRoot } = await import('react-dom/client');

                // Create a temporary container
                const tempContainer = document.createElement('div');
                tempContainer.style.position = 'absolute';
                tempContainer.style.left = '-9999px';
                document.body.appendChild(tempContainer);

                // Create React root and render QR code
                const root = createRoot(tempContainer);
                
                // Construct the user's profile URL (adjust this to match your app's URL structure)
                const userProfileUrl = `${window.location.origin}/profile/${userId}`;
                
                // Create a promise to get the canvas data
                const getQRCodeDataUrl = () => {
                    return new Promise((resolve) => {
                        // Render QR code component
                        root.render(
                            React.createElement(QRCode, {
                                value: userProfileUrl,
                                size: 60,
                                level: 'M',
                                onLoad: () => {
                                    // Small delay to ensure rendering is complete
                                    setTimeout(() => {
                                        const canvas = tempContainer.querySelector('canvas');
                                        if (canvas) {
                                            const dataUrl = canvas.toDataURL('image/png');
                                            resolve(dataUrl);
                                        } else {
                                            resolve("");
                                        }
                                    }, 100);
                                }
                            })
                        );
                        
                        // Fallback timeout
                        setTimeout(() => {
                            const canvas = tempContainer.querySelector('canvas');
                            if (canvas) {
                                const dataUrl = canvas.toDataURL('image/png');
                                resolve(dataUrl);
                            } else {
                                resolve("");
                            }
                        }, 500);
                    });
                };

                const dataUrl = await getQRCodeDataUrl();
                setQrCodeDataUrl(dataUrl);

                // Cleanup
                root.unmount();
                document.body.removeChild(tempContainer);

            } catch (error) {
                console.error('Error generating QR code:', error);
                setQrCodeDataUrl("");
            }
        };

        generateQRCode();
    }, [userId]);

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
            console.log('🔄 Starting save process...');

            // ✅ Use your existing Firebase exports
            const { fireApp } = await import('@/important/firebase');
            
            if (!fireApp) {
                throw new Error('Firestore is not available');
            }

            const { collection, addDoc, serverTimestamp } = await import('firebase/firestore');

            console.log('🔄 Creating user cards collection reference...');
            // fireApp is already the Firestore instance
            const userCardsRef = collection(fireApp, "AccountData", userId, "userCards");
            
            const newCardData = {
                productId: selectedProduct.id,
                productName: selectedProduct.name,
                customizedData: customValues,
                logoUrl: logoUrl,
                createdAt: serverTimestamp(),
                linkedProfile: userId,
                customizedSvg: displaySvg,
            };
            
            console.log('🔄 Saving card data...');
            const newCardDoc = await addDoc(userCardsRef, newCardData);
            console.log('✅ Card saved with ID:', newCardDoc.id);
            
            toast.dismiss(loadingToast);
            toast.success("Card saved! Proceeding to checkout...");

            // Store cart item in sessionStorage
            sessionStorage.setItem('cartItem', JSON.stringify({ 
                cardId: newCardDoc.id, 
                price: selectedProduct.price 
            }));
            
            setTimeout(() => router.push('/nfc-cards/checkout'), 1500);

        } catch (error) {
            console.error("❌ Error saving card:", error);
            console.error("Save error details:", {
                message: error.message,
                stack: error.stack
            });
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
                <div>Loading products from Firebase...</div>
            </div>
        );
    }

    if (products.length === 0) {
        return (
            <div className="pt-32 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">No products found</h1>
                <p className="text-gray-600">Please check your Firebase connection or add products to the NFCProducts collection</p>
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

                    {/* ✅ NEW: QR Code Info Section */}
                    <div className="mt-6">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            QR Code
                        </label>
                        {userId ? (
                            <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                                <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-green-800">QR Code Active</p>
                                    <p className="text-xs text-green-600">Links to your TapIt profile</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center">
                                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <p className="text-sm font-medium text-blue-800">Login Required for QR Code</p>
                                    <p className="text-xs text-blue-600">QR code will link to your profile after login</p>
                                </div>
                            </div>
                        )}
                    </div>

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

    // ✅ ENHANCED: Logo Uploader Component - PER CARD (not per user)
function LogoUploader({ userId, onUploadStart, onUploadComplete, isUploading }) {
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Validate file
        if (!file.type.startsWith('image/')) {
            toast.error('Please select an image file');
            return;
        }

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast.error('Image size must be less than 5MB');
            return;
        }

        // Show preview immediately
        setPreview(URL.createObjectURL(file));
        onUploadStart();

        try {
            console.log('🔄 Starting logo upload...');

            // ✅ Use your existing Firebase Storage export
            const { appStorage } = await import('@/important/firebase');
            
            if (!appStorage) {
                throw new Error('Firebase Storage is not available');
            }

            const { ref, uploadBytes, getDownloadURL } = await import('firebase/storage');

            console.log('🔄 Creating storage reference...');
            // ✅ ENHANCED: Create unique filename per card design session
            const uniqueId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const fileName = `logo_${uniqueId}.${file.name.split('.').pop()}`;
            const storageRef = ref(appStorage, `nfc-logos/${fileName}`);
            
            console.log('🔄 Uploading file...');
            const snapshot = await uploadBytes(storageRef, file);
            
            console.log('🔄 Getting download URL...');
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            console.log('✅ Logo uploaded successfully:', downloadURL);
            onUploadComplete(downloadURL);
        } catch (error) {
            console.error('❌ Logo upload failed:', error);
            console.error("Upload error details:", {
                message: error.message,
                stack: error.stack
            });
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
                
                {/* ✅ NEW: Clear logo button */}
                {preview && (
                    <button
                        type="button"
                        onClick={() => {
                            setPreview(null);
                            onUploadComplete("");
                            if (fileInputRef.current) {
                                fileInputRef.current.value = "";
                            }
                        }}
                        disabled={isUploading}
                        className="px-3 py-2 text-sm text-red-600 hover:text-red-800 disabled:opacity-50"
                    >
                        Remove
                    </button>
                )}
            </div>
            
            <p className="text-xs text-gray-500 mt-2">
                PNG, JPG, or SVG. Max 5MB.
            </p>
        </div>
    );
}