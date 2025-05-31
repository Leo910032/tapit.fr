// components/ContactsMap.jsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Loader } from '@googlemaps/js-api-loader';

export default function ContactsMap({ contacts = [], selectedContactId = null, onMarkerClick = null }) {
    const mapRef = useRef(null);
    const mapInstanceRef = useRef(null);
    const markersRef = useRef([]);
    const [isLoaded, setIsLoaded] = useState(false);
    const [error, setError] = useState(null);

    // Filter contacts that have location data
    const contactsWithLocation = contacts.filter(contact => 
        contact.location && 
        contact.location.latitude && 
        contact.location.longitude &&
        !isNaN(contact.location.latitude) &&
        !isNaN(contact.location.longitude)
    );

    useEffect(() => {
        let isMounted = true;

        const initializeMap = async () => {
            try {
                const loader = new Loader({
                    apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "AIzaSyATAmD5lVb1jZe6pGoeZGF5OU-8-hrLeF4",
                    version: 'weekly',
                    libraries: ['maps', 'marker']
                });

                const { Map } = await loader.importLibrary('maps');
                const { AdvancedMarkerElement } = await loader.importLibrary('marker');

                if (!isMounted || !mapRef.current) return;

                // Calculate center point from contacts or use default
                let centerLocation = { lat: 39.60128890889341, lng: -9.069839810859907 };
                let initialZoom = 15;
                
                if (contactsWithLocation.length > 0) {
                    if (contactsWithLocation.length === 1) {
                        // Single contact - center on that contact
                        centerLocation = { 
                            lat: contactsWithLocation[0].location.latitude, 
                            lng: contactsWithLocation[0].location.longitude 
                        };
                        initialZoom = 16;
                    } else {
                        // Multiple contacts - calculate center
                        const avgLat = contactsWithLocation.reduce((sum, contact) => 
                            sum + contact.location.latitude, 0) / contactsWithLocation.length;
                        const avgLng = contactsWithLocation.reduce((sum, contact) => 
                            sum + contact.location.longitude, 0) / contactsWithLocation.length;
                        
                        centerLocation = { lat: avgLat, lng: avgLng };
                        initialZoom = 10;
                    }
                }

                const mapOptions = {
                    center: centerLocation,
                    zoom: initialZoom,
                    mapId: 'CONTACTS_MAP_ID',
                    gestureHandling: 'greedy',
                    disableDefaultUI: false,
                    mapTypeControl: true,
                    streetViewControl: true,
                    fullscreenControl: true,
                    zoomControl: true,
                    clickableIcons: false,
                    keyboardShortcuts: false,
                    styles: [
                        {
                            featureType: 'poi',
                            elementType: 'labels',
                            stylers: [{ visibility: 'off' }]
                        }
                    ]
                };

                const map = new Map(mapRef.current, mapOptions);
                mapInstanceRef.current = map;

                // Clear existing markers
                markersRef.current.forEach(marker => {
                    if (marker.map) marker.map = null;
                });
                markersRef.current = [];

                // Create markers for each contact with location
                contactsWithLocation.forEach((contact, index) => {
                    const position = {
                        lat: contact.location.latitude,
                        lng: contact.location.longitude
                    };

                    // Create custom marker element
                    const markerElement = document.createElement('div');
                    markerElement.className = `contact-marker ${selectedContactId === contact.id ? 'selected' : ''}`;
                    
                    // Determine marker color based on contact status
                    let statusColor = 'from-blue-400 to-purple-500'; // default
                    if (contact.status === 'new') statusColor = 'from-blue-500 to-blue-600';
                    if (contact.status === 'viewed') statusColor = 'from-green-500 to-green-600';
                    if (contact.status === 'archived') statusColor = 'from-gray-400 to-gray-500';
                    
                    markerElement.innerHTML = `
                        <div class="marker-content">
                            <div class="marker-avatar bg-gradient-to-br ${statusColor}">${contact.name.charAt(0).toUpperCase()}</div>
                            <div class="marker-label">${contact.name}</div>
                            <div class="marker-info">${contact.email}</div>
                        </div>
                    `;

                    const marker = new AdvancedMarkerElement({
                        map,
                        position,
                        content: markerElement,
                        title: `${contact.name} - ${contact.email}`,
                    });

                    // Add click listener
                    markerElement.addEventListener('click', () => {
                        // Remove selected class from all markers
                        markersRef.current.forEach(m => {
                            if (m.content) {
                                m.content.classList.remove('selected');
                            }
                        });
                        
                        // Add selected class to clicked marker
                        markerElement.classList.add('selected');
                        
                        // Call callback if provided
                        if (onMarkerClick) {
                            onMarkerClick(contact);
                        }
                        
                        // Center map on marker with smooth animation
                        map.panTo(position);
                        if (map.getZoom() < 16) {
                            map.setZoom(16);
                        }
                    });

                    // Add hover effects
                    markerElement.addEventListener('mouseenter', () => {
                        markerElement.style.transform = 'scale(1.1)';
                        markerElement.style.zIndex = '1000';
                    });

                    markerElement.addEventListener('mouseleave', () => {
                        if (!markerElement.classList.contains('selected')) {
                            markerElement.style.transform = 'scale(1)';
                            markerElement.style.zIndex = '1';
                        }
                    });

                    markersRef.current.push(marker);
                });

                // Fit map to show all markers if multiple contacts
                if (contactsWithLocation.length > 1) {
                    const bounds = new google.maps.LatLngBounds();
                    contactsWithLocation.forEach(contact => {
                        bounds.extend({
                            lat: contact.location.latitude,
                            lng: contact.location.longitude
                        });
                    });
                    map.fitBounds(bounds, { padding: 50 });
                }

                // If there's a selected contact, highlight it
                if (selectedContactId) {
                    const selectedMarker = markersRef.current.find(marker => {
                        const contact = contactsWithLocation.find(c => c.id === selectedContactId);
                        return contact && marker.position.lat === contact.location.latitude;
                    });
                    
                    if (selectedMarker && selectedMarker.content) {
                        selectedMarker.content.classList.add('selected');
                        selectedMarker.content.style.transform = 'scale(1.2)';
                        selectedMarker.content.style.zIndex = '1000';
                    }
                }

                map.addListener('idle', () => {
                    if (isMounted) {
                        setIsLoaded(true);
                    }
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
    }, [contacts, selectedContactId]);

    // No contacts with location
    if (contactsWithLocation.length === 0) {
        return (
            <div className="h-[600px] w-full rounded-lg border border-gray-200 bg-gray-50 flex items-center justify-center">
                <div className="text-center p-6 max-w-md">
                    <div className="text-gray-400 mb-4">
                        <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-2">No Location Data Available</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">
                        No contacts have shared their location yet. When visitors submit contact forms with location permission granted, their locations will appear on this map.
                    </p>
                    <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700">
                            💡 Tip: Location tracking helps you understand your audience's geographic distribution and can be useful for local networking or events.
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="h-[600px] w-full rounded-lg border border-red-200 bg-red-50 flex items-center justify-center">
                <div className="text-center p-6 max-w-md">
                    <div className="text-red-600 mb-4">
                        <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">Map Loading Error</h3>
                    <p className="text-red-600 text-sm mb-3">{error}</p>
                    <p className="text-xs text-red-500">
                        Please check your Google Maps API key configuration or try refreshing the page.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <>
            <style jsx>{`
                .contact-marker {
                    cursor: pointer;
                    transition: all 0.2s ease;
                    position: relative;
                    z-index: 1;
                }
                .contact-marker:hover {
                    transform: scale(1.1);
                    z-index: 1000;
                }
                .contact-marker.selected {
                    transform: scale(1.2);
                    z-index: 1000;
                }
                .marker-content {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 4px;
                    filter: drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1));
                }
                .marker-avatar {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    color: white;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    font-weight: bold;
                    font-size: 14px;
                    border: 3px solid white;
                    box-shadow: 0 2px 8px rgba(0,0,0,0.15);
                    transition: all 0.2s ease;
                }
                .marker-label {
                    background: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 11px;
                    font-weight: 600;
                    color: #374151;
                    border: 1px solid #e5e7eb;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.1);
                    white-space: nowrap;
                    max-width: 120px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                }
                .marker-info {
                    background: rgba(59, 130, 246, 0.9);
                    color: white;
                    padding: 2px 6px;
                    border-radius: 8px;
                    font-size: 9px;
                    font-weight: 500;
                    white-space: nowrap;
                    max-width: 140px;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    opacity: 0;
                    transition: opacity 0.2s ease;
                }
                .contact-marker:hover .marker-info,
                .contact-marker.selected .marker-info {
                    opacity: 1;
                }
                .contact-marker.selected .marker-avatar {
                    border-color: #f59e0b;
                    box-shadow: 0 0 0 2px #fbbf24, 0 4px 12px rgba(0,0,0,0.2);
                }
                .contact-marker.selected .marker-label {
                    background: #fbbf24;
                    color: #92400e;
                    border-color: #f59e0b;
                }
            `}</style>
            
            <div className="relative">
                {!isLoaded && (
                    <div className="absolute inset-0 bg-gray-100 rounded-lg flex items-center justify-center z-10">
                        <div className="flex flex-col items-center space-y-3">
                            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
                            <span className="text-gray-500 text-sm font-medium">
                                Loading map with {contactsWithLocation.length} contact{contactsWithLocation.length !== 1 ? 's' : ''}...
                            </span>
                        </div>
                    </div>
                )}
                
                <div 
                    className="h-[600px] w-full rounded-lg overflow-hidden border border-gray-200" 
                    ref={mapRef}
                    style={{
                        transform: 'translateZ(0)',
                        backfaceVisibility: 'hidden',
                        willChange: 'transform',
                        transition: 'none !important',
                    }}
                />
                
                {/* Map Legend */}
                {isLoaded && (
                    <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-lg border max-w-xs">
                        <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                            <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            </svg>
                            Contact Locations
                        </h4>
                        
                        <div className="space-y-2 text-xs">
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-blue-500 to-blue-600"></div>
                                <span className="text-gray-600">New contacts</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-green-500 to-green-600"></div>
                                <span className="text-gray-600">Viewed contacts</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="w-4 h-4 rounded-full bg-gradient-to-br from-gray-400 to-gray-500"></div>
                                <span className="text-gray-600">Archived contacts</span>
                            </div>
                        </div>
                        
                        <div className="mt-3 pt-3 border-t border-gray-200">
                            <div className="text-xs text-gray-500">
                                Total: <span className="font-semibold text-gray-700">{contactsWithLocation.length}</span> located contact{contactsWithLocation.length !== 1 ? 's' : ''}
                            </div>
                        </div>
                    </div>
                )}

                {/* Zoom Controls Info */}
                {isLoaded && contactsWithLocation.length > 1 && (
                    <div className="absolute bottom-4 left-4 bg-white p-2 rounded-lg shadow border text-xs text-gray-500">
                        💡 Click any marker to focus on that contact's location
                    </div>
                )}
            </div>
        </>
    );
}