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
  onOpenShortcuts,
  onOpenGuide,
}) {
  const { t: tt } = useI18n(lang)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showHelp, setShowHelp] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
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
    dashboard: tt('dashboard') || (lang === 'pl' ? 'Panel główny' : 'Dashboard'),
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
    { id: 'dashboard', label: t.dashboard },
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
        setShowSearch(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Lazy-load orders when search first opens
  useEffect(() => {
    if (!showSearch || orders.length) return
    ;(async () => {
      try {
        setOrders((await api.getOrders()) || [])
      } catch {
        // silent – search is a bonus
      }
    })()
  }, [showSearch, orders.length])

  // Global shortcuts: '/' to focus search, Esc to close overlays
  useEffect(() => {
    const onKey = (e) => {
      const tag = (document.activeElement && document.activeElement.tagName) || ''
      const typing = ['INPUT', 'TEXTAREA'].includes(tag)
      if (e.key === '/' && !typing) {
        e.preventDefault()
        setShowSearch(true)
        setTimeout(() => inputRef.current?.focus(), 0)
      } else if (e.key === 'Escape') {
        setShowSearch(false)
        setShowHelp(false)
        setMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

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
    setShowSearch(false)
    onSearchSelect?.(String(orderId))
  }

  const changeView = (id) => {
    setCurrentView(id)
    setMenuOpen(false)
  }

  return (
    <header className={styles.shell}>
      <div className={styles.chrome} ref={chromeRef}>
        {/* Left: logo pinned to far-left */}
        <div className={styles.leftCluster}>
          <div className={styles.logoWrap}>
            <SynterraLogo className={styles.logoSvg} />
            <div className={styles.logoTextBlock}>
              <span className={styles.logoText}>{t.appName}</span>
              <span className={styles.logoTagline}>{t.tagline}</span>
            </div>
          </div>
        </div>

        {/* Center: compact "pill" menu + search */}
        <div className={styles.centerCluster}>
          <div className={styles.menuPill}>
            <button
              className={styles.menuTrigger}
              onClick={() => { setMenuOpen(v => !v); setShowHelp(false) }}
              aria-haspopup="menu"
              aria-expanded={menuOpen}
            >
              <span className={styles.menuDot} />
              <span className={styles.menuDot} />
              <span className={styles.menuDot} />
              <span className={styles.menuLabel}>{
                navItems.find(n => n.id === currentView)?.label || t.menu
              }</span>
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
                  >
                    {item.label}
                  </button>
                ))}
                <div className={styles.menuDivider} />
                <button className={styles.menuItem} onClick={onSettings} role="menuitem">
                  {t.settings}
                </button>
              </div>
            )}
          </div>

          <div className={styles.searchShell}>
            <input
              ref={inputRef}
              className={styles.searchInput}
              placeholder={`${t.search} /`}
              value={q}
              onFocus={() => setShowSearch(true)}
              onChange={(e) => setQ(e.target.value)}
              aria-label={t.search}
            />
            {showSearch && results.length > 0 && (
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

        {/* Right: language, help, profile */}
        <div className={styles.rightCluster}>
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

          <div className={styles.helpCluster}>
            <button
              className={styles.helpBtn}
              onClick={() => { setShowHelp(v => !v); setMenuOpen(false) }}
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
                    {profile.is_admin
                      ? lang === 'pl' ? 'Administrator' : 'Admin'
                      : lang === 'pl' ? 'Użytkownik' : 'User'}
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
