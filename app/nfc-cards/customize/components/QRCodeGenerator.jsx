// app/nfc-cards/customize/components/QRCodeGenerator.jsx - NEW COMPONENT
"use client";
import { useEffect } from 'react';

export default function QRCodeGenerator({ userId, username, onQRCodeGenerated }) {
    useEffect(() => {
        const generateQRCode = async () => {
            if (!userId || !username) {
                onQRCodeGenerated("");
                return;
            }

            try {
                // Import QRCode dynamically to avoid SSR issues
                const QRCode = (await import('qrcode.react')).default;
                const React = (await import('react')).default;
                const { createRoot } = await import('react-dom/client');

                // Create a temporary container
                const tempContainer = document.createElement('div');
                tempContainer.style.position = 'absolute';
                tempContainer.style.left = '-9999px';
                document.body.appendChild(tempContainer);

                // Create React root and render QR code
                const root = createRoot(tempContainer);
                
                // Use username for the profile URL
                const userProfileUrl = `${window.location.origin}/${username}`;
                
                console.log('🔄 Generating QR code for:', userProfileUrl);
                
                // Create a promise to get the canvas data
                const getQRCodeDataUrl = () => {
                    return new Promise((resolve) => {
                        // Render QR code component
                        root.render(
                            React.createElement(QRCode, {
                                value: userProfileUrl,
                                size: 100, // Larger size for better quality
                                level: 'M',
                                onLoad: () => {
                                    setTimeout(() => {
                                        const canvas = tempContainer.querySelector('canvas');
                                        if (canvas) {
                                            const dataUrl = canvas.toDataURL('image/png');
                                            resolve(dataUrl);
                                        } else {
                                            resolve("");
                                        }
                                    }, 100);
                                }
                            })
                        );
                        
                        // Fallback timeout
                        setTimeout(() => {
                            const canvas = tempContainer.querySelector('canvas');
                            if (canvas) {
                                const dataUrl = canvas.toDataURL('image/png');
                                resolve(dataUrl);
                            } else {
                                resolve("");
                            }
                        }, 500);
                    });
                };

                const dataUrl = await getQRCodeDataUrl();
                console.log('✅ QR code generated successfully');
                onQRCodeGenerated(dataUrl);

                // Cleanup
                root.unmount();
                document.body.removeChild(tempContainer);

            } catch (error) {
                console.error('❌ Error generating QR code:', error);
                onQRCodeGenerated("");
            }
        };

        generateQRCode();
    }, [userId, username, onQRCodeGenerated]);

    // This component doesn't render anything visible
    return null;
}