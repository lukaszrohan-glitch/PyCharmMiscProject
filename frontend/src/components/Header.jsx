import React, { useEffect, useRef, useState } from 'react';
import styles from './Header.module.css';
import { useI18n } from '../i18n';

export default function Header({ lang, setLang, currentView, setCurrentView, profile, onSettings, onLogout }) {
  const { t: tt } = useI18n(lang)
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [isDark, setIsDark] = useState(() => {
    try { return document.documentElement.classList.contains('dark'); } catch { return false; }
  });

  const t = {
    appName: 'Synterra',
    tagline: tt('brand_tagline') || (lang==='pl' ? 'System Zarządzania Produkcją' : 'Manufacturing Management System'),
    menu: tt('menu') || 'Menu',
    dashboard: tt('dashboard') || (lang==='pl' ? 'Panel glowny' : 'Dashboard'),
    orders: tt('orders') || (lang==='pl' ? 'Zamowienia' : 'Orders'),
    inventory: tt('inventory') || (lang==='pl' ? 'Magazyn' : 'Inventory'),
    timesheets: tt('timesheets') || (lang==='pl' ? 'Czas pracy' : 'Timesheets'),
    reports: tt('reports') || (lang==='pl' ? 'Raporty' : 'Reports'),
    settings: tt('settings') || (lang==='pl' ? 'Ustawienia' : 'Settings'),
    logout: tt('logout') || (lang==='pl' ? 'Wyloguj' : 'Logout'),
    search: (lang==='pl' ? 'Szukaj...' : 'Search...')
  };

  useEffect(() => {
    try {
      localStorage.setItem('lang', lang);
    } catch (e) {
      console.error('Failed to save language', e);
    }
  }, [lang]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [menuOpen]);

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: 'D' },
    { id: 'orders', label: t.orders, icon: 'O' },
    { id: 'clients', label: lang==='pl' ? 'Klienci' : 'Clients', icon: 'C' },
    { id: 'inventory', label: t.inventory, icon: 'I' },
    { id: 'timesheets', label: t.timesheets, icon: 'T' },
    { id: 'reports', label: t.reports, icon: 'R' }
  ];

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.headerContent}>
          <div className={styles.leftSection}>
            <button
              className={styles.menuBtn}
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={t.menu}
            >
              &#9776;
            </button>
            <div className={styles.logo}>
              <span className={styles.logoText}>
                {t.appName}
              </span>
              <span className={styles.logoTagline}>{t.tagline}</span>
            </div>
          </div>

          {/* Inline desktop navigation */}
          <nav className={styles.desktopNav} aria-label="Primary">
            {navItems.map(item => (
              <button
                key={item.id}
                className={currentView === item.id ? styles.desktopNavBtnActive : styles.desktopNavBtn}
                onClick={() => setCurrentView(item.id)}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className={styles.rightSection}>
            <div className={styles.langSwitch}>
              <button
                className={lang === 'pl' ? styles.langActive : styles.langBtn}
                onClick={() => setLang('pl')}
              >
                PL
              </button>
              <button
                className={lang === 'en' ? styles.langActive : styles.langBtn}
                onClick={() => setLang('en')}
              >
                EN
              </button>
            </div>

            {profile && (
              <div className={styles.profileSection}>
                <button className={styles.profileBtn} onClick={onSettings}>
                  <span className={styles.avatar}>{profile.name?.charAt(0) || profile.email?.charAt(0) || 'U'}</span>
                  <span className={styles.profileName}>{profile.name || profile.email}</span>
                </button>
                <button className={styles.logoutBtn} onClick={onLogout} title={t.logout} aria-label={t.logout}>
                  {t.logout}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {menuOpen && (
        <nav ref={menuRef} className={styles.navMenu}>
          <ul className={styles.navList}>
            {navItems.map(item => (
              <li key={item.id}>
                <button
                  className={currentView === item.id ? styles.navItemActive : styles.navItem}
                  onClick={() => {
                    setCurrentView(item.id);
                    setMenuOpen(false);
                  }}
                >
                  <span className={styles.navIcon}>{item.icon}</span>
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
            <li className={styles.navDivider} />
            <li>
              <button className={styles.navItem} onClick={onSettings}>
                S {t.settings}
              </button>
            </li>
            <li>
              <button className={styles.navItem} onClick={onLogout}>
                L {t.logout}
              </button>
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}


