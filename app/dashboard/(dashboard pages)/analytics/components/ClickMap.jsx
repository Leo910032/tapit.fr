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

    // TODO: Your analytics data needs a 'locations' array.
    // Example: analytics.locations = [{ lat: 48.85, lng: 2.35, weight: 3 }, ...]
    const locations = analytics?.locations || [];

    useEffect(() => {
        let isMounted = true;
        const initializeMap = async () => {
            try {
                const loader = new Loader({
                    apiKey: "AIzaSyATAmD5lVb1jZe6pGoeZGF5OU-8-hrLeF4", // <-- IMPORTANT: USE YOUR KEY
                    version: 'weekly',
                    libraries: ['maps', 'visualization'], // <-- Visualization library is needed for heatmap
                });

                const google = await loader.load();
                if (!isMounted || !mapRef.current) return;

                const map = new google.maps.Map(mapRef.current, {
                    center: { lat: 20, lng: 0 },
                    zoom: 2,
                    mapId: 'DEMO_MAP_ID',
                    disableDefaultUI: true,
                    styles: [/* Optional: Add custom map styles here */]
                });

                if (locations.length > 0) {
                    const heatmapData = locations.map(loc => ({
                        location: new google.maps.LatLng(loc.lat, loc.lng),
                        weight: loc.weight || 1
                    }));

                    const heatmap = new google.maps.visualization.HeatmapLayer({
                        data: heatmapData,
                        map: map,
                    });
                    
                    heatmap.set('radius', 20);
                    heatmap.set('opacity', 0.6);
                }

                map.addListener('idle', () => isMounted && setIsLoaded(true));

            } catch (e) {
                console.error('Error loading Google Maps:', e);
                setError(`Failed to load maps: ${e.message}`);
            }
        };

        initializeMap();
        return () => { isMounted = false; };
    }, [locations]);

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