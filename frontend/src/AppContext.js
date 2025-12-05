import { createContext, useState, useContext, createElement } from 'react';

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const stored = localStorage.getItem('lang');
      return stored === 'en' ? 'pl' : (stored || 'pl');
    } catch {
      return 'pl';
    }
  });
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const setLang = (newLang) => {
    try {
      // Wymuszamy tylko 'pl' jako dozwolony język
      localStorage.setItem('lang', newLang === 'en' ? 'pl' : newLang);
    } catch (e) {
      console.warn('Failed to save language to localStorage', e);
    }
    setLangState(newLang === 'en' ? 'pl' : newLang);
  };

  const value = {
    lang,
    setLang,
    isSettingsOpen,
    setSettingsOpen,
  };

  return createElement(AppContext.Provider, { value }, children);
}
