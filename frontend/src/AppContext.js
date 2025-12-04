import { createContext, useState, useContext, createElement } from 'react';

const AppContext = createContext();

export function useAppContext() {
  return useContext(AppContext);
}

export function AppProvider({ children }) {
  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem('lang') || 'pl';
    } catch {
      return 'pl';
    }
  });
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  const value = {
    lang,
    setLang,
    isSettingsOpen,
    setSettingsOpen,
  };

  return createElement(AppContext.Provider, { value }, children);
}
