// app/nfc-cards/checkout/page.jsx - TEST VERSION
"use client"
import { useEffect } from "react";
import Link from "next/link";
import LandingNav from "@/app/components/General Components/LandingNav";

export default function CheckoutPage() {
    useEffect(() => {
        console.log("🟢 CHECKOUT PAGE LOADED - No redirect happened");
        
        // Check what's in sessionStorage/localStorage
        console.log("Session data:", {
            adminLinker: document.cookie.includes('adminLinker'),
            localStorage: typeof window !== 'undefined' ? Object.keys(localStorage) : 'none',
            sessionStorage: typeof window !== 'undefined' ? Object.keys(sessionStorage) : 'none'
        });
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <LandingNav />
            
            <div className="container mx-auto px-4 pt-32 pb-16">
                <div className="max-w-2xl mx-auto text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-8">
                        🟢 SUCCESS - Checkout Page Loaded
                    </h1>
                    
                    <p className="text-lg text-gray-600 mb-12">
                        If you can see this, the redirect is NOT coming from this page
                    </p>

                    <div className="bg-white p-8 rounded-lg shadow-sm mb-8">
                        <p className="text-gray-500 mb-4">
                            This is a test version with no authentication checks
                        </p>
                        <p className="text-sm text-blue-600">
                            Check the browser console for debug info
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