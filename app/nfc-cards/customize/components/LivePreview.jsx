// app/nfc-cards/customize/components/LivePreview.jsx - UPDATED WITH FRONT/BACK TOGGLE
"use client";

export default function LivePreview({
    displaySvg,
    isSaving,
    selectedProduct,
    currentView,
    onViewChange,
    onProceedToCheckout
}) {
    return (
        <div className="sticky top-32 h-fit">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-gray-900">Live Preview</h2>
                
                {/* Front/Back Toggle */}
                <div className="flex bg-gray-100 rounded-lg p-1">
                    <button
                        onClick={() => onViewChange("front")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            currentView === "front"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Front
                    </button>
                    <button
                        onClick={() => onViewChange("back")}
                        className={`px-4 py-2 text-sm font-medium rounded-md transition-all ${
                            currentView === "back"
                                ? "bg-white text-gray-900 shadow-sm"
                                : "text-gray-600 hover:text-gray-900"
                        }`}
                    >
                        Back
                    </button>
                </div>
            </div>
            
            {/* Card Preview */}
            <div className="relative">
                <div
                    className="w-full aspect-[500/300] bg-gray-100 rounded-lg overflow-hidden shadow-lg border"
                    dangerouslySetInnerHTML={{ __html: displaySvg }}
                />
                
                {/* View indicator */}
                <div className="absolute top-3 left-3">
                    <span className="bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded-full">
                        {currentView === "front" ? "Front Side" : "Back Side"}
                    </span>
                </div>
            </div>
            
            {/* Description */}
            <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                <p className="text-sm text-blue-800">
                    {currentView === "front" 
                        ? "✨ Front: Clean design with your logo and TapIt branding"
                        : "📇 Back: Complete contact info, QR code, and all details"
                    }
                </p>
            </div>
            
            {/* Checkout Button */}
            <button
                onClick={onProceedToCheckout}
                disabled={isSaving || !selectedProduct}
                className="w-full mt-6 bg-themeGreen text-white px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 active:scale-95 transition-transform disabled:bg-gray-400 disabled:cursor-not-allowed"
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
    );
}