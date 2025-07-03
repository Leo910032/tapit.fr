// lib/authentication/testForActiveSession.jsx
import { getSessionCookie } from "./session";

export const testForActiveSession = (skipRedirect = false) => {
    const sessionUsername = getSessionCookie("adminLinker");
    
    if (!sessionUsername) {
        // If skipRedirect is true, just return null without redirecting
        if (skipRedirect) {
            console.log('🔵 skipRedirect=true, returning null');
            return null;
        }
        
        // Check if we're on an NFC route or other public routes
        if (typeof window !== 'undefined') {
            const pathname = window.location.pathname;
            console.log('🔍 Checking pathname for redirect:', pathname);
            
            // List of routes that should NOT redirect to login
            const publicRoutes = [
                '/nfc-cards',
                '/login', 
                '/signup',
                '/forgot-password',
                '/reset-password',
                '/'
            ];
            
            // Check if current route starts with any public route
            const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));
            
            if (isPublicRoute) {
                console.log('🔵 Public route detected, not redirecting:', pathname);
                return null;
            }
            
            console.log('❌ Protected route, redirecting to login from:', pathname);
        }
        
        // For protected routes, redirect to login
        if (typeof window !== 'undefined') {
            window.location.href = "/login";
        }
        return null;
    }
    
    console.log('✅ Session found:', sessionUsername);
    return sessionUsername;
}