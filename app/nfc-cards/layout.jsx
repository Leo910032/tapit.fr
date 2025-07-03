// app/nfc-cards/layout.jsx - NEW FILE
"use client";

import { useState, useEffect } from 'react';
import NFCLandingNav from '@/app/components/General Components/NFCLandingNav';
import { testForActiveSession } from '@/lib/authentication/testForActiveSession';

export default function NFCCardsLayout({ children }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // This effect will check the login status when the layout loads
  // and re-check it if the user navigates between pages within the layout.
  useEffect(() => {
    // We use testForActiveSession(true) to prevent any unwanted redirects.
    // It will return a userId if logged in, or null if not.
    const user = testForActiveSession(true); 
    setIsLoggedIn(!!user); // Set state to true if user exists, false otherwise
  }, [children]); // Re-run when the page (children) changes

  return (
    <div className="min-h-screen bg-gray-50">
      {/* The navbar now gets its login status from the layout */}
      <NFCLandingNav isLoggedIn={isLoggedIn} />
      
      {/* This is where your page content (checkout, customize, etc.) will be rendered */}
      <main>{children}</main>
    </div>
  );
}