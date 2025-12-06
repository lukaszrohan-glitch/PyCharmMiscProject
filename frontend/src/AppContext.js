import { createContext, useState, useContext, createElement } from 'react';

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    try {
      const stored = localStorage.getItem('lang');
      // Allow only supported languages; default to 'pl'
      return stored === 'en' || stored === 'pl' ? stored : 'pl';
    } catch {
      return 'pl';
    }
  });
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const setLang = (newLang) => {
    try {
      // Persist only supported languages; fallback to 'pl'
      const next = newLang === 'en' || newLang === 'pl' ? newLang : 'pl';
      localStorage.setItem('lang', next);
    } catch (e) {
      console.warn('Failed to save language to localStorage', e);
    }
    setLangState(newLang === 'en' || newLang === 'pl' ? newLang : 'pl');
  };

  const value = {
    lang,
    setLang,
    isSettingsOpen,
    setSettingsOpen,
  };

  return createElement(AppContext.Provider, { value }, children);
}
