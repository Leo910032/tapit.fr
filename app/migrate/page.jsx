// app/migrate/page.jsx - Create this file temporarily
"use client"
import { useState } from "react";
import { migrateUsersToLookupTable } from "@/lib/userLookup";

export default function MigratePage() {
    const [isRunning, setIsRunning] = useState(false);
    const [isComplete, setIsComplete] = useState(false);
    const [error, setError] = useState(null);

    const handleMigration = async () => {
        if (isRunning || isComplete) return;
        
        const confirm = window.confirm(
            "This will migrate all existing users to the lookup table. " +
            "This should only be run ONCE. Are you sure you want to continue?"
        );
        
        if (!confirm) {
            console.log("❌ Migration cancelled by user");
            return;
        }
        
        setIsRunning(true);
        setError(null);
        
        try {
            console.log("🚀 Starting migration to lookup table...");
            await migrateUsersToLookupTable();
            
            console.log("✅ Migration completed successfully!");
            setIsComplete(true);
            alert("Migration completed successfully! Check the console for details.");
            
        } catch (error) {
            console.error("❌ Migration failed:", error);
            setError(error.message);
            alert("Migration failed! Check the console for details.");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div style={{ 
            padding: '40px', 
            fontFamily: 'Arial, sans-serif', 
            maxWidth: '600px', 
            margin: '0 auto',
            backgroundColor: '#f9f9f9',
            minHeight: '100vh'
        }}>
            <h1 style={{ color: '#8129D9', textAlign: 'center' }}>
                🚀 Lookup Table Migration
            </h1>
            
            <div style={{ 
                backgroundColor: 'white', 
                padding: '30px', 
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                marginBottom: '20px'
            }}>
                <p>This will migrate all existing users to the new lookup table system for faster analytics.</p>
                <p><strong>⚠️ Important: Only run this ONCE!</strong></p>
                
                {!isComplete && !isRunning && (
                    <button 
                        onClick={handleMigration}
                        style={{
                            backgroundColor: '#8129D9',
                            color: 'white',
                            padding: '15px 30px',
                            border: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            cursor: 'pointer',
                            width: '100%',
                            marginTop: '20px'
                        }}
                    >
                        🚀 Start Migration
                    </button>
                )}
                
                {isRunning && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '20px',
                        backgroundColor: '#fff3cd',
                        borderRadius: '8px',
                        marginTop: '20px'
                    }}>
                        <p>⏳ Migration in progress... Please wait and check the console for updates.</p>
                        <div style={{ 
                            width: '40px', 
                            height: '40px', 
                            border: '4px solid #f3f3f3',
                            borderTop: '4px solid #8129D9',
                            borderRadius: '50%',
                            animation: 'spin 1s linear infinite',
                            margin: '0 auto'
                        }}></div>
                    </div>
                )}
                
                {isComplete && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '20px',
                        backgroundColor: '#d4edda',
                        borderRadius: '8px',
                        marginTop: '20px'
                    }}>
                        <p>✅ Migration completed successfully!</p>
                        <p>🎉 Your lookup table is now ready for ultra-fast link tracking!</p>
                        <p><strong>You can now delete this page.</strong></p>
                    </div>
                )}
                
                {error && (
                    <div style={{ 
                        textAlign: 'center', 
                        padding: '20px',
                        backgroundColor: '#f8d7da',
                        borderRadius: '8px',
                        marginTop: '20px'
                    }}>
                        <p>❌ Migration failed: {error}</p>
                        <p>Check the console for more details.</p>
                    </div>
                )}
            </div>
            
            <div style={{ 
                backgroundColor: 'white', 
                padding: '20px', 
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
            }}>
                <h3 style={{ color: '#8129D9' }}>What this does:</h3>
                <ul style={{ lineHeight: '1.6' }}>
                    <li>✅ Creates lookup table entries for all existing users</li>
                    <li>✅ Maps usernames, display names, and emails to user IDs</li>
                    <li>✅ Enables ultra-fast link click tracking</li>
                    <li>✅ No existing data is modified or deleted</li>
                </ul>
            </div>
            
            <style jsx>{`
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}