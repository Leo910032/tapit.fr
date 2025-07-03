// app/nfc-cards/customize/components/CustomizationForm.jsx - NEW DYNAMIC VERSION
"use client";
import Image from "next/image";

export default function CustomizationForm({
    products,
    selectedProduct,
    customValues,
    onProductSelect,
    onCustomValueChange,
}) {
    return (
        <div>
            {/* Step 1: Personalization Inputs - NOW DYNAMIC */}
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Step 1: Personalize Your Card</h1>
                <p className="text-gray-600">Enter the details you want to appear on the card.</p>
                <div className="mt-6 space-y-4">
                    {/* Loop through fields from Firestore data to generate the form */}
                    {selectedProduct?.customizableFields?.map(field => (
                        <div key={field.id}>
                            <label htmlFor={field.id} className="block text-sm font-medium text-gray-700">{field.label}</label>
                            <input
                                type="text"
                                id={field.id}
                                placeholder={field.placeholder}
                                value={customValues[field.id] || ''}
                                onChange={(e) => onCustomValueChange(field.id, e.target.value)}
                                className="w-full mt-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-themeGreen"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 2: Product Selection */}
            <div>
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Step 2: Choose Card Type</h2>
                <p className="text-gray-600">The design will adapt to the card you select.</p>
                <div className="space-y-4 mt-6">
                    {products.map((product) => (
                        <div key={product.id} onClick={() => onProductSelect(product)} className={`p-4 bg-white rounded-lg border-2 flex items-center gap-4 cursor-pointer transition-all ${selectedProduct?.id === product.id ? 'border-themeGreen shadow-md' : 'border-gray-200'}`}>
                            <Image src={product.image} alt={product.name} width={100} height={60} className="rounded-md object-cover"/>
                            <div>
                                <h3 className="font-semibold text-gray-800">{product.name}</h3>
                                <p className="text-lg font-bold text-gray-900">${product.price}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}