// app/dashboard/(dashboard pages)/contacts/page.jsx - Updated with edit contact functionality
"use client"
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { testForActiveSession } from '@/lib/authentication/testForActiveSession';
import { fireApp } from '@/important/firebase';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { toast } from 'react-hot-toast';
import dynamic from 'next/dynamic';

// Create a separate loading component that has access to useTranslation
function MapLoadingComponent() {
    const { t } = useTranslation();
    
    return (
        <div className="h-[600px] w-full rounded-lg border border-gray-200 bg-gray-100 flex items-center justify-center">
            <div className="flex flex-col items-center space-y-2">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
                <span className="text-gray-500 text-sm">{t('contacts.loading_map')}</span>
            </div>
        </div>
    );
}

// Dynamically import the map component to avoid SSR issues
const ContactsMap = dynamic(() => import('./components/ContactsMap'), {
    ssr: false,
    loading: () => <MapLoadingComponent />
});

// Edit Contact Modal Component
function EditContactModal({ contact, isOpen, onClose, onSave }) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: '',
        status: 'new'
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (contact) {
            setFormData({
                name: contact.name || '',
                email: contact.email || '',
                phone: contact.phone || '',
                company: contact.company || '',
                message: contact.message || '',
                status: contact.status || 'new'
            });
        }
    }, [contact]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            const updatedContact = {
                ...contact,
                ...formData,
                lastModified: new Date().toISOString()
            };
            
            await onSave(updatedContact);
            toast.success(t('contacts.contact_updated_successfully'));
            onClose();
        } catch (error) {
            console.error('Error updating contact:', error);
            toast.error(t('contacts.failed_to_update_contact'));
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[10000]">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto">
                <div className="flex items-center justify-between p-6 border-b">
                    <h2 className="text-xl font-semibold text-gray-900">
                        {t('contacts.edit_contact')}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        disabled={isSubmitting}
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Name Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('contacts.name')} *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Email Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('contacts.email')} *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Phone Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('contacts.phone')}
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Company Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('contacts.company')}
                        </label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Status Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('contacts.status')}
                        </label>
                        <select
                            value={formData.status}
                            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={isSubmitting}
                        >
                            <option value="new">{t('contacts.status_new')}</option>
                            <option value="viewed">{t('contacts.status_viewed')}</option>
                            <option value="archived">{t('contacts.status_archived')}</option>
                        </select>
                    </div>

                    {/* Message Field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            {t('contacts.message')}
                        </label>
                        <textarea
                            value={formData.message}
                            onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            rows={4}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-vertical"
                            disabled={isSubmitting}
                        />
                    </div>

                    {/* Contact Info */}
                    <div className="bg-gray-50 rounded-lg p-4">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">{t('contacts.contact_info')}</h4>
                        <div className="space-y-1 text-sm text-gray-600">
                            <div>{t('contacts.submitted_at')}: {new Date(contact?.submittedAt).toLocaleString()}</div>
                            {contact?.lastModified && (
                                <div>{t('contacts.last_modified')}: {new Date(contact.lastModified).toLocaleString()}</div>
                            )}
                            <div>{t('contacts.contact_id')}: {contact?.id}</div>
                        </div>
                    </div>

                    {/* Submit Buttons */}
                    <div className="flex justify-end gap-3 pt-4 border-t">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            disabled={isSubmitting}
                        >
                            {t('common.cancel')}
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {isSubmitting ? t('contacts.saving') : t('contacts.save_changes')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default function ContactsPage() {
    const { t } = useTranslation();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, new, viewed, archived
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);
    
    // Map related state
    const [showMap, setShowMap] = useState(false);
    const [selectedContactForMap, setSelectedContactForMap] = useState(null);
    const [locationStats, setLocationStats] = useState({
        total: 0,
        withLocation: 0,
        withoutLocation: 0
    });

    // Edit modal state
    const [editingContact, setEditingContact] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);

    // Filter contacts based on status and search term
    const filteredContacts = contacts.filter(contact => {
        const matchesFilter = filter === 'all' || contact.status === filter;
        const matchesSearch = !searchTerm || 
            contact.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            contact.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (contact.company && contact.company.toLowerCase().includes(searchTerm.toLowerCase()));
        
        return matchesFilter && matchesSearch;
    });

    // Get counts for each status
    const counts = {
        all: contacts.length,
        new: contacts.filter(c => c.status === 'new').length,
        viewed: contacts.filter(c => c.status === 'viewed').length,
        archived: contacts.filter(c => c.status === 'archived').length
    };

    // Calculate location statistics
    useEffect(() => {
        const withLocation = contacts.filter(c => c.location && c.location.latitude).length;
        setLocationStats({
            total: contacts.length,
            withLocation,
            withoutLocation: contacts.length - withLocation
        });
    }, [contacts]);

    // Hide/show navigation when map is opened/closed
    useEffect(() => {
        const navbar = document.querySelector('nav'); // Adjust selector based on your nav structure
        const header = document.querySelector('header'); // Adjust selector based on your header structure
        
        if (showMap) {
            // Hide navigation elements
            if (navbar) navbar.style.display = 'none';
            if (header) header.style.display = 'none';
            // Prevent body scroll
            document.body.style.overflow = 'hidden';
        } else {
            // Show navigation elements
            if (navbar) navbar.style.display = '';
            if (header) header.style.display = '';
            // Restore body scroll
            document.body.style.overflow = '';
        }

        // Cleanup function to restore nav if component unmounts while map is open
        return () => {
            if (navbar) navbar.style.display = '';
            if (header) header.style.display = '';
            document.body.style.overflow = '';
        };
    }, [showMap]);

    // Real-time Firebase listener
    useEffect(() => {
        const currentUser = testForActiveSession();
        if (!currentUser) {
            setLoading(false);
            return;
        }

        console.log('🔥 Setting up real-time contacts listener for user:', currentUser);
        
        const contactsRef = doc(collection(fireApp, "Contacts"), currentUser);
        
        const unsubscribe = onSnapshot(contactsRef, (docSnapshot) => {
            console.log('📱 Contacts document updated!');
            
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                const newContacts = data.contacts || [];
                
                console.log('📊 Updated contacts count:', newContacts.length);
                
                const prevContactsCount = contacts.length;
                const newContactsCount = newContacts.length;
                
                setContacts(newContacts);
                
                // Show notification for new contacts (only if not initial load)
                if (!loading && newContactsCount > prevContactsCount) {
                    const newContactsAdded = newContactsCount - prevContactsCount;
                    const hasLocation = newContacts.slice(-newContactsAdded).some(c => c.location);
                    
                    toast.success(
                        t('contacts.new_contacts_notification', { 
                            count: newContactsAdded,
                            plural: newContactsAdded > 1 ? 's' : '',
                            location: hasLocation ? ' 📍' : ''
                        }), 
                        {
                            style: {
                                border: '1px solid #10B981',
                                padding: '16px',
                                color: '#10B981',
                            },
                            duration: 4000,
                            icon: '📧',
                        }
                    );
                }
            } else {
                console.log('📭 No contacts document found');
                setContacts([]);
            }
            
            setLoading(false);
        }, (error) => {
            console.error('❌ Error in contacts listener:', error);
            toast.error(t('contacts.failed_to_load'));
            setLoading(false);
        });

        return () => {
            console.log('🧹 Cleaning up contacts listener');
            unsubscribe();
        };
    }, []);

    // Map functions
    const openContactMap = (contact = null) => {
        setSelectedContactForMap(contact);
        setShowMap(true);
    };

    const closeMap = () => {
        setShowMap(false);
        setSelectedContactForMap(null);
    };

    // Edit functions
    const openEditModal = (contact) => {
        setEditingContact(contact);
        setShowEditModal(true);
    };

    const closeEditModal = () => {
        setEditingContact(null);
        setShowEditModal(false);
    };

    const saveEditedContact = async (updatedContact) => {
        try {
            const currentUser = testForActiveSession();
            const contactsRef = doc(collection(fireApp, "Contacts"), currentUser);
            
            const updatedContacts = contacts.map(contact => 
                contact.id === updatedContact.id 
                    ? updatedContact
                    : contact
            );
            
            await updateDoc(contactsRef, {
                contacts: updatedContacts,
                lastUpdated: new Date().toISOString()
            });
            
        } catch (error) {
            console.error('Error saving edited contact:', error);
            throw error;
        }
    };

    const updateContactStatus = async (contactId, newStatus) => {
        try {
            const currentUser = testForActiveSession();
            const contactsRef = doc(collection(fireApp, "Contacts"), currentUser);
            
            const updatedContacts = contacts.map(contact => 
                contact.id === contactId 
                    ? { ...contact, status: newStatus }
                    : contact
            );
            
            await updateDoc(contactsRef, {
                contacts: updatedContacts,
                lastUpdated: new Date().toISOString()
            });
            
            toast.success(t('contacts.status_updated'));
        } catch (error) {
            console.error('Error updating contact status:', error);
            toast.error(t('contacts.failed_to_update_status'));
        }
    };

    const handleBulkAction = async (action) => {
        if (selectedContacts.length === 0) return;
        
        try {
            const currentUser = testForActiveSession();
            const contactsRef = doc(collection(fireApp, "Contacts"), currentUser);
            
            let updatedContacts;
            
            if (action === 'delete') {
                updatedContacts = contacts.filter(contact => !selectedContacts.includes(contact.id));
            } else {
                updatedContacts = contacts.map(contact => 
                    selectedContacts.includes(contact.id)
                        ? { ...contact, status: action }
                        : contact
                );
            }
            
            await updateDoc(contactsRef, {
                contacts: updatedContacts,
                lastUpdated: new Date().toISOString()
            });
            
            setSelectedContacts([]);
            toast.success(t('contacts.bulk_update_success', { count: selectedContacts.length }));
        } catch (error) {
            console.error('Error performing bulk action:', error);
            toast.error(t('contacts.failed_to_update_contacts'));
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'new': return 'bg-blue-100 text-blue-800';
            case 'viewed': return 'bg-green-100 text-green-800';
            case 'archived': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[400px]">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                <span className="ml-3">{t('contacts.loading')}</span>
            </div>
        );
    }

    return (
        <div className="flex-1 py-2 flex flex-col max-h-full overflow-y-auto pb-20">
            {/* Edit Contact Modal */}
            <EditContactModal
                contact={editingContact}
                isOpen={showEditModal}
                onClose={closeEditModal}
                onSave={saveEditedContact}
            />

            {/* Map Modal - Updated with better positioning and full screen coverage */}
            {showMap && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-2 z-[9999]">
                    <div className="bg-white rounded-xl shadow-xl w-full h-full mt-20 max-w-[98vw] max-h-[85vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b flex-shrink-0">
                            <h2 className="text-xl font-semibold">
                                {selectedContactForMap 
                                    ? t('contacts.location_for_contact', { name: selectedContactForMap.name })
                                    : t('contacts.all_contact_locations')
                                }
                            </h2>
                            <button
                                onClick={closeMap}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        <div className="flex-1 p-4 min-h-0">
                            <ContactsMap
                                contacts={selectedContactForMap ? [selectedContactForMap] : contacts.filter(c => c.location?.latitude)}
                                selectedContact={selectedContactForMap}
                            />
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('contacts.title')}
                    </h1>
                    <p className="text-gray-600">
                        {t('contacts.subtitle')}
                    </p>
                    
                    {/* Status indicators */}
                    <div className="flex items-center gap-4 mt-3">
                        <div className="flex items-center text-sm text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                            {t('contacts.live_updates_enabled')}
                        </div>
                        
                     
                    </div>
                </div>
{/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Status Filter Dropdown */}
                        <div className="flex items-center gap-4">
                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    {t('contacts.filter_by_status')}
                                </label>
                                <select
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value)}
                                    className="appearance-none bg-white border border-gray-300 rounded-lg px-4 py-2 pr-10 text-sm font-medium text-gray-700 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors min-w-[160px]"
                                >
                                    <option value="all">
                                        {t('contacts.filter_all')} ({counts.all})
                                    </option>
                                    <option value="new">
                                        {t('contacts.filter_new')} ({counts.new})
                                    </option>
                                    <option value="viewed">
                                        {t('contacts.filter_viewed')} ({counts.viewed})
                                    </option>
                                    <option value="archived">
                                        {t('contacts.filter_archived')} ({counts.archived})
                                    </option>
                                </select>
                                {/* Custom dropdown arrow */}
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none mt-6">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                          
                        </div>

                        {/* Search and Map Button */}
                        <div className="flex gap-3 items-center">
                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder={t('contacts.search_placeholder')}
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full mt-6 lg:w-64"
                                />
                                <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400 mt-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                            </div>
                            
                            {/* Map Button */}
                            <button
                                onClick={() => openContactMap()}
                                disabled={locationStats.withLocation === 0}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-300  disabled:cursor-not-allowed transition-colors flex items-center mt-6 gap-2"
                                title={locationStats.withLocation === 0 ? t('contacts.no_location_data') : t('contacts.view_all_locations')}
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                {t('contacts.map_button')} ({locationStats.withLocation})
                            </button>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedContacts.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">
                                {t('contacts.selected_contacts', { count: selectedContacts.length })}
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleBulkAction('viewed')}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    {t('contacts.mark_as_viewed')}
                                </button>
                                <button
                                    onClick={() => handleBulkAction('archived')}
                                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    {t('contacts.archive')}
                                </button>
                                <button
                                    onClick={() => handleBulkAction('delete')}
                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    {t('common.delete')}
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Contacts List */}
                <div className="bg-white rounded-xl shadow-sm border">
                    {filteredContacts.length === 0 ? (
                        <div className="p-12 text-center">
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                {searchTerm || filter !== 'all' ? t('contacts.no_contacts_found') : t('contacts.no_contacts_yet')}
                            </h3>
                            <p className="text-gray-500">
                                {searchTerm || filter !== 'all' 
                                    ? t('contacts.try_adjusting_filters')
                                    : t('contacts.contacts_will_appear_here')
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {filteredContacts.map((contact) => (
                                <div key={contact.id} className="p-6 hover:bg-gray-50 transition-colors">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-start gap-4 flex-1">
                                            {/* Checkbox */}
                                            <input
                                                type="checkbox"
                                                checked={selectedContacts.includes(contact.id)}
                                                onChange={(e) => {
                                                    if (e.target.checked) {
                                                        setSelectedContacts([...selectedContacts, contact.id]);
                                                    } else {
                                                        setSelectedContacts(selectedContacts.filter(id => id !== contact.id));
                                                    }
                                                }}
                                                className="mt-1 h-4 w-4 text-blue-600 rounded border-gray-300"
                                            />

                                            {/* Avatar with location indicator */}
                                            <div className="relative">
                                                <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                    {contact.name.charAt(0).toUpperCase()}
                                                </div>
                                                {contact.location && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                                                        </svg>
                                                    </div>
                                                )}
                                                {/* Modified indicator */}
                                                {contact.lastModified && (
                                                    <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-orange-500 rounded-full border-2 border-white flex items-center justify-center">
                                                        <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 24 24">
                                                            <path d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04c.39-.39.39-1.02 0-1.41l-2.34-2.34c-.39-.39-1.02-.39-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"/>
                                                        </svg>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Contact Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {contact.name}
                                                    </h3>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact.status)}`}>
                                                        {t(`contacts.status_${contact.status}`)}
                                                    </span>
                                                    {contact.location && (
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                                                            📍 {t('contacts.located')}
                                                        </span>
                                                    )}
                                                    {contact.lastModified && (
                                                        <span className="inline-flex px-2 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                                                            ✏️ {t('contacts.modified')}
                                                        </span>
                                                    )}
                                                </div>
                                                
                                                <div className="space-y-1 text-sm text-gray-600">
                                                    <div className="flex items-center gap-2">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                        </svg>
                                                        <a href={`mailto:${contact.email}`} className="hover:text-blue-600">
                                                            {contact.email}
                                                        </a>
                                                    </div>
                                                    
                                                    {contact.phone && (
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                            </svg>
                                                            <a href={`tel:${contact.phone}`} className="hover:text-blue-600">
                                                                {contact.phone}
                                                            </a>
                                                        </div>
                                                    )}
                                                    
                                                    {contact.company && (
                                                        <div className="flex items-center gap-2">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                                            </svg>
                                                            <span>{contact.company}</span>
                                                        </div>
                                                    )}
                                                    
                                                    <div className="flex items-center gap-2 text-gray-500">
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                        <span>{formatDate(contact.submittedAt)}</span>
                                                    </div>
                                                    
                                                    {contact.lastModified && (
                                                        <div className="flex items-center gap-2 text-orange-600">
                                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                            </svg>
                                                            <span className="text-xs">{t('contacts.last_modified')}: {formatDate(contact.lastModified)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {contact.message && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-sm text-gray-700 italic">
                                                            &quot;{contact.message}&quot;
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 ml-4">
                                            {/* Edit Button */}
                                            <button
                                                onClick={() => openEditModal(contact)}
                                                className="px-3 py-1 text-xs bg-orange-600 text-white rounded hover:bg-orange-700 transition-colors flex items-center gap-1"
                                                title={t('contacts.edit_contact')}
                                            >
                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                {t('contacts.edit')}
                                            </button>

                                            {contact.status === 'new' && (
                                                <button
                                                    onClick={() => updateContactStatus(contact.id, 'viewed')}
                                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                                >
                                                    {t('contacts.mark_as_viewed')}
                                                </button>
                                            )}
                                            
                                            {contact.status !== 'archived' && (
                                                <button
                                                    onClick={() => updateContactStatus(contact.id, 'archived')}
                                                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                                >
                                                    {t('contacts.archive')}
                                                </button>
                                            )}
                                            
                                            {contact.status === 'archived' && (
                                                <button
                                                    onClick={() => updateContactStatus(contact.id, 'viewed')}
                                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                >
                                                    {t('contacts.restore')}
                                                </button>
                                            )}

                                            {/* Contact Actions */}
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title={t('contacts.send_email')}
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                                
                                                {contact.phone && (
                                                    <button
                                                        onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        title={t('contacts.call')}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                                        </svg>
                                                    </button>
                                                )}
                                                
                                                {/* Map button - only show if contact has location */}
                                                {contact.location && contact.location.latitude && (
                                                    <button
                                                        onClick={() => openContactMap(contact)}
                                                        className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded transition-colors"
                                                        title={t('contacts.view_location_on_map')}
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                                        </svg>
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}