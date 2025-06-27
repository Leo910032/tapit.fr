// app/dashboard/(dashboard pages)/contacts/components/BusinessCardScanner.jsx
"use client"
import { useState, useRef } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { toast } from 'react-hot-toast';

export default function BusinessCardScanner({ isOpen, onClose, onContactParsed }) {
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Start camera
    const startCamera = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: { 
                    facingMode: 'environment', // Use back camera
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                } 
            });
            videoRef.current.srcObject = stream;
            setShowCamera(true);
        } catch (error) {
            console.error('Camera error:', error);
            toast.error('Unable to access camera');
        }
    };

    // Stop camera
    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const tracks = videoRef.current.srcObject.getTracks();
            tracks.forEach(track => track.stop());
        }
        setShowCamera(false);
    };

    // Capture photo from camera
    const capturePhoto = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        canvas.toBlob((blob) => {
            const file = new File([blob], 'business-card.jpg', { type: 'image/jpeg' });
            setCapturedImage(file);
            stopCamera();
        }, 'image/jpeg', 0.8);
    };

    // Handle file selection
    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setCapturedImage(file);
        }
    };

    // Process the image
    const processImage = async () => {
        if (!capturedImage) return;

        setIsProcessing(true);
        
        try {
            // Convert image to base64
            const reader = new FileReader();
            reader.onload = async (e) => {
                const imageBase64 = e.target.result;
                
                // Call our API
                const response = await fetch('/api/scan-business-card', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ imageBase64 })
                });
                
                const result = await response.json();
                
                if (result.success) {
                    // Pass parsed contact to parent
                    onContactParsed(result.parsedContact);
                    toast.success('Business card scanned successfully!');
                    handleClose();
                } else {
                    toast.error(result.error || 'Failed to scan business card');
                }
            };
            
            reader.readAsDataURL(capturedImage);
            
        } catch (error) {
            console.error('Processing error:', error);
            toast.error('Failed to process business card');
        } finally {
            setIsProcessing(false);
        }
    };

    // Reset and close
    const handleClose = () => {
        stopCamera();
        setCapturedImage(null);
        setIsProcessing(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        📷 Scan Business Card
                    </h3>
                    <button
                        onClick={handleClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6">
                    {!showCamera && !capturedImage && (
                        <div className="space-y-4">
                            <p className="text-gray-600 text-center">
                                Choose how to capture the business card:
                            </p>
                            
                            {/* Camera button */}
                            <button
                                onClick={startCamera}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                Take Photo
                            </button>

                            {/* File upload button */}
                            <button
                                onClick={() => fileInputRef.current?.click()}
                                className="w-full flex items-center justify-center gap-3 p-4 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                Upload Image
                            </button>

                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    )}

                    {/* Camera view */}
                    {showCamera && (
                        <div className="space-y-4">
                            <div className="relative bg-black rounded-lg overflow-hidden">
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    className="w-full h-64 object-cover"
                                />
                                
                                {/* Overlay guide */}
                                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-50 pointer-events-none"></div>
                                <div className="absolute top-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                                    Position card in frame
                                </div>
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={stopCamera}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                >
                                    📷 Capture
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Image preview */}
                    {capturedImage && (
                        <div className="space-y-4">
                            <div className="bg-gray-100 rounded-lg p-4">
                                <img
                                    src={URL.createObjectURL(capturedImage)}
                                    alt="Captured business card"
                                    className="w-full h-48 object-contain rounded"
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setCapturedImage(null)}
                                    className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Retake
                                </button>
                                <button
                                    onClick={processImage}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                                >
                                    {isProcessing && (
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    )}
                                    {isProcessing ? 'Processing...' : '🔍 Scan'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Hidden canvas for image processing */}
                    <canvas ref={canvasRef} className="hidden" />
                </div>
            </div>
        </div>
    );
}