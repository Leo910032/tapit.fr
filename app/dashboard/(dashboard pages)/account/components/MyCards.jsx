// app/dashboard/(dashboard pages)/account/components/MyCards.jsx
"use client"
import { useState, useEffect } from 'react';
import { fireApp } from '@/important/firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { testForActiveSession } from '@/lib/authentication/testForActiveSession';

export default function MyCards() {
    const [userCards, setUserCards] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchCards = async () => {
            const userId = testForActiveSession(true);
            if (!userId) {
                setError("You must be logged in to view your cards.");
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
                setError("Could not load your saved cards.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchCards();
    }, []);

    if (isLoading) {
        return <p>Loading your saved cards...</p>;
    }

    if (error) {
        return <p className="text-red-500">{error}</p>;
    }

    if (userCards.length === 0) {
        return <p>You havent created any custom cards yet.</p>;
    }

    return (
        <div className="w-full">
            <h2 className="text-2xl font-bold mb-4">My Saved Cards</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {userCards.map(card => (
                    <div key={card.id} className="bg-white p-4 rounded-lg shadow">
                        <div
                            className="w-full aspect-[500/300] bg-gray-100 rounded-md overflow-hidden"
                            dangerouslySetInnerHTML={{ __html: card.customizedSvg }}
                        />
                        <div className="mt-3">
                            <p className="font-semibold text-lg">{card.customName}</p>
                            <p className="text-sm text-gray-500">{card.productName}</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}