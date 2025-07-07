// app/dashboard/(dashboard pages)/account/components/MyCards.jsx - ENHANCED WITH CARD MODAL
"use client"
import { useState, useEffect } from 'react';
import { fireApp } from '@/important/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { testForActiveSession } from '@/lib/authentication/testForActiveSession';
import { useTranslation } from '@/lib/useTranslation';

export default function MyCards() {
    const { t } = useTranslation();
    const [userCards, setUserCards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedCard, setSelectedCard] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchCards = async () => {
            const userId = testForActiveSession(true);
            if (!userId) {
                setError(t('cards.error_load') || "You must be logged in to view your cards.");
                setIsLoading(false);
                return;
            }

            try {
                const cardsPath = `AccountData/${userId}/userCards`;
                const q = query(collection(fireApp, cardsPath), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);

                const cards = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setUserCards(cards);
                
            } catch (err) {
                console.error("Error fetching user cards:", err);
                setError(t('cards.error_load') || "Could not load your saved cards.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCards();
    }, [t]);

    const openCardModal = (card) => {
        setSelectedCard(card);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedCard(null);
    };

    if (isLoading) {
        return (
            <div className="w-full flex items-center justify-center py-8">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                    <p className="text-gray-600">{t('cards.loading') || 'Loading your saved cards...'}</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full text-center py-8">
                <div className="text-red-500 mb-2">⚠️</div>
                <p className="text-red-500">{error}</p>
            </div>
        );
    }

    if (userCards.length === 0) {
        return (
            <div className="w-full text-center py-8">
                <div className="text-gray-400 text-6xl mb-4">💳</div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {t('cards.no_cards') || 'No Cards Yet'}
                </h3>
                <p className="text-gray-600">
                    {t('cards.no_cards') || "You haven't created any custom cards yet."}
                </p>
            </div>
        );
    }

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold mb-6 text-gray-900">
                {t('cards.my_saved_cards') || 'My Saved Cards'}
            </h2>
            
            {/* Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCards.map(card => (
                    <div 
                        key={card.id} 
                        className="bg-white rounded-xl shadow-sm border hover:shadow-md transition-all duration-200 cursor-pointer group"
                        onClick={() => openCardModal(card)}
                    >
                        {/* Card Preview */}
                        <div className="p-4">
                            <div className="w-full aspect-[500/300] bg-gray-50 rounded-lg overflow-hidden border group-hover:border-blue-200 transition-colors duration-200">
                                <div
                                    className="w-full h-full"
                                    dangerouslySetInnerHTML={{ __html: card.customizedSvg }}
                                />
                            </div>
                        </div>
                        
                        {/* Card Info */}
                        <div className="px-4 pb-4">
                            <div className="flex items-center justify-between">
                                <div className="min-w-0 flex-1">
                                    <h3 className="font-semibold text-lg text-gray-900 truncate">
                                        {card.customName}
                                    </h3>
                                    <p className="text-sm text-gray-500 truncate">
                                        {card.productName}
                                    </p>
                                </div>
                                <div className="ml-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                                    <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                            </div>
                            
                            {/* Creation Date */}
                            {card.createdAt && (
                                <div className="mt-2 text-xs text-gray-400">
                                    Created: {new Date(card.createdAt.seconds * 1000).toLocaleDateString()}
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            {/* Card Modal */}
            {showModal && selectedCard && (
                <CardModal card={selectedCard} onClose={closeModal} />
            )}
        </div>
    );
}

// ✅ NEW: Card Modal Component
const CardModal = ({ card, onClose }) => {
    const { t } = useTranslation();
    const [showBack, setShowBack] = useState(false);

    // Close modal on escape key
    useEffect(() => {
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    // Prevent body scroll when modal is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
                {/* Modal Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            {card.customName}
                        </h3>
                        <p className="text-sm text-gray-500 mt-1">
                            {card.productName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors duration-200 p-2 hover:bg-gray-100 rounded-lg"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Modal Content */}
                <div className="p-6">
                    {/* Card Side Toggle */}
                    <div className="flex items-center justify-center mb-6">
                        <div className="bg-gray-100 p-1 rounded-lg">
                            <button
                                onClick={() => setShowBack(false)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                    !showBack 
                                        ? 'bg-white text-gray-900 shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <span className="mr-2">🎴</span>
                                Front Side
                            </button>
                            <button
                                onClick={() => setShowBack(true)}
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                                    showBack 
                                        ? 'bg-white text-gray-900 shadow-sm' 
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                <span className="mr-2">🔄</span>
                                Back Side
                            </button>
                        </div>
                    </div>

                    {/* Card Display */}
                    <div className="flex justify-center">
                        <div className="w-full max-w-2xl">
                            <div className="aspect-[500/300] bg-gray-50 rounded-xl overflow-hidden border-2 border-gray-200 shadow-lg">
                                <div
                                    className="w-full h-full transition-opacity duration-300"
                                    dangerouslySetInnerHTML={{ 
                                        __html: showBack ? card.backSvg : card.customizedSvg 
                                    }}
                                />
                            </div>
                            
                            {/* No Back Side Message */}
                            {showBack && !card.backSvg && (
                                <div className="absolute inset-0 bg-gray-100 rounded-xl flex items-center justify-center">
                                    <div className="text-center">
                                        <div className="text-4xl mb-3">🎴</div>
                                        <p className="text-gray-600 text-lg font-medium mb-1">
                                            No Back Side Available
                                        </p>
                                        <p className="text-gray-500 text-sm">
                                            This card only has a front design
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Card Details */}
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Left Column */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Card Information</h4>
                                <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Name:</span>
                                        <span className="text-sm font-medium text-gray-900">{card.customName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span className="text-sm text-gray-600">Product:</span>
                                        <span className="text-sm font-medium text-gray-900">{card.productName}</span>
                                    </div>
                                    {card.createdAt && (
                                        <div className="flex justify-between">
                                            <span className="text-sm text-gray-600">Created:</span>
                                            <span className="text-sm font-medium text-gray-900">
                                                {new Date(card.createdAt.seconds * 1000).toLocaleDateString()}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-4">
                            <div>
                                <h4 className="text-sm font-medium text-gray-700 mb-2">Card Actions</h4>
                                <div className="space-y-2">
                                    <button className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors duration-200 text-sm font-medium">
                                        <span className="mr-2">📥</span>
                                        Download Card
                                    </button>
                                    <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium">
                                        <span className="mr-2">✏️</span>
                                        Edit Card
                                    </button>
                                    <button className="w-full bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors duration-200 text-sm font-medium">
                                        <span className="mr-2">📋</span>
                                        Duplicate Card
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Modal Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors duration-200 font-medium"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};