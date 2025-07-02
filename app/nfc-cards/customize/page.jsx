// app/nfc-cards/customize/page.jsx
"use client"
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import NFCLandingNav from "@/app/components/General Components/NFCLandingNav";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";

export default function CustomizePage() {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const router = useRouter();

    useEffect(() => {
        // Check if user is logged in
        const userId = testForActiveSession();
        setIsLoggedIn(!!userId);
        setIsLoading(false);
    }, []);

    const handleCheckout = () => {
        if (isLoggedIn) {
            router.push('/nfc-cards/checkout');
        } else {
            // Redirect to login with return URL
            router.push('/nfc-cards/login');
        }
    };

 if (isLoading) {
    return (
        <div className="min-h-screen bg-gray-50">
            <NFCLandingNav />
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div>Loading...</div>
            </div>
        </div>
    );
}


    return (
        <div className="min-h-screen bg-gray-50">
            <NFCLandingNav />
            
            <div className="container mx-auto px-4 pt-32 pb-16">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">
                        Customize Your NFC Card
                    </h1>
                    
                    <p className="text-lg text-gray-600 mb-12">
                        Design your perfect NFC card (customization options will be added here)
                    </p>

                    {/* Placeholder for customization options */}
                    <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
                        <p className="text-gray-500">
                            Customization options will be added here
                        </p>
                    </div>
                    
                    <div className="space-y-4">
                        <button 
                            onClick={handleCheckout}
                            className="w-full bg-themeGreen text-white px-8 py-4 rounded-lg font-semibold hover:scale-105 active:scale-95 transition-transform"
                        >
                            {isLoggedIn ? 'Proceed to Checkout' : 'Login to Checkout'}
                        </button>
                        
                        <Link 
                            href="/nfc-cards" 
                            className="block text-gray-600 hover:text-gray-800"
                        >
                            ← Back to NFC Cards
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}