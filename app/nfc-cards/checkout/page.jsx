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
        setIsLoggedIn(!!userId);
        setIsLoading(false);
        console.log("Auth check:", !!userId); // Debug log
    };

    useEffect(() => {
        checkAuthStatus();
        
        // Listen for authentication events
        const handleStorageChange = () => {
            console.log("Storage changed, rechecking auth"); // Debug log
            checkAuthStatus();
        };

        // Listen for session storage changes
        window.addEventListener('storage', handleStorageChange);
        
        // Also check periodically in case of modal auth
        const interval = setInterval(checkAuthStatus, 1000);
        
        return () => {
            window.removeEventListener('storage', handleStorageChange);
            clearInterval(interval);
        };
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    // If not logged in, show login/signup options
    if (!isLoggedIn) {
        return (
            <div className="min-h-screen bg-gray-50">
                <NFCLandingNav />
                
                <div className="container mx-auto px-4 pt-32 pb-16">
                    <div className="max-w-2xl mx-auto text-center">
                        <h1 className="text-4xl font-bold text-gray-900 mb-8">
                            Almost There!
                        </h1>
                        
                        <p className="text-lg text-gray-600 mb-12">
                            Please log in or create an account to complete your NFC card purchase
                        </p>

                        <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
                            <p className="text-gray-500 mb-4">
                                You need to be logged in to checkout
                            </p>
                            <p className="text-sm text-gray-400">
                                Use the login/signup buttons in the navigation above
                            </p>
                        </div>
                        
                        <Link 
                            href="/nfc-cards/customize" 
                            className="block text-gray-600 hover:text-gray-800"
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
                        Checkout
                    </h1>
                    
                    <p className="text-lg text-gray-600 mb-12">
                        Complete your NFC card purchase
                    </p>

                    {/* Placeholder for checkout form */}
                    <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
                        <p className="text-gray-500 mb-4">
                            ✅ You are logged in! Checkout form will be added here
                        </p>
                        <p className="text-sm text-gray-400">
                            (Payment processing, shipping details, etc.)
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <button 
                            className="w-full bg-themeGreen text-white px-8 py-4 rounded-lg font-semibold hover:scale-105 active:scale-95 transition-transform"
                            onClick={() => alert('Payment processing will be implemented here')}
                        >
                            Complete Purchase
                        </button>
                        
                        <Link 
                            href="/nfc-cards/customize" 
                            className="block text-gray-600 hover:text-gray-800"
                        >
                            ← Back to Customize
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}