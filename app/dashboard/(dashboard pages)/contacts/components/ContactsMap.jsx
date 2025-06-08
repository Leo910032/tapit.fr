// components/ContactsMap.jsx - Mobile Optimized Version (Fixed)
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';
import { useTranslation } from '@/lib/useTranslation';

export default function ContactsMap({ contacts = [], selectedContactId = null, onMarkerClick = null }) {
    const { t } = useTranslation();
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);
    const [showLegend, setShowLegend] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    // Check if device is mobile
    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        
        checkMobile();
        window.addEventListener('resize', checkMobile);
        
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    const contactsWithLocation = contacts.filter(contact =>
        contact.location &&
        contact.location.latitude &&
        contact.location.longitude &&
        !isNaN(contact.location.latitude) &&
        !isNaN(contact.location.longitude)
    );

    // Get contact counts by status
    const contactCounts = {
        new: contactsWithLocation.filter(c => c.status === 'new').length,
        viewed: contactsWithLocation.filter(c => c.status === 'viewed').length,
        archived: contactsWithLocation.filter(c => c.status === 'archived').length,
        total: contactsWithLocation.length
    };

    useEffect(() => {
        let isMounted = true;

        const initializeMap = async () => {
            try {
                const loader = new Loader({
                    apiKey: process.env.NEXT_PUBLIC_Maps_API_KEY || "AIzaSyATAmD5lVb1jZe6pGoeZGF5OU-8-hrLeF4",
                    version: 'weekly',
                    libraries: ['maps', 'marker']
                });

                const { Map } = await loader.importLibrary('maps');
                const { AdvancedMarkerElement } = await loader.importLibrary('marker');

                if (!isMounted || !mapRef.current) return;

                let centerLocation = { lat: 39.60128890889341, lng: -9.069839810859907 };
                let initialZoom = 15;

                if (contactsWithLocation.length > 0) {
                    if (contactsWithLocation.length === 1) {
                        centerLocation = {
                            lat: contactsWithLocation[0].location.latitude,
                            lng: contactsWithLocation[0].location.longitude
                        };
                        initialZoom = 16;
                    } else {
                        const avgLat = contactsWithLocation.reduce((sum, contact) =>
                            sum + contact.location.latitude, 0) / contactsWithLocation.length;
                        const avgLng = contactsWithLocation.reduce((sum, contact) =>
                            sum + contact.location.longitude, 0) / contactsWithLocation.length;
                        centerLocation = { lat: avgLat, lng: avgLng };
                        initialZoom = isMobile ? 12 : 10;
                    }
                }

                // Fixed map options - Use mapId for AdvancedMarkers but without custom styles
                const mapOptions = {
                    center: centerLocation,
                    zoom: initialZoom,
                    mapId: 'DEMO_MAP_ID', // Required for AdvancedMarkerElement
                    gestureHandling: 'greedy',
                    disableDefaultUI: isMobile,
                    mapTypeControl: !isMobile,
                    streetViewControl: !isMobile,
                    fullscreenControl: !isMobile,
                    zoomControl: true,
                    clickableIcons: false,
                    keyboardShortcuts: false,
                    mapTypeId: 'roadmap' // Start with roadmap (plan view) instead of satellite
                    // Note: Cannot use custom styles when mapId is present
                };

                const map = new Map(mapRef.current, mapOptions);
                mapInstanceRef.current = map;

                // Clear existing markers
                markersRef.current.forEach(marker => {
                    if (marker.map) marker.map = null;
                });
                markersRef.current = [];

                // Create markers for each contact
                contactsWithLocation.forEach((contact) => {
                    const position = {
                        lat: contact.location.latitude,
                        lng: contact.location.longitude
                    };

                    const markerElement = document.createElement('div');
                    markerElement.className = 'contact-marker';
                    if (selectedContactId === contact.id) {
                        markerElement.classList.add('selected');
                    }

                    // Create marker based on status
                    let backgroundColor;
                    switch (contact.status) {
                        case 'new':
                            backgroundColor = '#3B82F6'; // Blue
                            break;
                        case 'viewed':
                            backgroundColor = '#10B981'; // Green
                            break;
                        case 'archived':
                            backgroundColor = '#6B7280'; // Gray
                            break;
                        default:
                            backgroundColor = '#3B82F6';
                    }

                    const markerContent = `
                        <div style="
                            width: 40px;
                            height: 40px;
                            background: ${backgroundColor};
                            border: 3px solid white;
                            border-radius: 50%;
                            display: flex;
                            align-items: center;
                            justify-content: center;
                            color: white;
                            font-weight: bold;
                            font-size: 14px;
                            box-shadow: 0 2px 6px rgba(0,0,0,0.3);
                            cursor: pointer;
                            transition: transform 0.2s;
                        " onmouseover="this.style.transform='scale(1.1)'" onmouseout="this.style.transform='scale(1)'">
                            ${contact.name.charAt(0).toUpperCase()}
                        </div>
                    `;

                    markerElement.innerHTML = markerContent;

                    const marker = new AdvancedMarkerElement({
                        map,
                        position,
                        content: markerElement,
                        title: `${contact.name} - ${contact.email}`,
                    });

                    markerElement.addEventListener('click', () => {
                        // Remove selection from all markers
                        markersRef.current.forEach(m => {
                            m.content?.classList.remove('selected');
                        });
                        
                        // Add selection to clicked marker
                        markerElement.classList.add('selected');
                        
                        if (onMarkerClick) {
                            onMarkerClick(contact);
                        }
                        
                        // Center map on clicked marker
                        map.panTo(position);
                        if (map.getZoom() < 16) {
                            map.setZoom(16);
                        }
                    });

                    markersRef.current.push(marker);
                });

                // Fit bounds if multiple contacts
                if (contactsWithLocation.length > 1) {
                    const bounds = new google.maps.LatLngBounds();
                    contactsWithLocation.forEach(contact => {
                        bounds.extend({
                            lat: contact.location.latitude,
                            lng: contact.location.longitude
                        });
                    });
                    map.fitBounds(bounds, { padding: isMobile ? 20 : 50 });
                }

                map.addListener('idle', () => {
                    if (isMounted) setIsLoaded(true);
                });

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
                setError(t('map.failed_to_load', { error: error.message }) || `Failed to load Google Maps: ${error.message}`);
                setIsLoaded(true);
            }
        };

        if (mapRef.current) {
            initializeMap();
        }

        return () => {
            isMounted = false;
        };
    }, [contacts, selectedContactId, isMobile]);

    if (contactsWithLocation.length === 0) {
        return (
            <div className="h-[400px] w-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                <div className="text-center p-6 max-w-md">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                        {t('map.no_location_data_title') || 'Aucune donnée de localisation'}
                    </h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        {t('map.no_location_data_description') || 'Aucun contact avec localisation trouvé'}
                    </p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[400px] w-full rounded-lg border border-red-200 bg-red-50 flex items-center justify-center">
                <div className="text-center p-6 max-w-md">
                    <div className="text-red-600 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">
                        {t('map.loading_error_title') || 'Erreur de chargement'}
                    </h3>
                    <p className="text-red-600 text-sm mb-3">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="relative h-full w-full">
            {!isLoaded && (
                <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
                    <div className="flex flex-col items-center space-y-3">
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                        <span className="text-gray-500 text-sm font-medium">
                            Chargement de {contactsWithLocation.length} contact{contactsWithLocation.length !== 1 ? 's' : ''}...
                        </span>
                    </div>
                </div>
            )}
            
            {/* Map Container */}
            <div 
                className="h-full w-full rounded-lg overflow-hidden border border-gray-200"
                ref={mapRef}
            />
            
            {/* Mobile Legend Toggle Button */}
            {isLoaded && isMobile && (
                <button
                    onClick={() => setShowLegend(!showLegend)}
                    className="absolute top-4 left-4 bg-white p-3 rounded-lg shadow-lg border flex items-center gap-2 z-20"
                >
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    </svg>
                    <span className="text-sm font-medium text-gray-700">
                        Localisations des contacts
                    </span>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                        {contactCounts.total}
                    </span>
                </button>
            )}

            {/* Desktop Legend - Left Side */}
            {isLoaded && !isMobile && (
                <div className="absolute top-16 left-3 bg-white p-4 rounded-lg shadow-lg border min-w-48 z-20">
                    <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        </svg>
                        Localisations des contacts
                    </h4>
                    
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-blue-500 border-2 border-white shadow"></div>
                                <span className="text-gray-600">Nouveaux contacts</span>
                            </div>
                            <span className="font-medium text-blue-600">{contactCounts.new}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-green-500 border-2 border-white shadow"></div>
                                <span className="text-gray-600">Contacts vus</span>
                            </div>
                            <span className="font-medium text-green-600">{contactCounts.viewed}</span>
                        </div>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-gray-500 border-2 border-white shadow"></div>
                                <span className="text-gray-600">Contacts archivés</span>
                            </div>
                            <span className="font-medium text-gray-600">{contactCounts.archived}</span>
                        </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200">
                        <div className="text-xs text-gray-500">
                            Total : <span className="font-semibold text-gray-700">{contactCounts.total}</span> contact{contactCounts.total !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            )}

            {/* Mobile Legend Overlay */}
            {isLoaded && isMobile && showLegend && (
                <div className="absolute inset-x-4 top-16 bg-white p-4 rounded-lg shadow-lg border z-30">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-sm">
                            Localisations des contacts
                        </h4>
                        <button
                            onClick={() => setShowLegend(false)}
                            className="p-1 text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-3 text-xs">
                        <div className="text-center">
                            <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow mx-auto mb-1"></div>
                            <div className="font-medium text-blue-600">{contactCounts.new}</div>
                            <div className="text-gray-600">Nouveaux contacts</div>
                        </div>
                        <div className="text-center">
                            <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white shadow mx-auto mb-1"></div>
                            <div className="font-medium text-green-600">{contactCounts.viewed}</div>
                            <div className="text-gray-600">Contacts vus</div>
                        </div>
                        <div className="text-center">
                            <div className="w-6 h-6 rounded-full bg-gray-500 border-2 border-white shadow mx-auto mb-1"></div>
                            <div className="font-medium text-gray-600">{contactCounts.archived}</div>
                            <div className="text-gray-600">Contacts archivés</div>
                        </div>
                    </div>
                    
                    <div className="mt-3 pt-3 border-t border-gray-200 text-center">
                        <div className="text-xs text-gray-500">
                            Total : <span className="font-semibold text-gray-700">{contactCounts.total}</span> contact{contactCounts.total !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>
            )}



            {/* Helper Text (Mobile) */}
            {isLoaded && isMobile && contactsWithLocation.length > 1 && (
                <div className="absolute bottom-4 left-4 right-4 bg-white p-2 rounded-lg shadow border text-xs text-gray-500 text-center">
                    💡 Cliquez sur les marqueurs pour voir plus d'informations
                </div>
            )}

            {/* Helper Text (Desktop) */}
            {isLoaded && !isMobile && contactsWithLocation.length > 1 && (
                <div className="absolute bottom-8 left-2 bg-white p-2 rounded-lg shadow border text-xs text-gray-500">
                    💡 Cliquez sur les marqueurs pour voir plus d'informations
                </div>
            )}
        </div>
    );
}