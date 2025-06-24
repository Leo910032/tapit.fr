// app/dashboard/(dashboard pages)/analytics/components/ClickMap.jsx
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useTranslation } from '@/lib/useTranslation';

export default function ClickMap({ analytics }) {
    const mapRef = useRef(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const { t } = useTranslation();

    const locations = analytics?.locations || [];

    useEffect(() => {
        // Do not run if the API key is missing
        if (!process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY) {
            setError("Google Maps API key is missing.");
            return;
        }

        let isMounted = true;
        const initializeMap = async () => {
            try {
                const loader = new Loader({
                    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY, // ✅ Using environment variable
                    version: 'weekly',
                    libraries: ['maps', 'visualization'],
                });

                const google = await loader.load();
                if (!isMounted || !mapRef.current) return;

                const map = new google.maps.Map(mapRef.current, {
                    center: { lat: 20, lng: 0 },
                    zoom: 2,
                    mapId: '1c9bde193bda6c49', // Use a real map ID or remove for default
                    disableDefaultUI: true,
                    styles: [
                        { elementType: "geometry", stylers: [{ color: "#f5f5f5" }] },
                        { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#f5f5f5" }] },
                        { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
                        { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
                        { featureType: "poi", stylers: [{ visibility: "off" }] },
                        { featureType: "road", stylers: [{ visibility: "off" }] },
                        { featureType: "transit", stylers: [{ visibility: "off" }] },
                        { featureType: "water", stylers: [{ color: "#c9c9c9" }] },
                    ]
                });

                if (locations.length > 0) {
                    const heatmapData = locations.map(loc => ({
                        location: new google.maps.LatLng(loc.lat, loc.lng),
                        weight: loc.weight || 1
                    }));

                    const heatmap = new google.maps.visualization.HeatmapLayer({ data: heatmapData, map: map });
                    heatmap.set('radius', 30);
                    heatmap.set('opacity', 0.7);
                }

                map.addListener('idle', () => isMounted && setIsLoaded(true));

            } catch (e) {
                console.error('Error loading Google Maps:', e);
                // Display specific error messages
                if (e.message.includes("API key")) {
                    setError("Invalid or missing Google Maps API Key.");
                } else {
                    setError("Could not load the map.");
                }
            }
        };

        if (locations.length > 0) {
            initializeMap();
        }

        return () => { isMounted = false; };
    }, [locations]);

    // Show error state if something went wrong
    if (error) {
        return (
            <div className="mb-8">
                <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
                     <h2 className="text-xl font-semibold text-red-800 mb-4">{t('analytics.map_error', 'Map Error')}</h2>
                    <p className="text-red-600">{t('analytics.map_error_message', error)}</p>
                </div>
            </div>
        );
    }
    
    // Show placeholder if no location data exists
    if (locations.length === 0) {
        return (
            <div className="mb-8">
                <div className="bg-white rounded-xl shadow-sm border p-6 text-center">
                    <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('analytics.click_map', 'Click Map')}</h2>
                    <p className="text-gray-500">{t('analytics.no_location_data', 'No location data available to display on the map.')}</p>
                </div>
            </div>
        );
    }
    
    // Render the map
    return (
        <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">{t('analytics.click_map', 'Click Map')}</h2>
            <div className="relative h-[400px] w-full">
                {!isLoaded && (
                    <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                    </div>
                )}
                <div className="h-full w-full rounded-lg overflow-hidden border" ref={mapRef} />
            </div>
        </div>
    );
}