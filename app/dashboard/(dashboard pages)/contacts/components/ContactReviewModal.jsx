// app/dashboard/(dashboard pages)/contacts/components/ContactReviewModal.jsx
"use client"
import { useState, useEffect } from 'react';
import { useTranslation } from '@/lib/useTranslation';
import { toast } from 'react-hot-toast';

export default function ContactReviewModal({ isOpen, onClose, parsedContact, onSave }) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        title: '',
        message: 'Contact added via business card scan'
    });
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (parsedContact) {
            setFormData({
                name: parsedContact.name || '',
                email: parsedContact.email || '',
                phone: parsedContact.phone || '',
                company: parsedContact.company || '',
                title: parsedContact.title || '',
                message: 'Contact added via business card scan'
            });
        }
    }, [parsedContact]);

    const handleSave = async () => {
        if (!formData.name.trim() || !formData.email.trim()) {
            toast.error('Name and email are required');
            return;
        }

        setIsSaving(true);
        try {
            const newContact = {
                id: `card_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                name: formData.name.trim(),
                email: formData.email.trim().toLowerCase(),
                phone: formData.phone.trim(),
                company: formData.company.trim(),
                title: formData.title.trim(),
                message: formData.message,
                status: 'new',
                submittedAt: new Date().toISOString(),
                source: 'business_card_scan'
            };

            await onSave(newContact);
            toast.success('Contact added successfully!');
            onClose();
        } catch (error) {
            console.error('Error saving contact:', error);
            toast.error('Failed to save contact');
        } finally {
            setIsSaving(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
                
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b">
                    <h3 className="text-lg font-semibold text-gray-900">
                        ✏️ Review Contact Details
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <p className="text-sm text-gray-600">
                        Review and edit the extracted information before saving:
                    </p>

                    {/* Name field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name *
                        </label>
                        <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter full name"
                        />
                    </div>

                    {/* Email field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter email address"
                        />
                    </div>

                    {/* Phone field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                        </label>
                        <input
                            type="tel"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter phone number"
                        />
                    </div>

                    {/* Company field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Company
                        </label>
                        <input
                            type="text"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter company name"
                        />
                    </div>

                    {/* Title field */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Job Title
                        </label>
                        <input
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Enter job title"
                        />
                    </div>

                    {/* Action buttons */}
                    <div className="flex gap-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={isSaving || !formData.name.trim() || !formData.email.trim()}
                            className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                        >
                            {isSaving && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                            )}
                            {isSaving ? 'Saving...' : '💾 Save Contact'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}