// app/dashboard/(dashboard pages)/analytics/components/ContactsAnalytics.jsx
"use client"
import React, { useEffect, useState } from "react";
import { fireApp } from "@/important/firebase";
import { collection, doc, onSnapshot } from "firebase/firestore";
import { useTranslation } from "@/lib/useTranslation";
import GoogleMaps from "./GoogleMaps"; // Assuming this is a map component for contacts

export default function ContactsAnalytics({ userId, isConnected }) {
    const { t } = useTranslation();
    const [contactsData, setContactsData] = useState(null);
    const [contactsList, setContactsList] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) return;

        let unsubscribe = null;

        const setupContactsListener = () => {
            try {
                const contactsRef = doc(collection(fireApp, "Contacts"), userId);
                
                unsubscribe = onSnapshot(contactsRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const data = docSnapshot.data();
                        const contacts = data.contacts || [];
                        
                        setContactsList(contacts);
                        
                        const analytics = {
                            totalContacts: contacts.length,
                            contactsWithLocation: contacts.filter(c => c.location && c.location.latitude).length,
                            contactsWithoutLocation: contacts.filter(c => !c.location || !c.location.latitude).length,
                            locationStats: data.locationStats || {},
                            recentContacts: contacts
                                .sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt))
                                .slice(0, 5),
                            lastUpdated: data.lastUpdated
                        };
                        
                        setContactsData(analytics);
                    } else {
                        setContactsList([]);
                        setContactsData({
                            totalContacts: 0,
                            contactsWithLocation: 0,
                            contactsWithoutLocation: 0,
                            locationStats: {},
                            recentContacts: []
                        });
                    }
                    
                    setIsLoading(false);
                }, (error) => {
                    console.error("Error in contacts listener:", error);
                    setError(error.message);
                    setIsLoading(false);
                });

            } catch (err) {
                console.error("Error setting up contacts listener:", err);
                setError(err.message);
                setIsLoading(false);
            }
        };

        setupContactsListener();

        return () => {
            if (unsubscribe) {
                unsubscribe();
            }
        };
    }, [userId]);

    if (isLoading) {
        return (
            <div className="space-y-6">
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <div className="animate-pulse">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="space-y-3">
                            <div className="h-4 bg-gray-200 rounded w-full"></div>
                            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 rounded-xl p-6">
                <div className="text-center">
                    <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" /></svg>
                    </div>
                    <h3 className="text-lg font-semibold text-red-800 mb-2">{t('analytics.contacts.error_title') || 'Contacts Error'}</h3>
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Contacts Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white rounded-lg shadow-sm border p-4 relative">
                    {isConnected && <div className="absolute top-2 right-2 animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>}
                    <div className="flex items-center gap-3">
                        <div className="bg-blue-100 p-2 rounded-lg"><svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t('analytics.contacts.total_contacts') || 'Total Contacts'}</p>
                            <p className="text-2xl font-bold text-gray-900">{contactsData?.totalContacts || 0}</p>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4 relative">
                    {isConnected && <div className="absolute top-2 right-2 animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>}
                    <div className="flex items-center gap-3">
                        <div className="bg-green-100 p-2 rounded-lg"><svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg></div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t('analytics.contacts.with_location') || 'With Location'}</p>
                            <p className="text-2xl font-bold text-gray-900">{contactsData?.contactsWithLocation || 0}</p>
                            {contactsData?.totalContacts > 0 && <p className="text-xs text-gray-500">{Math.round((contactsData.contactsWithLocation / contactsData.totalContacts) * 100)}% share location</p>}
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-sm border p-4 relative">
                    {isConnected && <div className="absolute top-2 right-2 animate-pulse bg-green-500 w-2 h-2 rounded-full"></div>}
                    <div className="flex items-center gap-3">
                        <div className="bg-purple-100 p-2 rounded-lg"><svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                        <div>
                            <p className="text-sm font-medium text-gray-600">{t('analytics.contacts.permission_rate') || 'Permission Rate'}</p>
                            <p className="text-2xl font-bold text-gray-900">{contactsData?.totalContacts > 0 ? Math.round((contactsData.locationStats.locationGranted || 0) / contactsData.totalContacts * 100) : 0}%</p>
                            <p className="text-xs text-gray-500">{contactsData?.locationStats.locationGranted || 0} granted</p>
                        </div>
                    </div>
                </div>
            </div>

            <GoogleMaps contactsData={contactsList} className="mb-6"/>

            {contactsData?.recentContacts && contactsData.recentContacts.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border">
                    <div className="p-6 border-b border-gray-200">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold text-gray-900">{t('analytics.contacts.recent_contacts') || 'Recent Contacts'}</h3>
                            {isConnected && <div className="flex items-center gap-2"><div className="animate-pulse bg-green-500 w-2 h-2 rounded-full"></div><span className="text-xs text-green-600">Live</span></div>}
                        </div>
                    </div>
                    
                    <div className="divide-y divide-gray-200">
                        {contactsData.recentContacts.map((contact) => (
                            <div key={contact.id || contact.email} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-3 mb-2">
                                            <div className="flex-shrink-0"><div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center"><span className="text-sm font-medium text-blue-600">{contact.name.charAt(0).toUpperCase()}</span></div></div>
                                            <div className="flex-1 min-w-0"><p className="text-sm font-medium text-gray-900 truncate">{contact.name}</p><p className="text-sm text-gray-500 truncate">{contact.email}</p></div>
                                        </div>
                                        
                                        {contact.company && <p className="text-xs text-gray-600 mb-1">🏢 {contact.company}</p>}
                                        
                                        {contact.message && (
                                            <p className="text-xs text-gray-600 bg-gray-100 rounded p-2 mb-2">
                                                "{contact.message.substring(0, 100)}{contact.message.length > 100 ? '...' : ''}"
                                            </p>
                                        )}
                                        
                                        <div className="flex items-center gap-4 text-xs text-gray-500">
                                            <span>📅 {new Date(contact.submittedAt).toLocaleDateString()}</span>
                                            {contact.location && contact.location.latitude && (
                                                <span className="flex items-center gap-1 text-green-600">
                                                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /></svg>
                                                    Location shared
                                                    {contact.location.accuracy && <span className="text-gray-500">(~{Math.round(contact.location.accuracy)}m)</span>}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                    
                                    <div className="flex-shrink-0 ml-4">
                                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${contact.status === 'new' ? 'bg-blue-100 text-blue-800' : contact.status === 'contacted' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>{contact.status || 'new'}</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    
                    {contactsData.totalContacts > 5 && (
                        <div className="p-4 border-t border-gray-200 text-center">
                            <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">{t('analytics.contacts.view_all') || `View All ${contactsData.totalContacts} Contacts`}</button>
                        </div>
                    )}
                </div>
            )}

            {contactsData?.locationStats && Object.keys(contactsData.locationStats).length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('analytics.contacts.location_breakdown') || 'Location Permission Breakdown'}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-green-50 rounded-lg">
                            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2"><svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg></div>
                            <p className="text-2xl font-bold text-green-600">{contactsData.locationStats.locationGranted || 0}</p>
                            <p className="text-sm text-gray-600">{t('analytics.contacts.location_granted') || 'Granted'}</p>
                        </div>
                        <div className="text-center p-4 bg-red-50 rounded-lg">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-2"><svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></div>
                            <p className="text-2xl font-bold text-red-600">{contactsData.locationStats.locationDenied || 0}</p>
                            <p className="text-sm text-gray-600">{t('analytics.contacts.location_denied') || 'Denied'}</p>
                        </div>
                        <div className="text-center p-4 bg-gray-50 rounded-lg">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-2"><svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg></div>
                            <p className="text-2xl font-bold text-gray-600">{contactsData.locationStats.locationUnavailable || 0}</p>
                            <p className="text-sm text-gray-600">{t('analytics.contacts.location_unavailable') || 'Unavailable'}</p>
                        </div>
                    </div>
                    
                    <div className="mt-6">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm font-medium text-gray-700">{t('analytics.contacts.location_share_rate') || 'Location Share Rate'}</span>
                            <span className="text-sm text-gray-500">{contactsData.totalContacts > 0 ? Math.round((contactsData.locationStats.locationGranted || 0) / contactsData.totalContacts * 100) : 0}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                            <div className="bg-green-500 h-2 rounded-full transition-all duration-500" style={{ width: contactsData.totalContacts > 0 ? `${(contactsData.locationStats.locationGranted || 0) / contactsData.totalContacts * 100}%` : '0%' }}></div>
                        </div>
                    </div>
                </div>
            )}

            {(!contactsData || contactsData.totalContacts === 0) && (
                <div className="bg-white rounded-xl shadow-sm border p-8">
                    <div className="text-center">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg></div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('analytics.contacts.no_contacts_title') || 'No Contacts Yet'}</h3>
                        <p className="text-gray-600 text-sm mb-4">{t('analytics.contacts.no_contacts_description') || 'Contact submissions will appear here when visitors use your exchange info form.'}</p>
                        <div className="bg-blue-50 rounded-lg p-4 text-left">
                            <h4 className="font-medium text-blue-900 mb-2">{t('analytics.contacts.tips_title') || 'Tips to get more contacts:'}</h4>
                            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                                <li>{t('analytics.contacts.tip_1') || 'Share your profile link on social media'}</li>
                                <li>{t('analytics.contacts.tip_2') || 'Add an exchange info button to your profile'}</li>
                                <li>{t('analytics.contacts.tip_3') || 'Include a call-to-action in your bio'}</li>
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}