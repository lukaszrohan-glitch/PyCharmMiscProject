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
  const menuRef = useRef(null)
  const [orders, setOrders] = useState([])
  const [q, setQ] = useState('')
  const [showSearch, setShowSearch] = useState(false)
  const inputRef = useRef(null)
  const [showHelp, setShowHelp] = useState(false)
  const wrapperRef = useRef(null)

  const t = {
    appName: 'Synterra',
    tagline: tt('brand_tagline') || (lang === 'pl' ? 'System Zarządzania Produkcją' : 'Manufacturing Management System'),
    menu: tt('menu') || 'Menu',
    dashboard: tt('dashboard') || (lang === 'pl' ? 'Panel główny' : 'Dashboard'),
    orders: tt('orders') || (lang === 'pl' ? 'Zamówienia' : 'Orders'),
    inventory: tt('inventory') || (lang === 'pl' ? 'Magazyn' : 'Inventory'),
    timesheets: tt('timesheets') || (lang === 'pl' ? 'Czas pracy' : 'Timesheets'),
    reports: tt('reports') || (lang === 'pl' ? 'Raporty' : 'Reports'),
    settings: tt('settings') || (lang === 'pl' ? 'Ustawienia' : 'Settings'),
    logout: tt('logout') || (lang === 'pl' ? 'Wyloguj' : 'Logout'),
    search: lang === 'pl' ? 'Szukaj...' : 'Search...',
    help: lang === 'pl' ? 'Pomoc' : 'Help',
    docs: lang === 'pl' ? 'Dokumentacja' : 'Documentation',
    shortcuts: lang === 'pl' ? 'Skróty klawiaturowe' : 'Keyboard Shortcuts',
  }

  useEffect(() => {
    try {
      localStorage.setItem('lang', lang)
    } catch {}
  }, [lang])

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!wrapperRef.current) return
      if (!wrapperRef.current.contains(event.target)) {
        setShowHelp(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Load orders once when the search box is first opened
  useEffect(() => {
    if (!showSearch || orders.length) return
    ;(async () => {
      try {
        setOrders((await api.getOrders()) || [])
      } catch {}
    })()
  }, [showSearch, orders.length])

  // Global shortcuts: '/', 'Esc'
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
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const results = (q || '').trim()
    ? orders
        .filter((o) => {
          const s = (q || '').toLowerCase()
          return (
            String(o.order_id || '').toLowerCase().includes(s) ||
            String(o.customer_id || '').toLowerCase().includes(s) ||
            String(o.status || '').toLowerCase().includes(s)
          )
        })
        .slice(0, 5)
    : []

  const selectResult = (orderId) => {
    setQ('')
    setShowSearch(false)
    onSearchSelect?.(String(orderId))
  }

  const navItems = [
    { id: 'dashboard', label: t.dashboard, icon: 'D' },
    { id: 'orders', label: t.orders, icon: 'O' },
    { id: 'clients', label: lang === 'pl' ? 'Klienci' : 'Clients', icon: 'C' },
    { id: 'inventory', label: t.inventory, icon: 'I' },
    { id: 'timesheets', label: t.timesheets, icon: 'T' },
    { id: 'reports', label: t.reports, icon: 'R' },
  ]

  return (
    <header className={styles.header}>
      <div className={styles.headerTop}>
        <div className={styles.headerContent} ref={wrapperRef}>
          <div className={styles.leftSection}>
            <button className={styles.menuBtn} onClick={() => setMenuOpen(!menuOpen)} aria-label={t.menu}>
              &#9776;
            </button>
            <div className={styles.logo}>
              <SynterraLogo className={styles.logoSvg} />
              <div className={styles.logoTextBlock}>
                <span className={styles.logoText}>{t.appName}</span>
                <span className={styles.logoTagline}>{t.tagline}</span>
              </div>
            </div>
          </div>

          {/* Inline desktop navigation */}
          <nav className={styles.desktopNav} aria-label="Primary">
            {navItems.map((item) => (
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
            <div className={styles.searchBox}>
              <input
                ref={inputRef}
                className={styles.searchInput}
                placeholder={t.search + ' /'}
                value={q}
                onFocus={() => setShowSearch(true)}
                onChange={(e) => setQ(e.target.value)}
                aria-label={t.search}
              />
              {showSearch && results.length > 0 && (
                <div className={styles.searchResults}>
                  {results.map((r) => (
                    <div key={r.order_id} className={styles.resultItem} onClick={() => selectResult(r.order_id)}>
                      <span>#{r.order_id}</span>
                      <span style={{ opacity: 0.6 }}>{r.customer_id || r.status || ''}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={styles.helpMenu}>
              <button className={styles.helpBtn} onClick={() => setShowHelp((v) => !v)} aria-haspopup="menu" aria-expanded={showHelp}>
                ? {t.help}
              </button>
              {showHelp && (
                <div className={styles.helpDropdown} role="menu">
                  <button className={styles.helpItem} onClick={() => { setShowHelp(false); onOpenGuide?.() }}>📘 {t.docs}</button>
                </div>
              )}
            </div>

            <div className={styles.langSwitch}>
              <button className={lang === 'pl' ? styles.langActive : styles.langBtn} onClick={() => setLang('pl')}>
                🇵🇱 PL
              </button>
              <button className={lang === 'en' ? styles.langActive : styles.langBtn} onClick={() => setLang('en')}>
                🇬🇧 EN
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
            {navItems.map((item) => (
              <li key={item.id}>
                <button
                  className={currentView === item.id ? styles.navItemActive : styles.navItem}
                  onClick={() => {
                    setCurrentView(item.id)
                    setMenuOpen(false)
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
  )
}
