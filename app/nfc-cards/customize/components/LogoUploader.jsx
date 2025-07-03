"use client";
import { useState, useRef } from 'react';
import Image from 'next/image';
import { uploadLogo } from '@/lib/fileUploads/uploadLogo'; // We will create this file next

export default function LogoUploader({ userId, onUploadStart, onUploadComplete, isUploading }) {
    const [preview, setPreview] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        // Show a local preview instantly
        setPreview(URL.createObjectURL(file));

        // Start the upload process
        onUploadStart(); // Let the parent page know we are uploading
        try {
            const downloadURL = await uploadLogo(file, userId);
            onUploadComplete(downloadURL); // Send the final URL back to the parent
        } catch (error) {
            console.error("Logo upload failed:", error);
            onUploadComplete(null); // Signal that the upload failed
        }
    };

    return (
        <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700">Company Logo</label>
            <div className="mt-1 flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-100 rounded-md flex items-center justify-center overflow-hidden">
                    {preview ? (
                        <Image src={preview} alt="Logo preview" width={80} height={80} className="object-contain" />
                    ) : (
                        <span className="text-xs text-gray-400">No Logo</span>
                    )}
                </div>
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/png, image/jpeg, image/svg+xml"
                    className="hidden"
                />
                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    {isUploading ? 'Uploading...' : 'Choose File'}
                </button>
            </div>
        </div>
    );
}