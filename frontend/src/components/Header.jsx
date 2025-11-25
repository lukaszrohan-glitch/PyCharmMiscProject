import React, { useEffect, useRef, useState } from 'react'
import styles from './Header.module.css'
import { useI18n } from '../i18n'
import * as api from '../services/api'
import SynterraLogo from './SynterraLogo'
import HelpPanel from './HelpPanel'

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
  const menuBtnRef = useRef(null)
  const helpBtnRef = useRef(null)
  const menuListRef = useRef(null)

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

  // Close dropdowns on outside click with proper focus management
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (!chromeRef.current) return
      if (!chromeRef.current.contains(e.target)) {
        if (menuOpen) {
          setMenuOpen(false)
          menuBtnRef.current?.focus()
        }
        if (showHelp) {
          setShowHelp(false)
          helpBtnRef.current?.focus()
        }
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape' && showHelp) {
        setShowHelp(false)
        helpBtnRef.current?.focus()
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen, showHelp])

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

  useEffect(() => {
    if (menuOpen && menuListRef.current) {
      const first = menuListRef.current.querySelector('[role="menuitem"]')
      first?.focus()
    }
  }, [menuOpen])

  return (
    <>
      {/* Skip to main content link for keyboard users (accessibility) */}
      <a href="#main-content" className="skip-to-main">
        {lang === 'pl' ? 'Przejdź do treści' : 'Skip to main content'}
      </a>

      <header className={styles.shell} role="banner">
        <div className={styles.chrome} ref={chromeRef}>
        {/* FAR LEFT: moving logo */}
        <div className={styles.leftCluster}>
          <button
            className={styles.logoWrap}
            onClick={() => changeView('dashboard')}
            aria-label={lang === 'pl' ? 'Wróć do strony głównej' : 'Go to home page'}
            type="button"
          >
            <SynterraLogo className={styles.logoSvg} aria-hidden="true" />
            <div className={styles.logoTextBlock}>
              <span className={styles.logoText}>{t.appName}</span>
              <span className={styles.logoTagline}>{t.tagline}</span>
            </div>
          </button>
        </div>

        {/* CENTER: compact menu + search, positioned away from far left */}
        <nav className={styles.centerCluster} aria-label={lang === 'pl' ? 'Nawigacja główna' : 'Primary navigation'}>
          <div className={styles.menuPill}>
            <button
              ref={menuBtnRef}
              className={styles.menuTrigger}
              onClick={() => { setMenuOpen((v) => !v); setShowHelp(false) }}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-controls="global-menu"
              aria-label={menuOpen ? (lang === 'pl' ? 'Zamknij menu' : 'Close menu') : (lang === 'pl' ? 'Otwórz menu' : 'Open menu')}
              type="button"
            >
              <span className={styles.menuDot} aria-hidden="true" />
              <span className={styles.menuDot} aria-hidden="true" />
              <span className={styles.menuDot} aria-hidden="true" />
              <span className={styles.menuLabel}>
                {navItems.find((n) => n.id === currentView)?.label || t.menu}
              </span>
            </button>
            {menuOpen && (
              <div
                id="global-menu"
                className={styles.menuDropdown}
                role="menu"
                ref={menuListRef}
                onKeyDown={(e) => {
                  if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
                    e.preventDefault()
                    const items = Array.from(menuListRef.current.querySelectorAll('[role="menuitem"]'))
                    const idx = items.indexOf(document.activeElement)
                    let next = 0
                    if (e.key === 'ArrowDown') next = Math.min(idx + 1, items.length - 1)
                    if (e.key === 'ArrowUp') next = Math.max(idx - 1, 0)
                    if (e.key === 'Home') next = 0
                    if (e.key === 'End') next = items.length - 1
                    items[next]?.focus()
                  }
                }}
              >
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
            aria-label={t.home}
            aria-current={currentView === 'dashboard' ? 'page' : undefined}
          >
            {t.home}
          </button>

          <div className={styles.searchShell}>
            <label htmlFor="global-search" className="visually-hidden">
              {t.search}
            </label>
            <input
              id="global-search"
              ref={inputRef}
              className={styles.searchInput}
              placeholder={t.search}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t.search}
              aria-autocomplete="list"
              aria-controls={results.length > 0 ? 'search-results' : undefined}
              type="search"
              autoComplete="off"
            />
            {results.length > 0 && (
              <div
                id="search-results"
                className={styles.searchDropdown}
                role="listbox"
                aria-label={lang === 'pl' ? 'Wyniki wyszukiwania' : 'Search results'}
              >
                {results.map((r) => (
                  <button
                    key={r.order_id}
                    className={styles.searchItem}
                    type="button"
                    role="option"
                    onClick={() => selectResult(r.order_id)}
                    aria-label={`${lang === 'pl' ? 'Zamówienie' : 'Order'} ${r.order_id}`}
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
        </nav>

        {/* RIGHT: language, help, profile */}
        <div className={styles.rightCluster}>
          <div className={styles.langSwitch} role="group" aria-label={lang === 'pl' ? 'Wybór języka' : 'Language selection'}>
            <button
              className={lang === 'pl' ? styles.langActive : styles.langBtn}
              onClick={() => setLang('pl')}
              type="button"
              aria-pressed={lang === 'pl'}
              aria-label="Polski"
            >
              PL
            </button>
            <button
              className={lang === 'en' ? styles.langActive : styles.langBtn}
              onClick={() => setLang('en')}
              type="button"
              aria-pressed={lang === 'en'}
              aria-label="English"
            >
              EN
            </button>
          </div>

          <div className={styles.helpCluster}>
            <button
              ref={helpBtnRef}
              className={styles.helpBtn}
              onClick={() => {
                setShowHelp(true)
                setMenuOpen(false)
              }}
              aria-haspopup="dialog"
              aria-expanded={showHelp}
              aria-label={t.help}
              type="button"
            >
              <span aria-hidden="true">?</span>
            </button>
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
    {showHelp && (
      <HelpPanel
        lang={lang}
        onClose={() => {
          setShowHelp(false)
          helpBtnRef.current?.focus()
        }}
        onOpenGuide={() => onOpenGuide?.()}
      />
    )}
    </>
  )
}
