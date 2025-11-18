import React, { useEffect, useRef, useState } from 'react';
import styles from './Header.module.css';

export default function Header({ lang, setLang, currentView, setCurrentView, profile, onSettings, onLogout }) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);
  const [isDark, setIsDark] = useState(() => {
    try { return document.documentElement.classList.contains('dark'); } catch { return false; }
  });

  const t = lang === 'pl' ? {
    appName: 'Synterra',
    tagline: 'System Zarzadzania Produkcja',
    menu: 'Menu',
    dashboard: 'Panel glowny',
    orders: 'Zamowienia',
    inventory: 'Magazyn',
    timesheets: 'Czas pracy',
    reports: 'Raporty',
    settings: 'Ustawienia',
    logout: 'Wyloguj',
    search: 'Szukaj...'
  } : {
    appName: 'Synterra',
    tagline: 'Manufacturing Management System',
    menu: 'Menu',
    dashboard: 'Dashboard',
    orders: 'Orders',
    inventory: 'Inventory',
    timesheets: 'Timesheets',
    reports: 'Reports',
    settings: 'Settings',
    logout: 'Logout',
    search: 'Search...'
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

            <button
              className={styles.themeToggle}
              onClick={() => {
                const next = isDark ? 'light' : 'dark';
                try { window.setTheme && window.setTheme(next); } catch {}
                setIsDark(!isDark);
              }}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? '☀️' : '🌙'}
            </button>

            {profile && (
              <div className={styles.profileSection}>
                <button className={styles.profileBtn} onClick={onSettings}>
                  <span className={styles.avatar}>
                    {profile.name?.charAt(0) || 'A'}
                  </span>
                  <span className={styles.profileName}>{profile.name}</span>
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

