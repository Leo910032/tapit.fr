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
    const [showCropper, setShowCropper] = useState(false);
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const fileInputRef = useRef(null);    
    const [mediaStream, setMediaStream] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);

    // Cropping states
    const [cropArea, setCropArea] = useState({ x: 0, y: 0, width: 0, height: 0 });
    const [isDragging, setIsDragging] = useState(false);
    const [isResizing, setIsResizing] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [resizeHandle, setResizeHandle] = useState(null);
    const [imageContainer, setImageContainer] = useState({ width: 0, height: 0 });
    const cropCanvasRef = useRef(null);
    const cropImageRef = useRef(null);

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
            setShowCropper(false);
            setIsDragging(false);
            setIsResizing(false);
            setResizeHandle(null);
        }
    }, [isOpen]);

    // Add global mouse event listeners for better responsiveness
    useEffect(() => {
        const handleGlobalMouseMove = (e) => handleMouseMove(e);
        const handleGlobalMouseUp = () => handleMouseUp();

        if (isDragging || isResizing) {
            document.addEventListener('mousemove', handleGlobalMouseMove);
            document.addEventListener('mouseup', handleGlobalMouseUp);
            document.body.style.userSelect = 'none';
            document.body.style.cursor = isDragging ? 'grabbing' : 'default';
        }

        return () => {
            document.removeEventListener('mousemove', handleGlobalMouseMove);
            document.removeEventListener('mouseup', handleGlobalMouseUp);
            document.body.style.userSelect = '';
            document.body.style.cursor = '';
        };
    }, [isDragging, isResizing, cropArea, dragStart, resizeHandle, imageContainer]);

    const startCamera = async () => {
        const idealConstraints = { 
            video: { 
                facingMode: 'environment',
                width: { ideal: 1920 },
                height: { ideal: 1080 }
            } 
        };
        const fallbackConstraints = { 
            video: {
                width: { ideal: 1280 },
                height: { ideal: 720 }
            }
        };

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
        
        const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
        setPreviewUrl(dataUrl);

        canvas.toBlob((blob) => {
            const file = new File([blob], 'business-card.jpg', { type: 'image/jpeg' });
            setCapturedImage(file);
            stopCamera();
            setShowCropper(true);
        }, 'image/jpeg', 0.9);
    };

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) {
            console.log('No file selected');
            return;
        }

        console.log('File selected:', {
            name: file.name,
            type: file.type,
            size: file.size,
            lastModified: file.lastModified
        });

        if (!file.type.startsWith('image/')) {
            toast.error('Please select a valid image file');
            return;
        }
        
        // Check file size (limit to 10MB)
        if (file.size > 10 * 1024 * 1024) {
            toast.error('Image file is too large. Please select an image under 10MB.');
            return;
        }
        
        setCapturedImage(file);

        // Create preview URL
        try {
            const url = URL.createObjectURL(file);
            setPreviewUrl(url);
            setShowCropper(true);
        } catch (error) {
            console.error('Error creating preview:', error);
            toast.error('Failed to load the selected image');
        }
        
        // Clear the input so the same file can be selected again if needed
        event.target.value = '';
    };

    // Image cropping functions
    const initializeCropArea = (img) => {
        const containerWidth = img.offsetWidth;
        const containerHeight = img.offsetHeight;
        
        setImageContainer({ width: containerWidth, height: containerHeight });
        
        // Default crop area (80% of image, centered)
        const cropWidth = containerWidth * 0.8;
        const cropHeight = containerHeight * 0.6;
        const cropX = (containerWidth - cropWidth) / 2;
        const cropY = (containerHeight - cropHeight) / 2;
        
        setCropArea({
            x: cropX,
            y: cropY,
            width: cropWidth,
            height: cropHeight
        });
    };

    const handleMouseDown = (e, handle = null) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (handle) {
            setIsResizing(true);
            setResizeHandle(handle);
        } else {
            setIsDragging(true);
            const rect = cropImageRef.current.getBoundingClientRect();
            setDragStart({
                x: e.clientX - rect.left - cropArea.x,
                y: e.clientY - rect.top - cropArea.y
            });
        }
    };

    const handleMouseMove = (e) => {
        if (!isDragging && !isResizing) return;
        
        const rect = cropImageRef.current.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;
        
        if (isDragging) {
            const newX = mouseX - dragStart.x;
            const newY = mouseY - dragStart.y;
            
            // Constrain to image bounds
            const maxX = imageContainer.width - cropArea.width;
            const maxY = imageContainer.height - cropArea.height;
            
            setCropArea(prev => ({
                ...prev,
                x: Math.max(0, Math.min(newX, maxX)),
                y: Math.max(0, Math.min(newY, maxY))
            }));
        } else if (isResizing && resizeHandle) {
            const minSize = 80; // Increased minimum size for better usability
            
            setCropArea(prev => {
                let newCrop = { ...prev };
                
                switch (resizeHandle) {
                    case 'nw': // Northwest
                        const nwDeltaX = Math.max(mouseX - prev.x, prev.width - (imageContainer.width - prev.x));
                        const nwDeltaY = Math.max(mouseY - prev.y, prev.height - (imageContainer.height - prev.y));
                        
                        newCrop.x = Math.max(0, mouseX);
                        newCrop.y = Math.max(0, mouseY);
                        newCrop.width = Math.max(minSize, prev.x + prev.width - newCrop.x);
                        newCrop.height = Math.max(minSize, prev.y + prev.height - newCrop.y);
                        break;
                        
                    case 'ne': // Northeast
                        newCrop.y = Math.max(0, mouseY);
                        newCrop.width = Math.max(minSize, Math.min(mouseX - prev.x, imageContainer.width - prev.x));
                        newCrop.height = Math.max(minSize, prev.y + prev.height - newCrop.y);
                        break;
                        
                    case 'sw': // Southwest
                        newCrop.x = Math.max(0, mouseX);
                        newCrop.width = Math.max(minSize, prev.x + prev.width - newCrop.x);
                        newCrop.height = Math.max(minSize, Math.min(mouseY - prev.y, imageContainer.height - prev.y));
                        break;
                        
                    case 'se': // Southeast
                        newCrop.width = Math.max(minSize, Math.min(mouseX - prev.x, imageContainer.width - prev.x));
                        newCrop.height = Math.max(minSize, Math.min(mouseY - prev.y, imageContainer.height - prev.y));
                        break;
                        
                    case 'n': // North
                        newCrop.y = Math.max(0, mouseY);
                        newCrop.height = Math.max(minSize, prev.y + prev.height - newCrop.y);
                        break;
                        
                    case 's': // South
                        newCrop.height = Math.max(minSize, Math.min(mouseY - prev.y, imageContainer.height - prev.y));
                        break;
                        
                    case 'w': // West
                        newCrop.x = Math.max(0, mouseX);
                        newCrop.width = Math.max(minSize, prev.x + prev.width - newCrop.x);
                        break;
                        
                    case 'e': // East
                        newCrop.width = Math.max(minSize, Math.min(mouseX - prev.x, imageContainer.width - prev.x));
                        break;
                }
                
                return newCrop;
            });
        }
    };

    const handleMouseUp = () => {
        setIsDragging(false);
        setIsResizing(false);
        setResizeHandle(null);
    };

    const applyCrop = () => {
        const img = cropImageRef.current;
        const canvas = cropCanvasRef.current;
        
        if (!img || !canvas || !previewUrl) return;
        
        const ctx = canvas.getContext('2d');
        
        // Calculate the actual image dimensions vs displayed dimensions
        const scaleX = img.naturalWidth / img.offsetWidth;
        const scaleY = img.naturalHeight / img.offsetHeight;
        
        // Set canvas size to crop area
        canvas.width = cropArea.width * scaleX;
        canvas.height = cropArea.height * scaleY;
        
        // Draw the cropped portion
        ctx.drawImage(
            img,
            cropArea.x * scaleX, // source x
            cropArea.y * scaleY, // source y
            cropArea.width * scaleX, // source width
            cropArea.height * scaleY, // source height
            0, // destination x
            0, // destination y
            canvas.width, // destination width
            canvas.height // destination height
        );
        
        // Convert to blob and update the captured image
        canvas.toBlob((blob) => {
            const croppedFile = new File([blob], 'cropped-business-card.jpg', { type: 'image/jpeg' });
            setCapturedImage(croppedFile);
            
            // Update preview URL
            const newPreviewUrl = URL.createObjectURL(blob);
            if (previewUrl && previewUrl.startsWith('blob:')) {
                URL.revokeObjectURL(previewUrl);
            }
            setPreviewUrl(newPreviewUrl);
            setShowCropper(false);
        }, 'image/jpeg', 0.9);
    };

    // ✅ Process image function
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
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setIsProcessing(false);
        setShowCropper(false);
        onClose();
    };

    // ✅ Fixed handleRetake function
    const handleRetake = () => {
        setCapturedImage(null);
        if (previewUrl && previewUrl.startsWith('blob:')) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewUrl(null);
        setIsProcessing(false);
        setShowCropper(false);
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-2 sm:p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[95vh] overflow-hidden flex flex-col">
                
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b bg-white flex-shrink-0">
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

                <div className="flex-1 overflow-y-auto min-h-0">
                    {/* ✅ Initial choice screen */}
                    {!showCamera && !showCropper && !previewUrl && (
                        <div className="p-6 flex flex-col items-center justify-center min-h-[400px]">
                            <div className="text-center mb-8">
                                <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-10 h-10 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                    Capture Business Card
                                </h3>
                                <p className="text-gray-600 max-w-md">
                                    Choose how to capture the business card. For best results, ensure good lighting and the card fills most of the frame.
                                </p>
                            </div>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-md">
                                {/* Camera button */}
                                <button
                                    onClick={startCamera}
                                    className="flex flex-col items-center gap-3 p-6 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors"
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <span className="font-medium">Take Photo</span>
                                    <span className="text-xs text-blue-100">Use your camera</span>
                                </button>

                                {/* File upload button */}
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    className="flex flex-col items-center gap-3 p-6 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-colors"
                                >
                                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                    </svg>
                                    <span className="font-medium">Upload Image</span>
                                    <span className="text-xs text-gray-500">From your device</span>
                                </button>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    )}

                    {/* ✅ Enhanced Camera view */}
                    {showCamera && (
                        <div className="p-4 flex flex-col items-center">
                            <div className="relative w-full max-w-2xl">
                                <div className="relative bg-black rounded-xl overflow-hidden">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-auto min-h-[300px] sm:min-h-[400px] object-cover"
                                    />
                                    
                                    {/* Enhanced overlay guide for business card */}
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="relative">
                                            {/* Card frame overlay */}
                                            <div 
                                                className="border-2 border-white border-dashed rounded-lg"
                                                style={{
                                                    width: '280px',
                                                    height: '180px',
                                                    aspectRatio: '85.6/53.98' // Standard business card ratio
                                                }}
                                            >
                                                {/* Corner guides */}
                                                <div className="absolute -top-1 -left-1 w-6 h-6 border-l-4 border-t-4 border-yellow-400"></div>
                                                <div className="absolute -top-1 -right-1 w-6 h-6 border-r-4 border-t-4 border-yellow-400"></div>
                                                <div className="absolute -bottom-1 -left-1 w-6 h-6 border-l-4 border-b-4 border-yellow-400"></div>
                                                <div className="absolute -bottom-1 -right-1 w-6 h-6 border-r-4 border-b-4 border-yellow-400"></div>
                                            </div>
                                            
                                            {/* Instructions */}
                                            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 bg-black bg-opacity-70 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap">
                                                Position card within the frame
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="flex gap-3 mt-4">
                                    <button
                                        onClick={stopCamera}
                                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={capturePhoto}
                                        className="flex-1 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0118.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        </svg>
                                        Capture Photo
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ Enhanced Image Cropper */}
                    {showCropper && previewUrl && (
                        <div className="p-4 flex flex-col items-center">
                            <div className="w-full max-w-3xl">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                                    Crop Your Business Card
                                </h4>
                                <p className="text-sm text-gray-600 mb-4 text-center">
                                    Drag to move • Resize from corners and edges • Position the card perfectly
                                </p>
                                
                                <div className="relative bg-gray-100 rounded-xl overflow-hidden mb-4">
                                    <img
                                        ref={cropImageRef}
                                        src={previewUrl}
                                        alt="Business card to crop"
                                        className="w-full h-auto max-h-[500px] object-contain select-none"
                                        onLoad={(e) => initializeCropArea(e.target)}
                                        onMouseMove={handleMouseMove}
                                        onMouseUp={handleMouseUp}
                                        onMouseLeave={handleMouseUp}
                                        onDragStart={(e) => e.preventDefault()}
                                    />
                                    
                                    {/* Crop area overlay with improved handles */}
                                    {cropArea.width > 0 && (
                                        <>
                                            {/* Crop area with proper positioning */}
                                            <div
                                                className="absolute bg-transparent border-2 border-white shadow-lg select-none"
                                                style={{
                                                    left: cropArea.x,
                                                    top: cropArea.y,
                                                    width: cropArea.width,
                                                    height: cropArea.height,
                                                    cursor: isDragging ? 'grabbing' : 'grab',
                                                    boxShadow: `0 0 0 ${Math.max(cropArea.x, cropArea.y, imageContainer.width - cropArea.x - cropArea.width, imageContainer.height - cropArea.y - cropArea.height) + 50}px rgba(0, 0, 0, 0.4)`
                                                }}
                                                onMouseDown={(e) => handleMouseDown(e)}
                                            >
                                                {/* Corner resize handles - properly positioned */}
                                                <div 
                                                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-nw-resize hover:scale-125 hover:bg-blue-50 transition-all duration-150 z-10"
                                                    style={{ 
                                                        top: '-8px', 
                                                        left: '-8px',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={(e) => handleMouseDown(e, 'nw')}
                                                ></div>
                                                <div 
                                                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-ne-resize hover:scale-125 hover:bg-blue-50 transition-all duration-150 z-10"
                                                    style={{ 
                                                        top: '-8px', 
                                                        right: '-8px',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={(e) => handleMouseDown(e, 'ne')}
                                                ></div>
                                                <div 
                                                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-sw-resize hover:scale-125 hover:bg-blue-50 transition-all duration-150 z-10"
                                                    style={{ 
                                                        bottom: '-8px', 
                                                        left: '-8px',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={(e) => handleMouseDown(e, 'sw')}
                                                ></div>
                                                <div 
                                                    className="absolute w-4 h-4 bg-white border-2 border-blue-500 rounded-full shadow-lg cursor-se-resize hover:scale-125 hover:bg-blue-50 transition-all duration-150 z-10"
                                                    style={{ 
                                                        bottom: '-8px', 
                                                        right: '-8px',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={(e) => handleMouseDown(e, 'se')}
                                                ></div>
                                                
                                                {/* Edge resize handles - properly positioned and sized */}
                                                <div 
                                                    className="absolute w-6 h-3 bg-white border border-blue-500 rounded-full shadow-md cursor-n-resize hover:bg-blue-50 transition-all duration-150 z-10"
                                                    style={{ 
                                                        top: '-6px', 
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={(e) => handleMouseDown(e, 'n')}
                                                ></div>
                                                <div 
                                                    className="absolute w-6 h-3 bg-white border border-blue-500 rounded-full shadow-md cursor-s-resize hover:bg-blue-50 transition-all duration-150 z-10"
                                                    style={{ 
                                                        bottom: '-6px', 
                                                        left: '50%',
                                                        transform: 'translateX(-50%)',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={(e) => handleMouseDown(e, 's')}
                                                ></div>
                                                <div 
                                                    className="absolute w-3 h-6 bg-white border border-blue-500 rounded-full shadow-md cursor-w-resize hover:bg-blue-50 transition-all duration-150 z-10"
                                                    style={{ 
                                                        top: '50%', 
                                                        left: '-6px',
                                                        transform: 'translateY(-50%)',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={(e) => handleMouseDown(e, 'w')}
                                                ></div>
                                                <div 
                                                    className="absolute w-3 h-6 bg-white border border-blue-500 rounded-full shadow-md cursor-e-resize hover:bg-blue-50 transition-all duration-150 z-10"
                                                    style={{ 
                                                        top: '50%', 
                                                        right: '-6px',
                                                        transform: 'translateY(-50%)',
                                                        touchAction: 'none'
                                                    }}
                                                    onMouseDown={(e) => handleMouseDown(e, 'e')}
                                                ></div>
                                                
                                                {/* Grid lines for better alignment */}
                                                <div className="absolute inset-0 pointer-events-none opacity-30">
                                                    {/* Rule of thirds grid */}
                                                    <div className="absolute w-full border-t border-white" style={{ top: '33.33%' }}></div>
                                                    <div className="absolute w-full border-t border-white" style={{ top: '66.66%' }}></div>
                                                    <div className="absolute h-full border-l border-white" style={{ left: '33.33%' }}></div>
                                                    <div className="absolute h-full border-l border-white" style={{ left: '66.66%' }}></div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleRetake}
                                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
                                    >
                                        Retake
                                    </button>
                                    <button
                                        onClick={applyCrop}
                                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center gap-2"
                                    >
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 12l2 2 4-4" />
                                        </svg>
                                        Apply Crop
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* ✅ Enhanced Final Preview */}
                    {capturedImage && !showCropper && previewUrl && (
                        <div className="p-4 flex flex-col items-center">
                            <div className="w-full max-w-2xl">
                                <h4 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                                    Ready to Scan
                                </h4>
                                
                                <div className="bg-gray-100 rounded-xl p-4 mb-4">
                                    <img
                                        src={previewUrl}
                                        alt="Captured business card"
                                        className="w-full h-auto max-h-[400px] object-contain rounded-lg shadow-sm"
                                        onLoad={() => console.log('Final preview loaded successfully')}
                                        onError={(e) => {
                                            console.error('Final preview failed to load:', e);
                                            toast.error('Failed to display the image');
                                        }}
                                    />
                                </div>
                                
                                <div className="flex gap-3">
                                    <button
                                        onClick={handleRetake}
                                        disabled={isProcessing}
                                        className="flex-1 px-4 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
                                    >
                                        Retake Photo
                                    </button>
                                    <button
                                        onClick={() => setShowCropper(true)}
                                        disabled={isProcessing}
                                        className="px-4 py-3 text-orange-600 bg-orange-50 hover:bg-orange-100 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors font-medium"
                                    >
                                        Crop
                                    </button>
                                    <button
                                        onClick={processImage}
                                        disabled={isProcessing}
                                        className="flex-1 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2 font-medium"
                                    >
                                        {isProcessing && (
                                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        )}
                                        {isProcessing ? 'Processing...' : (
                                            <>
                                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                                </svg>
                                                Scan Card
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Hidden canvases for image processing */}
                    <canvas ref={canvasRef} className="hidden" />
                    <canvas ref={cropCanvasRef} className="hidden" />
                </div>
            </div>
        </div>
    );
}
