// app/dashboard/(dashboard pages)/analytics/components/GoogleMaps
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function GoogleMaps() {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markerRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        let isMounted = true;

        const initializeMap = async () => {
            try {
                const loader = new Loader({
                    apiKey: "AIzaSyATAmD5lVb1jZe6pGoeZGF5OU-8-hrLeF4",
                    version: 'weekly',
                    libraries: ['maps', 'marker']
                });

                // Load the maps library
                const { Map } = await loader.importLibrary('maps');
                const { AdvancedMarkerElement } = await loader.importLibrary('marker');

                if (!isMounted || !mapRef.current) return;

                // Default location
                const locationInMap = {
                    lat: 39.60128890889341,
                    lng: -9.069839810859907,
                };

                const mapOptions = {
                    center: locationInMap,
                    zoom: 15,
                    mapId: 'DEMO_MAP_ID',
                    
                    // Performance optimizations for your app
                    gestureHandling: 'greedy',
                    disableDefaultUI: false,
                    
                    // UI controls
                    mapTypeControl: true,
                    streetViewControl: true,
                    fullscreenControl: true,
                    zoomControl: true,
                    
                    // Additional performance settings
                    clickableIcons: false,
                    keyboardShortcuts: false,
                };

                // Create map
                const map = new Map(mapRef.current, mapOptions);
                mapInstanceRef.current = map;

                // Create advanced marker
                const marker = new AdvancedMarkerElement({
                    map,
                    position: locationInMap,
                    title: 'Analytics Location',
                });

                markerRef.current = marker;

                // Wait for map to be idle (fully loaded)
                map.addListener('idle', () => {
                    if (isMounted) {
                        setIsLoaded(true);
                    }
                });

                // Handle window resize
                const handleResize = () => {
                    if (mapInstanceRef.current) {
                        google.maps.event.trigger(mapInstanceRef.current, 'resize');
                    }
                };

                window.addEventListener('resize', handleResize);

                return () => {
                    window.removeEventListener('resize', handleResize);
                };

            } catch (error) {
                console.error('Error loading Google Maps:', error);
                setError(`Failed to load Google Maps: ${error.message}`);
                setIsLoaded(true);
            }
        };

        if (mapRef.current) {
            initializeMap();
        }

        return () => {
            isMounted = false;
        };
    }, []);

    // Error state
    if (error) {
        return (
            <div className="h-[600px] w-full rounded-lg border border-red-200 bg-red-50 flex items-center justify-center">
                <div className="text-center p-6 max-w-md">
                    <div className="text-red-600 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Map Error</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative gmap-container">
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
                    <div className="flex flex-col items-center space-y-2">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                        <span className="text-gray-500 text-sm">Loading map...</span>
                    </div>
                </div>
            )}
            <div 
                className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200 gmap-container" 
                ref={mapRef}
                style={{
                    // Force hardware acceleration and prevent interference
                    transform: 'translateZ(0)',
                    backfaceVisibility: 'hidden',
                    willChange: 'transform',
                    // Prevent transitions on this element
                    transition: 'none !important',
                }}
            />
        </div>
    );
}
