// lib/useTranslation.js
"use client"
import { useLanguage } from './languageContext';

// Import translations
import enTranslations from '../public/locales/en/common.json';
import frTranslations from '../public/locales/fr/common.json';
import esTranslations from '../public/locales/es/common.json';
import viTranslations from '../public/locales/vm/common.json';
import zhTranslations from '../public/locales/ch/common.json';



const translations = {
  en: enTranslations,
  fr: frTranslations,
  es: esTranslations,
  vm: viTranslations,  // Add this line
  zh: zhTranslations

};

export const useTranslation = () => {
  const { locale } = useLanguage();
  
  // Simple translation function that gets nested translations
  const t = (key) => {
    try {
      // Split the key by dots to navigate nested objects
      const keys = key.split('.');
      
      // Start with the translations for the current locale or fallback to English
      let result = translations[locale] || translations.en;
      
      // Navigate through the nested object
      for (const k of keys) {
        if (result[k] === undefined) {
          // If translation not found, return the key
          return key;
        }
        result = result[k];
      }
      
      return result;
    } catch (error) {
      // If any error occurs during translation, return the key
      console.error(`Translation error for key: ${key}`, error);
      return key;
    }
  };
  
  return { t, locale };
};

export default useTranslation;