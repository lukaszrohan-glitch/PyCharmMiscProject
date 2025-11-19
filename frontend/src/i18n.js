// i18n.js
import { useCallback } from 'react';
import plExtra from './locales/pl.js';

// Base dictionaries used across the app
const base = {
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
  },
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
  }
};

// Merge in component-level Polish keys from locales/pl.js
// plExtra can override or extend base Polish translations
const translations = {
  en: base.en,
  pl: { ...base.pl, ...plExtra }
};

export function useI18n() {
  // Get current language from localStorage or default to 'pl'
  let currentLang = 'pl';
  try {
    currentLang = localStorage.getItem('lang') || 'pl';
  } catch {}

  const t = useCallback(
    (key) => translations[currentLang]?.[key] ?? key,
    [currentLang]
  );

  return { t };
}

