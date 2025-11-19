import React, { useEffect, useRef, useState } from 'react'
import styles from './Header.module.css'
import { useI18n } from '../i18n'
import * as api from '../services/api'
import SynterraLogo from './SynterraLogo'

export default function Header({
  lang,
  setLang,
  currentView,
  setCurrentView,
  profile,
  onSettings,
  onLogout,
  onSearchSelect,
  onOpenGuide,
}) {
  const { t: tt } = useI18n(lang)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [orders, setOrders] = useState([])
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  const chromeRef = useRef(null)

  const t = {
    appName: 'Synterra',
    tagline:
      tt('brand_tagline') ||
      (lang === 'pl' ? 'System Zarządzania Produkcją' : 'Manufacturing Management System'),
    menu: tt('menu') || 'Menu',
    home: lang === 'pl' ? 'Panel główny' : 'Home',
    orders: tt('orders') || (lang === 'pl' ? 'Zamówienia' : 'Orders'),
    inventory: tt('inventory') || (lang === 'pl' ? 'Magazyn' : 'Inventory'),
    timesheets: tt('timesheets') || (lang === 'pl' ? 'Czas pracy' : 'Timesheets'),
    reports: tt('reports') || (lang === 'pl' ? 'Raporty' : 'Reports'),
    settings: tt('settings') || (lang === 'pl' ? 'Ustawienia' : 'Settings'),
    logout: tt('logout') || (lang === 'pl' ? 'Wyloguj' : 'Logout'),
    search: lang === 'pl' ? 'Szukaj…' : 'Search…',
    help: lang === 'pl' ? 'Pomoc' : 'Help',
    docs: lang === 'pl' ? 'Dokumentacja' : 'Documentation',
  }

  const navItems = [
    { id: 'dashboard', label: t.home },
    { id: 'orders', label: t.orders },
    { id: 'clients', label: lang === 'pl' ? 'Klienci' : 'Clients' },
    { id: 'inventory', label: t.inventory },
    { id: 'timesheets', label: t.timesheets },
    { id: 'reports', label: t.reports },
  ]

  useEffect(() => {
    try { localStorage.setItem('lang', lang) } catch {}
  }, [lang])

  // Close dropdowns on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!chromeRef.current) return
      if (!chromeRef.current.contains(e.target)) {
        setMenuOpen(false)
        setShowHelp(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape') {
        setMenuOpen(false)
        setShowHelp(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [])

  // Lazy-load orders when search first opens
  useEffect(() => {
    if (!orders.length) {
      ;(async () => {
        try {
          setOrders((await api.getOrders()) || [])
        } catch {
          // ignore – search is optional
        }
      })()
    }
  }, [orders.length])

  const results = q.trim()
    ? orders
        .filter((o) => {
          const s = q.toLowerCase()
          return (
            String(o.order_id || '').toLowerCase().includes(s) ||
            String(o.customer_id || '').toLowerCase().includes(s) ||
            String(o.status || '').toLowerCase().includes(s)
          )
        })
        .slice(0, 6)
    : []

  const selectResult = (orderId) => {
    setQ('')
    onSearchSelect?.(String(orderId))
  }

  const changeView = (id) => {
    setCurrentView(id)
    setMenuOpen(false)
  }

  return (
    <header className={styles.shell}>
      <div className={styles.chrome} ref={chromeRef}>
        {/* FAR LEFT: moving logo */}
        <div className={styles.leftCluster}>
          <div className={styles.logoWrap}>
            <SynterraLogo className={styles.logoSvg} />
            <div className={styles.logoTextBlock}>
              <span className={styles.logoText}>{t.appName}</span>
              <span className={styles.logoTagline}>{t.tagline}</span>
            </div>
          </div>
        </div>

        {/* CENTER: compact menu + search, positioned away from far left */}
        <div className={styles.centerCluster}>
          <div className={styles.menuPill}>
            <button
              className={styles.menuTrigger}
              onClick={() => { setMenuOpen((v) => !v); setShowHelp(false) }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              type="button"
            >
              <span className={styles.menuDot} />
              <span className={styles.menuDot} />
              <span className={styles.menuDot} />
              <span className={styles.menuLabel}>
                {navItems.find((n) => n.id === currentView)?.label || t.menu}
              </span>
            </button>
            {menuOpen && (
              <div className={styles.menuDropdown} role="menu">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    className={
                      currentView === item.id ? styles.menuItemActive : styles.menuItem
                    }
                    onClick={() => changeView(item.id)}
                    role="menuitem"
                    type="button"
                  >
                    {item.label}
                  </button>
                ))}
                <div className={styles.menuDivider} />
                <button
                  className={styles.menuItem}
                  onClick={onSettings}
                  role="menuitem"
                  type="button"
                >
                  {t.settings}
                </button>
              </div>
            )}
          </div>

          {/* Explicit Home button to return to main dashboard */}
          <button
            type="button"
            className={styles.homeBtn}
            onClick={() => changeView('dashboard')}
          >
            {t.home}
          </button>

          <div className={styles.searchShell}>
            <input
              ref={inputRef}
              className={styles.searchInput}
              placeholder={t.search}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t.search}
            />
            {results.length > 0 && (
              <div className={styles.searchDropdown}>
                {results.map((r) => (
                  <button
                    key={r.order_id}
                    className={styles.searchItem}
                    type="button"
                    onClick={() => selectResult(r.order_id)}
                  >
                    <span className={styles.searchItemPrimary}>#{r.order_id}</span>
                    <span className={styles.searchItemMeta}>
                      {r.customer_id || r.status || ''}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: language, help, profile */}
        <div className={styles.rightCluster}>
          <div className={styles.langSwitch}>
            <button
              className={lang === 'pl' ? styles.langActive : styles.langBtn}
              onClick={() => setLang('pl')}
              type="button"
            >
              PL
            </button>
            <button
              className={lang === 'en' ? styles.langActive : styles.langBtn}
              onClick={() => setLang('en')}
              type="button"
            >
              EN
            </button>
          </div>

          <div className={styles.helpCluster}>
            <button
              className={styles.helpBtn}
              onClick={() => { setShowHelp((v) => !v); setMenuOpen(false) }}
              aria-haspopup="menu"
              aria-expanded={showHelp}
              type="button"
            >
              ?
            </button>
            {showHelp && (
              <div className={styles.helpDropdown} role="menu">
                <button
                  className={styles.helpItem}
                  onClick={() => { setShowHelp(false); onOpenGuide?.() }}
                  role="menuitem"
                  type="button"
                >
                  {t.docs}
                </button>
              </div>
            )}
          </div>

          {profile && (
            <div className={styles.profileCluster}>
              <button
                type="button"
                className={styles.profileButton}
                onClick={onSettings}
              >
                <span className={styles.avatar}>
                  {profile.name?.charAt(0) || profile.email?.charAt(0) || 'U'}
                </span>
                <span className={styles.profileMeta}>
                  <span className={styles.profileName}>{profile.name || profile.email}</span>
                  <span className={styles.profileRole}>
                    {profile.email && (
                      <span className={styles.profileEmail}>{profile.email}</span>
                    )}
                    <span>
                      {profile.is_admin
                        ? lang === 'pl'
                          ? 'Administrator'
                          : 'Admin'
                        : lang === 'pl'
                          ? 'Użytkownik'
                          : 'User'}
                    </span>
                  </span>
                </span>
              </button>
              <button
                type="button"
                className={styles.logoutIconBtn}
                onClick={onLogout}
                title={t.logout}
                aria-label={t.logout}
              >
                ⎋
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
