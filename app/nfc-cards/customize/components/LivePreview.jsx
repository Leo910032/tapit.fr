"use client";

export default function LivePreview({
    displaySvg,
    isSaving,
    selectedProduct,
    onProceedToCheckout
}) {
    return (
        <div className="sticky top-32 h-fit">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Live Preview</h2>
            <div
                className="w-full aspect-[500/300] bg-gray-100 rounded-lg overflow-hidden shadow-lg"
                dangerouslySetInnerHTML={{ __html: displaySvg }}
            />
            
            <button
                onClick={onProceedToCheckout}
                disabled={isSaving || !selectedProduct}
                className="w-full mt-8 bg-themeGreen text-white px-8 py-4 rounded-lg font-semibold text-lg hover:scale-105 active:scale-95 transition-transform disabled:bg-gray-400"
            >
                {isSaving ? "Saving..." : `Save & Proceed to Checkout ($${selectedProduct?.price || '0.00'})`}
            </button>
        </div>
    );
}