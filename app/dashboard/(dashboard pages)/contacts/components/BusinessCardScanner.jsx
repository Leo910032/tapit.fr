// app/dashboard/(dashboard pages)/contacts/components/BusinessCardScanner.jsx
"use client"

import { useTranslation } from '@/lib/useTranslation';
import { toast } from 'react-hot-toast';
import { useState, useRef, useEffect } from 'react';

export default function BusinessCardScanner({ isOpen, onClose, onContactParsed }) {
    const { t } = useTranslation();
    const [isProcessing, setIsProcessing] = useState(false);
    const [capturedImage, setCapturedImage] = useState(null);
    const [showCamera, setShowCamera] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);    
    const [mediaStream, setMediaStream] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // ✅ Fixed useEffect for media stream management
    useEffect(() => {
        if (mediaStream && videoRef.current) {
            videoRef.current.srcObject = mediaStream;
        }

        // Cleanup function
        return () => {
            if (mediaStream) {
                mediaStream.getTracks().forEach(track => track.stop());
            }
        };
    }, [mediaStream]);

    // ✅ Reset all states when modal closes
    useEffect(() => {
        if (!isOpen) {
            stopCamera();
            setCapturedImage(null);
            setPreviewUrl(null);
            setIsProcessing(false);
        }
    }, [isOpen]);

    const startCamera = async () => {
        const idealConstraints = { video: { facingMode: 'environment' } };
        const fallbackConstraints = { video: true };

        try {
            let stream;
            try {
                stream = await navigator.mediaDevices.getUserMedia(idealConstraints);
            } catch (err) {
                console.warn("Could not get back camera, falling back.", err);
                stream = await navigator.mediaDevices.getUserMedia(fallbackConstraints);
            }
            
            setMediaStream(stream);
            setShowCamera(true);

        } catch (error) {
            console.error('Could not access any camera.', error);
            toast.error('Unable to access camera on this device.');
        }
    };

    const stopCamera = () => {
        if (mediaStream) {
            mediaStream.getTracks().forEach(track => track.stop());
        }
        setMediaStream(null);
        setShowCamera(false);
    };

    const capturePhoto = () => {
        const canvas = canvasRef.current;
        const video = videoRef.current;
        if (!canvas || !video || !video.videoWidth) return;
        
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        ctx.drawImage(video, 0, 0);
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
        setPreviewUrl(dataUrl);

        canvas.toBlob((blob) => {
            const file = new File([blob], 'business-card.jpg', { type: 'image/jpeg' });
            setCapturedImage(file);
            stopCamera();
        }, 'image/jpeg', 0.8);
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (file && file.type.startsWith('image/')) {
            setCapturedImage(file);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result);
            };
            reader.readAsDataURL(file);
        }
    };

    // ✅ Fixed processImage function
    const processImage = async () => {
        if (!capturedImage) return;
        setIsProcessing(true);
        toast.loading('Scanning card...', { id: 'scanning-toast' });
        
        try {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const imageBase64 = e.target.result;
                    const response = await fetch('/api/scan-business-card', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ imageBase64 })
                    });
                    
                    const result = await response.json();
                    toast.dismiss('scanning-toast');
                    
                    if (result.success) {
                        onContactParsed(result.parsedFields);
                        toast.success('Scan complete! Please review.');
                    } else {
                        toast.error(result.error || 'Failed to scan business card');
                    }
                } catch (error) {
                    toast.dismiss('scanning-toast');
                    console.error('API call error:', error);
                    toast.error('Failed to process business card');
                } finally {
                    setIsProcessing(false);
                }
            };
            
            reader.onerror = () => {
                toast.dismiss('scanning-toast');
                toast.error('Failed to read image file');
                setIsProcessing(false);
            };
            
            reader.readAsDataURL(capturedImage);
            
        } catch (error) {
            toast.dismiss('scanning-toast');
            console.error('Processing error:', error);
            toast.error('Failed to process business card');
            setIsProcessing(false);
        }
    };

    // ✅ Fixed handleClose function
    const handleClose = () => {
        stopCamera();
        setCapturedImage(null);
        setPreviewUrl(null);
        setIsProcessing(false);
        onClose();
    };

    // ✅ Fixed handleRetake function
    const handleRetake = () => {
        setCapturedImage(null);
        setPreviewUrl(null);
        setIsProcessing(false);
        // Don't automatically start camera - let user choose again
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
            <div className="bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full max-w-md h-auto max-h-[85vh] sm:max-h-[90vh] overflow-y-auto flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between p-3 sm:p-6 border-b bg-white sticky top-0 z-10 flex-shrink-0">
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900">
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

                <div className="p-3 sm:p-6 pb-4 sm:pb-6 flex-1 min-h-0 overflow-y-auto">
                    {/* ✅ Initial choice screen - show when no camera and no preview */}
                    {!showCamera && !previewUrl && (
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
                                    className="w-full h-40 sm:h-64 object-cover"
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
                                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors text-sm sm:text-base"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={capturePhoto}
                                    className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                                >
                                    📷 Capture
                                </button>
                            </div>
                        </div>
                    )}

                    {/* ✅ Image preview - show when we have capturedImage */}
                    {capturedImage && previewUrl && (
                        <div className="space-y-4">
                            <div className="bg-gray-100 rounded-lg p-2 sm:p-4">
                                <img
                                    src={previewUrl}
                                    alt="Captured business card"
                                    className="w-full h-24 sm:h-48 object-contain rounded"
                                />
                            </div>
                            
                            <div className="flex gap-3">
                                <button
                                    onClick={handleRetake}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors text-sm sm:text-base"
                                >
                                    Retake
                                </button>
                                <button
                                    onClick={processImage}
                                    disabled={isProcessing}
                                    className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
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