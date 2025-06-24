// app/dashboard/(dashboard pages)/analytics/components/ClickMap.jsx - OPTIMIZED VERSION
'use client';
import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useTranslation } from '@/lib/useTranslation';

export default function ClickMap({ analytics, contactsData = null, className = "" }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('contacts'); // 'contacts' or 'analytics'
    const { t } = useTranslation();

    // ✅ Enhanced data processing
    const getLocationData = () => {
        let locations = [];
        let dataSource = '';

        // Priority 1: Contact data (real location data from visitors)
        if (contactsData && Array.isArray(contactsData)) {
            const contactLocations = contactsData
                .filter(contact => contact.location && contact.location.latitude && contact.location.longitude)
                .map(contact => ({
                    type: 'contact',
                    lat: contact.location.latitude,
                    lng: contact.location.longitude,
                    weight: 1,
                    info: {
                        name: contact.name,
                        email: contact.email,
                        company: contact.company,
                        submittedAt: contact.submittedAt,
                        accuracy: contact.location.accuracy
                    }
                }));
            
            if (contactLocations.length > 0) {
                locations = contactLocations;
                dataSource = 'contacts';
            }
        }

        // Priority 2: Analytics location data (if no contact data)
        if (locations.length === 0 && analytics?.locations && Array.isArray(analytics.locations)) {
            locations = analytics.locations.map(loc => ({
                type: 'analytics',
                lat: loc.lat,
                lng: loc.lng,
                weight: loc.weight || 1,
                info: loc.info || {}
            }));
            dataSource = 'analytics';
        }

        return { locations, dataSource };
    };

    const { locations, dataSource } = getLocationData();

    // ✅ Enhanced API key validation
    const hasValidApiKey = () => {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        return apiKey && 
               apiKey !== 'your_api_key_here' && 
               apiKey !== 'YOUR_API_KEY' && 
               apiKey.length > 20 && 
               apiKey.startsWith('AIza');
    };

    useEffect(() => {
        if (locations.length === 0) return;

        let isMounted = true;
        let cleanupFunctions = [];

        const initializeMap = async () => {
            try {
                // ✅ Enhanced API key validation
                if (!hasValidApiKey()) {
                    console.warn('🗺️ Google Maps API key not configured properly');
                    setError('api_key_missing');
                    setIsLoaded(true);
                    return;
                }

                console.log(`🗺️ Initializing map with ${locations.length} ${dataSource} locations...`);

                const loader = new Loader({
                    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
                    version: 'weekly',
                    libraries: ['maps', 'marker', 'visualization'],
                    preventGoogleFonts: true,
                });

                const [{ Map }, { AdvancedMarkerElement }, { PinElement }] = await Promise.all([
                    loader.importLibrary('maps'),
                    loader.importLibrary('marker'),
                    loader.importLibrary('marker')
                ]);

                if (!isMounted || !mapRef.current) return;

                // ✅ Smart center calculation
                const bounds = new google.maps.LatLngBounds();
                locations.forEach(loc => bounds.extend({ lat: loc.lat, lng: loc.lng }));
                
                const center = bounds.getCenter();
                const mapCenter = {
                    lat: center.lat(),
                    lng: center.lng()
                };

                // ✅ Enhanced map styling for analytics
                const mapOptions = {
                    center: mapCenter,
                    zoom: locations.length === 1 ? 12 : 6,
                    mapId: 'ANALYTICS_MAP',
                    gestureHandling: 'greedy',
                    disableDefaultUI: true,
                    zoomControl: true,
                    fullscreenControl: true,
                    styles: [
                        { elementType: "geometry", stylers: [{ color: "#f8fafc" }] },
                        { elementType: "labels.text.fill", stylers: [{ color: "#64748b" }] },
                        { elementType: "labels.text.stroke", stylers: [{ color: "#ffffff" }] },
                        { featureType: "water", elementType: "geometry", stylers: [{ color: "#dbeafe" }] },
                        { featureType: "road", elementType: "geometry", stylers: [{ color: "#e5e7eb" }] },
                        { featureType: "road", elementType: "labels", stylers: [{ visibility: "simplified" }] },
                        { featureType: "poi", stylers: [{ visibility: "off" }] },
                        { featureType: "transit", stylers: [{ visibility: "off" }] },
                        { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "simplified" }] }
                    ],
                    clickableIcons: false,
                    keyboardShortcuts: false,
                };

                const map = new Map(mapRef.current, mapOptions);
                mapInstanceRef.current = map;

                // ✅ Create markers based on data type
                if (dataSource === 'contacts') {
                    // Individual markers for contacts
                    locations.forEach((location, index) => {
                        const isRecent = new Date(location.info.submittedAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
                        
                        const pin = new PinElement({
                            background: isRecent ? '#3b82f6' : '#6b7280',
                            borderColor: isRecent ? '#1d4ed8' : '#4b5563',
                            glyphColor: '#ffffff',
                            glyph: `${index + 1}`,
                            scale: isRecent ? 1.3 : 1.1,
                        });

                        const marker = new AdvancedMarkerElement({
                            map,
                            position: { lat: location.lat, lng: location.lng },
                            content: pin.element,
                            title: `${location.info.name} - ${location.info.email}`,
                        });

                        // ✅ Enhanced info window
                        const infoWindow = new google.maps.InfoWindow({
                            content: `
                                <div class="p-4 max-w-sm">
                                    <div class="flex items-center gap-3 mb-3">
                                        <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                            <span class="text-blue-600 font-semibold">${location.info.name.charAt(0).toUpperCase()}</span>
                                        </div>
                                        <div>
                                            <h3 class="font-semibold text-gray-900">${location.info.name}</h3>
                                            <p class="text-sm text-gray-600">${location.info.email}</p>
                                        </div>
                                    </div>
                                    ${location.info.company ? `
                                        <div class="mb-2">
                                            <span class="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                                                🏢 ${location.info.company}
                                            </span>
                                        </div>
                                    ` : ''}
                                    <div class="text-xs text-gray-500 space-y-1">
                                        <p>📅 ${new Date(location.info.submittedAt).toLocaleString()}</p>
                                        ${location.info.accuracy ? `
                                            <p class="text-blue-600">📍 Accuracy: ~${Math.round(location.info.accuracy)}m</p>
                                        ` : ''}
                                        ${isRecent ? `
                                            <p class="text-green-600 font-medium">🆕 Recent contact</p>
                                        ` : ''}
                                    </div>
                                </div>
                            `
                        });

                        marker.addListener('click', () => {
                            markersRef.current.forEach(({ infoWindow: iw }) => iw?.close());
                            infoWindow.open(map, marker);
                        });

                        markersRef.current.push({ marker, infoWindow });
                    });

                } else if (dataSource === 'analytics') {
                    // Heatmap for analytics data
                    const heatmapData = locations.map(loc => ({
                        location: new google.maps.LatLng(loc.lat, loc.lng),
                        weight: loc.weight || 1
                    }));

                    const heatmap = new google.maps.visualization.HeatmapLayer({
                        data: heatmapData,
                        map: map,
                        radius: 25,
                        opacity: 0.8,
                        gradient: [
                            'rgba(0, 255, 255, 0)',
                            'rgba(0, 255, 255, 1)',
                            'rgba(0, 191, 255, 1)',
                            'rgba(0, 127, 255, 1)',
                            'rgba(0, 63, 255, 1)',
                            'rgba(0, 0, 255, 1)',
                            'rgba(0, 0, 223, 1)',
                            'rgba(0, 0, 191, 1)',
                            'rgba(0, 0, 159, 1)',
                            'rgba(0, 0, 127, 1)',
                            'rgba(63, 0, 91, 1)',
                            'rgba(127, 0, 63, 1)',
                            'rgba(191, 0, 31, 1)',
                            'rgba(255, 0, 0, 1)'
                        ]
                    });
                }

                // ✅ Auto-fit bounds with padding
                if (locations.length > 1) {
                    map.fitBounds(bounds, { padding: 80 });
                }

                // ✅ Wait for map to be idle
                const idleListener = map.addListener('idle', () => {
                    if (isMounted) {
                        setIsLoaded(true);
                        google.maps.event.removeListener(idleListener);
                    }
                });

                // ✅ Handle window resize
                const handleResize = () => {
                    if (mapInstanceRef.current) {
                        google.maps.event.trigger(mapInstanceRef.current, 'resize');
                    }
                };

                window.addEventListener('resize', handleResize);
                cleanupFunctions.push(() => window.removeEventListener('resize', handleResize));

                console.log('✅ Map initialized successfully');

            } catch (error) {
                console.error('❌ Error loading Google Maps:', error);
                
                if (error.message.includes('API key') || error.message.includes('ApiNotActivatedMapError')) {
                    setError('api_key_invalid');
                } else if (error.message.includes('quota') || error.message.includes('OVER_QUERY_LIMIT')) {
                    setError('quota_exceeded');
                } else if (error.message.includes('billing') || error.message.includes('REQUEST_DENIED')) {
                    setError('billing_required');
                } else {
                    setError('generic_error');
                }
                setIsLoaded(true);
            }
        };

        if (mapRef.current) {
            initializeMap();
        }

        return () => {
            isMounted = false;
            
            // ✅ Cleanup markers and info windows
            markersRef.current.forEach(({ marker, infoWindow }) => {
                if (infoWindow) infoWindow.close();
                if (marker) marker.map = null;
            });
            markersRef.current = [];
            
            cleanupFunctions.forEach(cleanup => cleanup());
        };
    }, [locations, dataSource]);

    // ✅ Enhanced error messages
    const getErrorMessage = () => {
        switch (error) {
            case 'api_key_missing':
                return {
                    title: t('analytics.maps.api_key_missing_title') || 'Google Maps API Key Required',
                    message: t('analytics.maps.api_key_missing_desc') || 'To display location data on the map, please configure your Google Maps API key.',
                    showHelp: true
                };
            case 'api_key_invalid':
                return {
                    title: t('analytics.maps.api_key_invalid_title') || 'Invalid API Key',
                    message: t('analytics.maps.api_key_invalid_desc') || 'The Google Maps API key is invalid or not properly configured.',
                    showHelp: true
                };
            case 'quota_exceeded':
                return {
                    title: t('analytics.maps.quota_exceeded_title') || 'Quota Exceeded',
                    message: t('analytics.maps.quota_exceeded_desc') || 'Google Maps quota exceeded. Please check your billing settings.',
                    showHelp: false
                };
            case 'billing_required':
                return {
                    title: t('analytics.maps.billing_required_title') || 'Billing Required',
                    message: t('analytics.maps.billing_required_desc') || 'Google Maps requires a billing account. Please enable billing in Google Cloud Console.',
                    showHelp: false
                };
            default:
                return {
                    title: t('analytics.maps.generic_error_title') || 'Map Error',
                    message: t('analytics.maps.generic_error_desc') || 'Unable to load map. Please try again later.',
                    showHelp: false
                };
        }
    };

    // ✅ No location data
    if (locations.length === 0) {
        return (
            <div className={`bg-white rounded-xl shadow-sm border p-6 ${className}`}>
                <div className="text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                        {t('analytics.maps.no_location_data') || 'No Location Data'}
                    </h3>
                    <p className="text-gray-600 text-sm mb-4">
                        {t('analytics.maps.no_location_description') || 'Location data will appear here when visitors share their location through your contact forms.'}
                    </p>
                    <div className="bg-blue-50 rounded-lg p-4 text-left">
                        <h4 className="font-medium text-blue-900 mb-2">
                            {t('analytics.maps.tips_title') || 'Tips to collect location data:'}
                        </h4>
                        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                            <li>{t('analytics.maps.tip_1') || 'Add an exchange info button to your profile'}</li>
                            <li>{t('analytics.maps.tip_2') || 'Encourage visitors to share their location'}</li>
                            <li>{t('analytics.maps.tip_3') || 'Location data helps you understand your audience'}</li>
                        </ul>
                    </div>
                </div>
            </div>
        );
    }

    // ✅ Error state
    if (error) {
        const errorInfo = getErrorMessage();
        
        return (
            <div className={`bg-red-50 border border-red-200 rounded-xl p-6 ${className}`}>
                <div className="text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        {errorInfo.title}
                    </h3>
                    <p className="text-red-600 text-sm mb-4">
                        {errorInfo.message}
                    </p>
                    
                    {/* ✅ Enhanced help section */}
                    {errorInfo.showHelp && (
                        <div className="text-left bg-white rounded-lg p-4 border border-red-200">
                            <h4 className="font-medium text-gray-900 mb-3">Setup Instructions:</h4>
                            <div className="space-y-3 text-sm text-gray-700">
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">1</span>
                                    <div>
                                        <p className="font-medium">Enable Google Maps API</p>
                                        <p className="text-gray-600">Go to <a href="https://console.cloud.google.com/apis/library/maps-backend.googleapis.com" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">Google Cloud Console</a> and enable the Maps JavaScript API</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">2</span>
                                    <div>
                                        <p className="font-medium">Create API Key</p>
                                        <p className="text-gray-600">Create a new API key and restrict it to your domain</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-xs font-semibold">3</span>
                                    <div>
                                        <p className="font-medium">Add to Environment</p>
                                        <p className="text-gray-600">Add <code className="bg-gray-100 px-1 rounded">NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> to your .env.local file</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    }

    // ✅ Map render
    return (
        <div className={`bg-white rounded-xl shadow-sm border overflow-hidden ${className}`}>
            {/* ✅ Enhanced header */}
            <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">
                        {dataSource === 'contacts' ? 
                            (t('analytics.maps.contact_locations') || 'Contact Locations') :
                            (t('analytics.maps.click_locations') || 'Click Locations')
                        }
                    </h3>
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            {locations.length} {t('analytics.maps.locations') || 'locations'}
                        </div>
                        {dataSource === 'contacts' && (
                            <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                                {t('analytics.maps.real_data') || 'Real Data'}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {/* ✅ Map container */}
            <div className="relative">
                {!isLoaded && (
                    <div className="absolute inset-0 bg-gray-100 flex items-center justify-center z-10 h-[400px]">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                            <span className="text-gray-500 text-sm">
                                {t('analytics.maps.loading') || 'Loading map...'}
                            </span>
                        </div>
                    </div>
                )}
                <div 
                    className="h-[400px] w-full" 
                    ref={mapRef}
                    style={{
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        willChange: 'transform',
                    }}
                />
            </div>

            {/* ✅ Enhanced legend */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-4">
                        {dataSource === 'contacts' ? (
                            <>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                    <span className="text-gray-600">
                                        {t('analytics.maps.recent_contacts') || 'Recent (7 days)'}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                                    <span className="text-gray-600">
                                        {t('analytics.maps.older_contacts') || 'Older'}
                                    </span>
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-3 bg-gradient-to-r from-blue-300 via-purple-500 to-red-500 rounded"></div>
                                <span className="text-gray-600">
                                    {t('analytics.maps.heat_intensity') || 'Click intensity'}
                                </span>
                            </div>
                        )}
                    </div>
                    <span className="text-xs text-gray-500">
                        {t('analytics.maps.data_source') || 'Data'}: {dataSource === 'contacts' ? 'Contact forms' : 'Analytics'}
                    </span>
                </div>
            </div>
        </div>
    );
}