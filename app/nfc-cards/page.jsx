
// app/nfc-cards/page.jsx
import Link from "next/link";

export const generateMetadata = () => {
    return {
        title: "TapIt | NFC Cards",
        description: "NFC Cards page"
    }
}

export default function NFCCardsPage() {
    return (
        <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
                <h1 className="text-4xl font-bold mb-8">NFC Cards</h1>
                
                <Link 
                    href="/nfc-cards/customize" 
                    className="bg-blue-600 text-white px-8 py-4 rounded-lg hover:bg-blue-700 transition-colors text-lg font-semibold"
                >
                    Customize Your Card
                </Link>
            </div>
        </div>
    );
}