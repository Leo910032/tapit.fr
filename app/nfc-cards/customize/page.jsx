// app/nfc-cards/customize/page.jsx
import Link from "next/link";
import LandingNav from "@/app/components/General Components/LandingNav";

export const generateMetadata = () => {
    return {
        title: "TapIt | Customize NFC Card",
        description: "Customize your NFC card design"
    }
}

export default function CustomizePage() {
    return (
        <div className="min-h-screen bg-gray-50">
            <LandingNav />
            
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
                        <Link 
                            href="/nfc-cards/checkout"
                            className="block w-full bg-themeGreen text-white px-8 py-4 rounded-lg font-semibold hover:scale-105 active:scale-95 transition-transform text-center"
                        >
                            Proceed to Checkout
                        </Link>
                        
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