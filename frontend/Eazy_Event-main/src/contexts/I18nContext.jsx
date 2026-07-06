import React, { createContext, useContext, useState } from 'react';

const translations = {
  en: {
    // Common
    home: 'Home',
    events: 'Events',
    create: 'Create Event',
    dashboard: 'Dashboard',
    settings: 'Settings',
    support: 'Support',
    signIn: 'Sign In',
    signUp: 'Get Started',
    logout: 'Sign Out',
    search: 'Search',
    loading: 'Loading...',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    // Events
    upcomingEvents: 'Upcoming Events',
    createEvent: 'Create Your Event',
    eventDetails: 'Event Details',
    register: 'Register',
    registered: 'Registered',
    free: 'FREE',
    // Auth
    welcomeBack: 'Welcome back',
    signInToContinue: 'Sign in to your account to continue',
    forgotPassword: 'Forgot your password?',
    noAccount: "Don't have an account?",
    // Misc
    noResults: 'No results found',
    tryAgain: 'Try Again',
    showMore: 'Show More',
  },
  hi: {
    // Common
    home: 'होम',
    events: 'इवेंट्स',
    create: 'इवेंट बनाएं',
    dashboard: 'डैशबोर्ड',
    settings: 'सेटिंग्स',
    support: 'सहायता',
    signIn: 'साइन इन',
    signUp: 'शुरू करें',
    logout: 'लॉग आउट',
    search: 'खोजें',
    loading: 'लोड हो रहा है...',
    save: 'सेव करें',
    cancel: 'रद्द करें',
    delete: 'हटाएं',
    edit: 'संपादित करें',
    // Events
    upcomingEvents: 'आगामी इवेंट्स',
    createEvent: 'अपना इवेंट बनाएं',
    eventDetails: 'इवेंट विवरण',
    register: 'रजिस्टर करें',
    registered: 'रजिस्टर्ड',
    free: 'मुफ्त',
    // Auth
    welcomeBack: 'वापस स्वागत है',
    signInToContinue: 'जारी रखने के लिए साइन इन करें',
    forgotPassword: 'पासवर्ड भूल गए?',
    noAccount: 'खाता नहीं है?',
    // Misc
    noResults: 'कोई परिणाम नहीं मिला',
    tryAgain: 'पुनः प्रयास करें',
    showMore: 'और दिखाएं',
  }
};

const I18nContext = createContext();

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) return { t: (key) => key, lang: 'en', setLang: () => {} };
  return context;
};

export const I18nProvider = ({ children }) => {
  const [lang, setLang] = useState(() => localStorage.getItem('lang') || 'en');

  const t = (key) => translations[lang]?.[key] || translations.en[key] || key;

  const changeLang = (newLang) => {
    setLang(newLang);
    localStorage.setItem('lang', newLang);
  };

  return (
    <I18nContext.Provider value={{ t, lang, setLang: changeLang, languages: ['en', 'hi'] }}>
      {children}
    </I18nContext.Provider>
  );
};
