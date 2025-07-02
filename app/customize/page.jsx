// app/nfc-cards/customize/page.jsx
"use client"
import Link from "next/link";
import { useRouter } from "next/navigation";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { useEffect, useState } from "react";

export default function CustomizePage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const session = testForActiveSession();
            setIsLoggedIn(!!session);
        } catch (error) {
            setIsLoggedIn(false);
        }
        setIsLoading(false);
    }, []);

    const handleCheckout = () => {
        if (isLoggedIn) {
            router.push('/nfc-cards/checkout');
        } else {
            router.push('/login');
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-8">Customize Your NFC Card</h1>
                
                <div className="space-y-4">
                    <button 
                        onClick={handleCheckout}
                        className="bg-green-600 text-white px-8 py-4 rounded-lg hover:bg-green-700 transition-colors text-lg font-semibold block mx-auto"
                    >
                        {isLoggedIn ? 'Proceed to Checkout' : 'Login to Checkout'}
                    </button>
                    
                    <Link 
                        href="/nfc-cards" 
                        className="text-gray-600 hover:text-gray-800 transition-colors block"
                    >
                        ← Back to NFC Cards
                    </Link>
                </div>
            </div>
        </div>
    );
}