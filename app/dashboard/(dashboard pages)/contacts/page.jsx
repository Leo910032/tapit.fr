// app/dashboard/(dashboard pages)/contacts/page.jsx
"use client"
import { useEffect, useState } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { testForActiveSession } from '@/lib/authentication/testForActiveSession';
import { fireApp } from '@/important/firebase';
import { collection, doc, onSnapshot, updateDoc } from 'firebase/firestore';
import Image from 'next/image';
import { toast } from 'react-hot-toast';

export default function ContactsPage() {
    const { t } = useTranslation();
    const [contacts, setContacts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all'); // all, new, viewed, archived
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedContacts, setSelectedContacts] = useState([]);

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

    useEffect(() => {
        const currentUser = testForActiveSession();
        if (!currentUser) {
            setLoading(false);
            return;
        }

        const contactsRef = doc(collection(fireApp, "Contacts"), currentUser);
        
        const unsubscribe = onSnapshot(contactsRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                setContacts(data.contacts || []);
            } else {
                setContacts([]);
            }
            setLoading(false);
        }, (error) => {
            console.error('Error fetching contacts:', error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

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
            
            toast.success('Contact status updated', {
                style: {
                    border: '1px solid #10B981',
                    padding: '16px',
                    color: '#10B981',
                },
            });
        } catch (error) {
            console.error('Error updating contact status:', error);
            toast.error('Failed to update contact status');
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
            toast.success(`${selectedContacts.length} contacts updated`);
        } catch (error) {
            console.error('Error performing bulk action:', error);
            toast.error('Failed to update contacts');
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
                <span className="ml-3">Loading contacts...</span>
            </div>
        );
    }

    return (
        <div className="flex-1 py-2 flex flex-col max-h-full overflow-y-auto pb-20">
            <div className="p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {t('contacts.title') || 'Contact List'}
                    </h1>
                    <p className="text-gray-600">
                        {t('contacts.subtitle') || 'Manage contacts who have shared their information through your profile'}
                    </p>
                </div>

                {/* Filters and Search */}
                <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                        {/* Status Filters */}
                        <div className="flex gap-2 flex-wrap">
                            {[
                                { key: 'all', label: 'All' },
                                { key: 'new', label: 'New' },
                                { key: 'viewed', label: 'Viewed' },
                                { key: 'archived', label: 'Archived' }
                            ].map(({ key, label }) => (
                                <button
                                    key={key}
                                    onClick={() => setFilter(key)}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        filter === key
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {label} ({counts[key]})
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search contacts..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full lg:w-64"
                            />
                            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedContacts.length > 0 && (
                        <div className="mt-4 p-4 bg-blue-50 rounded-lg flex items-center justify-between">
                            <span className="text-sm font-medium text-blue-900">
                                {selectedContacts.length} contact(s) selected
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handleBulkAction('viewed')}
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700"
                                >
                                    Mark as Viewed
                                </button>
                                <button
                                    onClick={() => handleBulkAction('archived')}
                                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700"
                                >
                                    Archive
                                </button>
                                <button
                                    onClick={() => handleBulkAction('delete')}
                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700"
                                >
                                    Delete
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
                                {searchTerm || filter !== 'all' ? 'No contacts found' : 'No contacts yet'}
                            </h3>
                            <p className="text-gray-500">
                                {searchTerm || filter !== 'all' 
                                    ? 'Try adjusting your search or filters'
                                    : 'Contacts will appear here when visitors share their information through your profile'
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

                                            {/* Avatar */}
                                            <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-full flex items-center justify-center text-white font-semibold text-lg">
                                                {contact.name.charAt(0).toUpperCase()}
                                            </div>

                                            {/* Contact Info */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="text-lg font-semibold text-gray-900">
                                                        {contact.name}
                                                    </h3>
                                                    <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(contact.status)}`}>
                                                        {contact.status}
                                                    </span>
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
                                                </div>
                                                
                                                {contact.message && (
                                                    <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                                                        <p className="text-sm text-gray-700 italic">
                                                            "{contact.message}"
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 ml-4">
                                            {contact.status === 'new' && (
                                                <button
                                                    onClick={() => updateContactStatus(contact.id, 'viewed')}
                                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                                                >
                                                    Mark as Viewed
                                                </button>
                                            )}
                                            
                                            {contact.status !== 'archived' && (
                                                <button
                                                    onClick={() => updateContactStatus(contact.id, 'archived')}
                                                    className="px-3 py-1 text-xs bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                                                >
                                                    Archive
                                                </button>
                                            )}
                                            
                                            {contact.status === 'archived' && (
                                                <button
                                                    onClick={() => updateContactStatus(contact.id, 'viewed')}
                                                    className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                                                >
                                                    Restore
                                                </button>
                                            )}

                                            {/* Export/Contact Actions */}
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => window.open(`mailto:${contact.email}`, '_blank')}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Send Email"
                                                >
                                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                                    </svg>
                                                </button>
                                                
                                                {contact.phone && (
                                                    <button
                                                        onClick={() => window.open(`tel:${contact.phone}`, '_blank')}
                                                        className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                                                        title="Call"
                                                    >
                                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
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

                {/* Export All Button */}
                {contacts.length > 0 && (
                    <div className="mt-6 text-center">
                        <button
                            onClick={() => {
                                // Export contacts as CSV
                                const csvContent = [
                                    ['Name', 'Email', 'Phone', 'Company', 'Message', 'Status', 'Submitted At'],
                                    ...filteredContacts.map(contact => [
                                        contact.name,
                                        contact.email,
                                        contact.phone || '',
                                        contact.company || '',
                                        contact.message || '',
                                        contact.status,
                                        formatDate(contact.submittedAt)
                                    ])
                                ].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
                                
                                const blob = new Blob([csvContent], { type: 'text/csv' });
                                const url = window.URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.href = url;
                                link.download = `contacts-${new Date().toISOString().split('T')[0]}.csv`;
                                link.click();
                                window.URL.revokeObjectURL(url);
                            }}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 mx-auto"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            Export Contacts ({filteredContacts.length})
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}
