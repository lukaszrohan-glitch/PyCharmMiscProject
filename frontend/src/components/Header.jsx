import { useEffect, useRef, useState, useMemo, useCallback } from 'react'
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
  onOpenHelp,
  isHelpOpen,
}) {
  const { t: tt } = useI18n(lang)
  const [menuOpen, setMenuOpen] = useState(false)
  const [orders, setOrders] = useState([])
  const [q, setQ] = useState('')
  const inputRef = useRef(null)
  const chromeRef = useRef(null)
  const menuBtnRef = useRef(null)
  const menuListRef = useRef(null)
  const typeaheadId = useMemo(
    () => `global-search-${Math.random().toString(36).slice(2)}`,
    [],
  )

  const laptopNav = useMemo(
    () => [
      { id: 'dashboard', label: tt('dashboard') || (lang === 'pl' ? 'Panel główny' : 'Home') },
      { id: 'orders', label: tt('orders') || (lang === 'pl' ? 'Zamówienia' : 'Orders') },
      { id: 'products', label: tt('products') || (lang === 'pl' ? 'Produkty' : 'Products') },
      { id: 'production', label: tt('planning') || (lang === 'pl' ? 'Planowanie' : 'Planning') },
      { id: 'clients', label: tt('clients') || (lang === 'pl' ? 'Klienci' : 'Clients') },
      { id: 'inventory', label: tt('inventory') || (lang === 'pl' ? 'Magazyn' : 'Inventory') },
      { id: 'timesheets', label: tt('timesheets') || (lang === 'pl' ? 'Czas pracy' : 'Timesheets') },
      { id: 'reports', label: tt('reports') || (lang === 'pl' ? 'Raporty' : 'Reports') },
    ],
    [lang, tt],
  )

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

  const navItems = laptopNav

  useEffect(() => {
    try {
      localStorage.setItem('lang', lang)
    } catch (err) {
      console.warn('Persisting lang failed', err)
    }
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
      }
    }
    const handleKey = (e) => {
      if (e.key === 'Escape' && menuOpen) {
        setMenuOpen(false)
        menuBtnRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleKey)
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleKey)
    }
  }, [menuOpen])

  // Lazy-load orders when search first opens
  useEffect(() => {
    if (!orders.length) {
      ;(async () => {
        try {
          setOrders((await api.getOrders()) || [])
        } catch (err) {
          console.warn('Search preload failed:', err)
        }
      })()
    }
  }, [orders.length])

  const results = useMemo(() => {
    const probe = q.trim().toLowerCase()
    if (!probe) return []
    return orders
      .filter((o) =>
        [o.order_id, o.customer_id, o.status]
          .map((x) => String(x || '').toLowerCase())
          .some((token) => token.includes(probe))
      )
      .slice(0, 6)
  }, [orders, q])

  const selectResult = useCallback(
    (orderId) => {
      setQ('')
      onSearchSelect?.(String(orderId))
    },
    [onSearchSelect],
  )

  const changeView = useCallback(
    (id) => {
      setCurrentView(id)
      setMenuOpen(false)
    },
    [setCurrentView],
  )

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
          <div className={styles.logoMotion} aria-hidden="true" />
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
              onClick={() => setMenuOpen((v) => !v)}
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
                tabIndex={-1}
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
            <label htmlFor={typeaheadId} className="visually-hidden">
              {t.search}
            </label>
            <input
              id={typeaheadId}
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
              onKeyDown={(evt) => {
                if (evt.key === 'Escape') {
                  setQ('')
                  evt.target.blur()
                }
              }}
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
                    aria-selected="false"
                    onClick={() => selectResult(r.order_id)}
                    aria-label={`${lang === 'pl' ? 'Zamówienie' : 'Order'} ${r.order_id}`}
                    onKeyDown={(evt) => {
                      if (evt.key === 'Enter' || evt.key === ' ') {
                        evt.preventDefault()
                        selectResult(r.order_id)
                      }
                    }}
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
              className={styles.helpBtn}
              onClick={() => {
                onOpenHelp?.()
                setMenuOpen(false)
              }}
              aria-haspopup="dialog"
              aria-expanded={isHelpOpen}
              aria-label={t.help}
              title={t.help}
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
                aria-haspopup="dialog"
                aria-label={lang === 'pl' ? 'Ustawienia profilu' : 'Open profile settings'}
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
    </>
  )
}
