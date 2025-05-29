// lib/languageContext.js
"use client"
import { createContext, useState, useEffect, useContext } from 'react';
import Cookies from 'js-cookie';

const LanguageContext = createContext();

export const LanguageProvider = ({ children }) => {
  const [locale, setLocale] = useState('en');
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize language from cookie or browser language if available
  useEffect(() => {
    if (!isInitialized) {
      // Only run once on first render
      const savedLanguage = Cookies.get('language');
      if (savedLanguage) {
        setLocale(savedLanguage);
      } else {
        // If no saved language, detect browser language
        if (typeof window !== 'undefined') {
            const browserLang = navigator.language?.split('-')[0]; // 'zh-CN' -> 'zh'
            if (browserLang && ['en', 'fr', 'es', 'vi', 'zh'].includes(browserLang)) {
              setLocale(browserLang);
            }
        }
      }
      setIsInitialized(true);
    }
  }, [isInitialized]);

  const changeLanguage = (newLocale) => {
    if (newLocale === locale) return;
    
    setLocale(newLocale);
    Cookies.set('language', newLocale, { expires: 365 }); // Save in cookie for a year
  };

  return (
    <LanguageContext.Provider value={{ locale, changeLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    // Provide a default context if used outside provider to prevent null errors
    return { locale: 'en', changeLanguage: () => {} };
  }
  return context;
};