export const translations = {
  en: {
    app_title: 'SMB Tool',
    brand_tagline: 'Manufacturing Management System',
    menu: 'Menu',
    home: 'Home',
    dashboard: 'Dashboard',
    orders: 'Orders',
    products: 'Products',
    production: 'Production Planning',
    planning: 'Planning',
    clients: 'Clients',
    customers: 'Customers',
    inventory: 'Inventory',
    warehouse: 'Warehouse',
    timesheets: 'Timesheets',
    work_time: 'Work Time',
    reports: 'Reports',
    financials: 'Financials',
    settings: 'Settings',
    logout: 'Logout',
    search: 'Search…',
    help: 'Help',
    docs: 'Documentation',
    admin: 'Admin',
  },
  pl: {
    app_title: 'Narzędzie SMB',
    brand_tagline: 'System Zarządzania Produkcją',
    menu: 'Menu',
    home: 'Panel główny',
    dashboard: 'Panel główny',
    orders: 'Zamówienia',
    products: 'Produkty',
    production: 'Planowanie produkcji',
    planning: 'Planowanie',
    clients: 'Klienci',
    customers: 'Klienci',
    inventory: 'Magazyn',
    warehouse: 'Magazyn',
    timesheets: 'Czas pracy',
    work_time: 'Czas pracy',
    reports: 'Raporty',
    financials: 'Finanse',
    settings: 'Ustawienia',
    logout: 'Wyloguj',
    search: 'Szukaj…',
    help: 'Pomoc',
    docs: 'Dokumentacja',
    admin: 'Administrator',
  }
}

export function translateStatus(lang, status) {
  const map = {
    pl: { New: 'Nowe', Planned: 'Planowane', InProd: 'W produkcji', Done: 'Gotowe', Invoiced: 'Zafakturowane' },
    en: { New: 'New', Planned: 'Planned', InProd: 'InProd', Done: 'Done', Invoiced: 'Invoiced' }
  }
  return (map[lang] && map[lang][status]) || status
}
