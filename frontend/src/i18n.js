// i18n.js
import { useCallback } from 'react';

const translations = {
  pl: {
    skip_to_content: 'Przejdź do treści',
    brand_tagline: 'System Zarządzania Produkcją',
    menu: 'Menu',
    settings: 'Ustawienia',
    logout: 'Wyloguj',
    pending_orders: 'Oczekujące zamówienia',
    switch_to_dark: 'Przełącz na tryb ciemny',
    switch_to_light: 'Przełącz na tryb jasny',
    dashboard: 'Panel główny',
    orders: 'Zamówienia',
    inventory: 'Magazyn',
    timesheets: 'Karty pracy',
    reports: 'Raporty'
  },
  en: {
    skip_to_content: 'Skip to content',
    brand_tagline: 'Manufacturing Management System',
    menu: 'Menu',
    settings: 'Settings',
    logout: 'Sign out',
    pending_orders: 'Pending orders',
    switch_to_dark: 'Switch to dark mode',
    switch_to_light: 'Switch to light mode',
    dashboard: 'Dashboard',
    orders: 'Orders',
    inventory: 'Inventory',
    timesheets: 'Timesheets',
    reports: 'Reports'
  }
};

export function useI18n() {
  // Get current language from localStorage or default to 'pl'
  const currentLang = localStorage.getItem('lang') || 'pl';

  const t = useCallback((key) => {
    return translations[currentLang]?.[key] || key;
  }, [currentLang]);

  return { t };
}
