// app/nfc-cards/checkout/page.jsx
"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import NFCLandingNav from "@/app/components/General Components/NFCLandingNav";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";

export default function CheckoutPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    const checkAuthStatus = () => {
        const userId = testForActiveSession();
        const loggedIn = !!userId;
        setIsLoggedIn(loggedIn);
        setIsLoading(false);
        console.log("🔍 Checkout auth check:", loggedIn ? "✅ Logged in" : "❌ Not logged in");
    };

    useEffect(() => {
        console.log("📦 Checkout page mounted");
        checkAuthStatus();
        
        // Listen for authentication events (when modal login succeeds)
        const handleStorageChange = () => {
            console.log("🔄 Storage/session changed, rechecking auth");
            checkAuthStatus();
        };

        // Check for session changes periodically to catch modal authentication
        const interval = setInterval(() => {
            const userId = testForActiveSession();
            const currentlyLoggedIn = !!userId;
            
            if (currentlyLoggedIn !== isLoggedIn) {
                console.log("🔄 Auth status changed:", currentlyLoggedIn ? "Now logged in" : "Now logged out");
                setIsLoggedIn(currentlyLoggedIn);
            }
        }, 1000);
        
        return () => {
            clearInterval(interval);
        };
    }, [isLoggedIn]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="text-center">
                    <div className="text-lg">Loading checkout...</div>
                </div>
            </div>
        );
    }

    // If not logged in, show login/signup prompt
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50">
                <NFCLandingNav />
                
                <div className="container mx-auto px-4 pt-32 pb-16">
                    <div className="max-w-2xl mx-auto text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-8">
                            Almost There! 🔐
                        </h1>
                        
                        <p className="text-lg text-gray-600 mb-12">
                            Please log in or create an account to complete your NFC card purchase
                        </p>

                        <div className="bg-white p-8 rounded-lg shadow-sm mb-8 border-l-4 border-blue-500">
                            <div className="text-left">
                                <h3 className="font-semibold text-gray-800 mb-2">To continue:</h3>
                                <ol className="list-decimal list-inside text-gray-600 space-y-1">
                                    {/* FIX: Replaced quotes with HTML entities */}
                                    <li>Click “Login” or “Sign Up” in the navigation above</li>
                                    <li>Complete authentication in the popup</li>
                                    <li>This page will automatically update to show checkout</li>
                                </ol>
                            </div>
                        </div>
                        
                        <Link 
                            href="/nfc-cards/customize" 
                            className="inline-block text-gray-600 hover:text-gray-800 hover:underline"
                        >
                            ← Back to Customize
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // If logged in, show checkout form
    return (
        <div className="min-h-screen bg-gray-50">
            <NFCLandingNav />
            
            <div className="container mx-auto px-4 pt-32 pb-16">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">
                        Checkout ✅
                    </h1>
                    
                    <p className="text-lg text-gray-600 mb-12">
                        Complete your NFC card purchase
                    </p>

                    {/* Success message */}
                    <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
                        <p className="text-green-800 font-medium">
                            🎉 Successfully authenticated! You can now complete your purchase.
                        </p>
                    </div>

                    {/* Placeholder for checkout form */}
                    <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Order Summary</h3>
                        <div className="text-left space-y-2 text-gray-600">
                            <div className="flex justify-between">
                                <span>Custom NFC Card</span>
                                <span>$25.00</span>
                            </div>
                            <div className="flex justify-between">
                                <span>Shipping</span>
                                <span>$5.00</span>
                            </div>
                            <hr className="my-3" />
                            <div className="flex justify-between font-semibold text-gray-800">
                                <span>Total</span>
                                <span>$30.00</span>
                            </div>
                        </div>
                        <p className="text-sm text-gray-400 mt-4">
                            (Payment processing, shipping details, etc. will be added here)
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <button 
                            className="w-full bg-themeGreen text-white px-8 py-4 rounded-lg font-semibold hover:scale-105 active:scale-95 transition-transform"
                            onClick={() => alert('🚀 Payment processing will be implemented here!\n\nNext steps:\n- Stripe/PayPal integration\n- Shipping form\n- Order confirmation')}
                        >
                            Complete Purchase ($30.00)
                        </button>
                        
                        <Link 
                            href="/nfc-cards/customize" 
                            className="block text-gray-600 hover:text-gray-800 hover:underline"
                        >
                            ← Back to Customize
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}