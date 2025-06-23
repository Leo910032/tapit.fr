// app/[userId]/components/ExchangeModal.jsx
"use client"
import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslation } from '@/lib/useTranslation';
import { validateEmail } from '@/lib/utilities';
import { toast } from 'react-hot-toast';
import { addContactToProfile } from '@/lib/contacts/addContact';

export default function ExchangeModal({ isOpen, onClose, profileOwnerUsername }) {
    const { t } = useTranslation();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        company: '',
        message: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [errors, setErrors] = useState({});
    const [location, setLocation] = useState(null);
    const [isLocationPermissionGranted, setIsLocationPermissionGranted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            // Check for geolocation permission when the modal opens
            navigator.permissions.query({ name: 'geolocation' }).then((result) => {
                setIsLocationPermissionGranted(result.state === 'granted');
                if (result.state === 'granted') {
                    // Automatically get location if permission is already granted
                    navigator.geolocation.getCurrentPosition(
                        (position) => {
                            setLocation({
                                latitude: position.coords.latitude,
                                longitude: position.coords.longitude,
                            });
                        },
                        () => {
                            // Handle error silently if permission is granted but location fails
                        }
                    );
                }
            });
        }
    }, [isOpen]);

    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        
        if (errors[field]) {
            setErrors(prev => ({
                ...prev,
                [field]: ''
            }));
        }
    };

    const validateForm = () => {
        const newErrors = {};
        
        if (!formData.name.trim()) {
            newErrors.name = t('exchange.name_required');
        }
        
        if (!formData.email.trim()) {
            newErrors.email = t('exchange.email_required');
        } else if (!validateEmail(formData.email)) {
            newErrors.email = t('exchange.email_invalid');
        }
        
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const requestLocation = () => {
        return new Promise((resolve) => {
            if (!navigator.geolocation) {
                toast.error(t('exchange.geolocation_not_supported'));
                return resolve(null);
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    const userLocation = {
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude,
                    };
                    setLocation(userLocation);
                    setIsLocationPermissionGranted(true);
                    resolve(userLocation);
                },
                (error) => {
                    // Handle different error cases
                    if (error.code === error.PERMISSION_DENIED) {
                        toast.error(t('exchange.location_permission_denied'));
                    } else {
                        toast.error(t('exchange.location_retrieval_failed'));
                    }
                    resolve(null);
                }
            );
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setIsSubmitting(true);
        
        try {
            // Attempt to get location if not already set
            let finalLocation = location;
            if (!finalLocation && !isLocationPermissionGranted) {
                finalLocation = await requestLocation();
            }

            const contactData = {
                ...formData,
                submittedAt: new Date().toISOString(),
                profileOwner: profileOwnerUsername,
                location: finalLocation // Add location to the contact data
            };
            
            await addContactToProfile(profileOwnerUsername, contactData);
            
            toast.success(t('exchange.success_message'), {
                style: {
                    border: '1px solid #10B981',
                    padding: '16px',
                    color: '#10B981',
                },
                iconTheme: {
                    primary: '#10B981',
                    secondary: '#FFFAEE',
                },
            });
            
            setFormData({
                name: '',
                email: '',
                phone: '',
                company: '',
                message: ''
            });
            setLocation(null);
            onClose();
            
        } catch (error) {
            console.error('Error submitting contact:', error);
            toast.error(t('exchange.error_message'), {
                style: {
                    border: '1px solid #EF4444',
                    padding: '16px',
                    color: '#EF4444',
                },
                iconTheme: {
                    primary: '#EF4444',
                    secondary: '#FFFAEE',
                },
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                            </svg>
                        </div>
                        <h2 className="text-xl font-bold text-gray-900">
                            {t('exchange.title')}
                        </h2>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                        aria-label={t('exchange.close_modal')}
                    >
                        <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    <p className="text-gray-600 mb-6 text-sm">
                        {t('exchange.description')}
                    </p>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Name Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('exchange.name_label')} *
                            </label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => handleInputChange('name', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                    errors.name ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder={t('exchange.name_placeholder')}
                            />
                            {errors.name && (
                                <p className="text-red-500 text-xs mt-1">{errors.name}</p>
                            )}
                        </div>

                        {/* Email Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('exchange.email_label')} *
                            </label>
                            <input
                                type="email"
                                value={formData.email}
                                onChange={(e) => handleInputChange('email', e.target.value)}
                                className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                                    errors.email ? 'border-red-500' : 'border-gray-300'
                                }`}
                                placeholder={t('exchange.email_placeholder')}
                            />
                            {errors.email && (
                                <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                            )}
                        </div>

                        {/* Phone Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('exchange.phone_label')}
                            </label>
                            <input
                                type="tel"
                                value={formData.phone}
                                onChange={(e) => handleInputChange('phone', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                placeholder={t('exchange.phone_placeholder')}
                            />
                        </div>

                        {/* Company Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('exchange.company_label')}
                            </label>
                            <input
                                type="text"
                                value={formData.company}
                                onChange={(e) => handleInputChange('company', e.target.value)}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors"
                                placeholder={t('exchange.company_placeholder')}
                            />
                        </div>

                        {/* Message Field */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                {t('exchange.message_label')}
                            </label>
                            <textarea
                                value={formData.message}
                                onChange={(e) => handleInputChange('message', e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors resize-none"
                                placeholder={t('exchange.message_placeholder')}
                            />
                        </div>
                        
                        {/* Location Consent */}
                        <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                            <svg className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <div>
                                <h4 className="text-sm font-medium text-gray-800">{t('exchange.location_share_title')}</h4>
                                <p className="text-xs text-gray-500 mt-1">{t('exchange.location_share_description')}</p>
                                {!isLocationPermissionGranted && (
                                    <button
                                        type="button"
                                        onClick={requestLocation}
                                        className="text-xs font-semibold text-blue-600 hover:text-blue-700 mt-2"
                                    >
                                        {t('exchange.share_location_button')}
                                    </button>
                                )}
                                {isLocationPermissionGranted && location && (
                                    <div className="text-xs font-semibold text-green-600 mt-2">
                                        {t('exchange.location_granted_message')}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 py-3 px-4 border border-gray-300 rounded-lg text-gray-700 font-medium hover:bg-gray-50 transition-colors"
                            >
                                {t('exchange.cancel')}
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="flex-1 py-3 px-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-medium rounded-lg hover:from-blue-600 hover:to-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {isSubmitting ? (
                                    <>
                                        <Image 
                                            src="https://linktree.sirv.com/Images/gif/loading.gif" 
                                            width={16} 
                                            height={16} 
                                            alt="loading" 
                                            className="filter invert" 
                                        />
                                        {t('exchange.submitting')}
                                    </>
                                ) : (
                                    <>
                                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                                        </svg>
                                        {t('exchange.submit')}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}