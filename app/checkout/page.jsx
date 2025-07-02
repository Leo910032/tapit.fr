// app/nfc-cards/checkout/page.jsx
"use client"
import Link from "next/link";
import { testForActiveSession } from "@/lib/authentication/testForActiveSession";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function CheckoutPage() {
    const router = useRouter();
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        try {
            const session = testForActiveSession();
            if (!session) {
                router.push('/login');
                return;
            }
            setIsLoggedIn(true);
        } catch (error) {
            router.push('/login');
            return;
        }
        setIsLoading(false);
    }, [router]);

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div>Loading...</div>
            </div>
        );
    }

    if (!isLoggedIn) {
        return null; // Will redirect to login
    }

    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-8">Checkout</h1>
                <p className="text-gray-600 mb-8">You are logged in and can proceed with checkout!</p>
                
                <Link 
                    href="/nfc-cards/customize" 
                    className="text-gray-600 hover:text-gray-800 transition-colors"
                >
                    ← Back to Customize
                </Link>
            </div>
        </div>
    );
}