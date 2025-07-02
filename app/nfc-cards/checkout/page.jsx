// app/nfc-cards/checkout/page.jsx
"use client"
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import LandingNav from "@/app/components/General Components/LandingNav";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";

export default function CheckoutPage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in
        const userId = testForActiveSession();
        if (!userId) {
            router.push('/nfc-cards/login');
            return;
        }
        setIsLoggedIn(true);
        setIsLoading(false);
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return null; // Will redirect
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <LandingNav />
            
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
                            Checkout form will be added here
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