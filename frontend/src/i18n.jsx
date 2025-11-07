import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

const translations = {
  en: {
    app_title: 'SMB Tool',
    orders: 'Orders',
    create_order: 'Create Order',
    order_id: 'Order ID',
    customer: 'Customer (type to filter)',
    create_order_confirm: 'Create order?',
    add_order_line: 'Add Order Line',
    log_timesheet: 'Log Timesheet',
    employee_id: 'Employee ID',
    hours: 'Hours',
    add_timesheet: 'Add Timesheet',
    inventory_txn: 'Inventory Txn',
    txn_id: 'Txn ID',
    inventory_product: 'Inventory Product',
    qty_change: 'Qty change (e.g. 100 or -50)',
    create_txn: 'Create Txn',
    api_key_set: 'API key set',
    admin_key_set: 'Admin key set',
    order_created: 'Order created',
    timesheet_logged: 'Timesheet logged',
    inventory_created: 'Inventory txn created',
    order_line_added: 'Order line added',
    loading: 'Loading...',
    finance: 'Finance',
    write_api_key_placeholder: 'API key (for write ops)',
    toggle_admin: 'Toggle Admin',
    api_key_and_customer_required: 'Order ID and Customer are required',
    employee_and_hours_required: 'Employee and hours are required',
    txn_product_qty_required: 'Txn ID, Product and Qty required',
    language: 'Language',
    admin: 'Admin',
    existing_keys: 'Existing keys',
    new_key_label: 'New key label',
    create_key: 'Create',
    copied_new_key: 'Copied new key',
    api_key_created: 'API key created',
    api_key_deleted: 'API key deleted',
    api_key_rotate_failed: 'Rotate failed',
    api_key_rotated: 'API key rotated',
    api_key_delete_failed: 'Delete failed',
    new_key_once: 'New key (copy now):',
  },
  pl: {
    app_title: 'Narzędzie SMB',
    orders: 'Zamówienia',
    create_order: 'Utwórz zamówienie',
    order_id: 'ID zamówienia',
    customer: 'Klient (pisz aby filtrować)',
    create_order_confirm: 'Utworzyć zamówienie?',
    add_order_line: 'Dodaj pozycję zamówienia',
    log_timesheet: 'Rejestr czasu pracy',
    employee_id: 'ID pracownika',
    hours: 'Godziny',
    add_timesheet: 'Dodaj wpis czasu',
    inventory_txn: 'Ruch magazynowy',
    txn_id: 'ID transakcji',
    inventory_product: 'Produkt magazynowy',
    qty_change: 'Zmiana ilości (np. 100 lub -50)',
    create_txn: 'Utwórz transakcję',
    api_key_set: 'Klucz API ustawiony',
    admin_key_set: 'Klucz admina ustawiony',
    order_created: 'Zamówienie utworzone',
    timesheet_logged: 'Czas pracy zapisany',
    inventory_created: 'Transakcja magazynowa utworzona',
    order_line_added: 'Pozycja dodana',
    loading: 'Ładowanie...',
    finance: 'Finanse',
    write_api_key_placeholder: 'Klucz API (operacje zapisu)',
    toggle_admin: 'Panel admina',
    api_key_and_customer_required: 'Wymagane ID zamówienia i klient',
    employee_and_hours_required: 'Wymagany pracownik i godziny',
    txn_product_qty_required: 'Wymagane ID transakcji, produkt i ilość',
    language: 'Język',
    admin: 'Admin',
    existing_keys: 'Istniejące klucze',
    new_key_label: 'Etykieta nowego klucza',
    create_key: 'Utwórz',
    copied_new_key: 'Skopiowano nowy klucz',
    api_key_created: 'Klucz API utworzony',
    api_key_deleted: 'Klucz API usunięty',
    api_key_rotate_failed: 'Rotacja nieudana',
    api_key_rotated: 'Klucz API zrotowany',
    api_key_delete_failed: 'Usunięcie nieudane',
    new_key_once: 'Nowy klucz (skopiuj teraz):',
  }
}

const I18nCtx = createContext({ lang: 'pl', t: (k)=>k, setLang: ()=>{} })

export function I18nProvider({ children, defaultLang }){
  const initial = defaultLang || import.meta.env.VITE_DEFAULT_LANG || 'pl'
  const [lang, setLang] = useState(initial)

  useEffect(()=>{
    const stored = localStorage.getItem('app_lang')
    if(stored && stored !== lang) setLang(stored)
  }, [])

  useEffect(()=>{ localStorage.setItem('app_lang', lang) }, [lang])

  const t = useCallback((key)=> {
    const dict = translations[lang] || translations.pl
    return dict[key] || key
  }, [lang])

  return <I18nCtx.Provider value={{ lang, setLang, t }}>{children}</I18nCtx.Provider>
}

export function useI18n(){ return useContext(I18nCtx) }

export function translateStatus(lang, status){
  const map = {
    pl: { New: 'Nowe', Planned: 'Planowane', InProd: 'W produkcji', Done: 'Gotowe', Invoiced: 'Zafakturowane' },
    en: { New: 'New', Planned: 'Planned', InProd: 'InProd', Done: 'Done', Invoiced: 'Invoiced' }
  }
  return (map[lang] && map[lang][status]) || status
}

