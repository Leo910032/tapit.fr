// lib/authentication/testForActiveSession.jsx
import { getSessionCookie } from "./session";

export const testForActiveSession = (skipRedirect = false) => {
    const sessionUsername = getSessionCookie("adminLinker");
    
    if (!sessionUsername) {
        // If skipRedirect is true, just return null without redirecting
        if (skipRedirect) {
            return null;
        }
        
        // Check if we're on an NFC route
        if (typeof window !== 'undefined' && window.location.pathname.startsWith('/nfc-cards')) {
            // For NFC routes, don't redirect - let the component handle it
            console.log('🔵 NFC route detected, not redirecting from testForActiveSession');
            return null;
        }
        
        // For all other routes, redirect to login as before
        window.location.href = "/login";
        return null;
    }
    
    return sessionUsername;
}