import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function Header({ lang, setLang, currentView, setCurrentView, profile, onSettings, onLogout, orders }) {
  // i18n dictionary
  const t = useMemo(() => (lang === 'pl' ? {
    appName: 'Arkuszownia SMB',
    tagline: 'System Zarządzania Produkcją',
    searchPlaceholder: 'Wyszukaj zamówienia...',
    help: 'Pomoc',
    docs: 'Dokumentacja',
    shortcuts: 'Skróty klawiaturowe',
    settings: 'Ustawienia',
    logout: 'Wyloguj',
    tabs: { main: 'Aplikacja SMB', guide: 'Poradnik Użytkownika' },
    shortcutsList: 'Lista skrótów:\n/ - Szukaj\n? - Ten dialog\nEsc - Zamknij'
  } : {
    appName: 'Arkuszownia SMB',
    tagline: 'Manufacturing Management System',
    searchPlaceholder: 'Search orders...',
    help: 'Help',
    docs: 'Documentation',
    shortcuts: 'Keyboard Shortcuts',
    settings: 'Settings',
    logout: 'Sign out',
    tabs: { main: 'SMB Application', guide: 'User Guide' },
    shortcutsList: 'Shortcuts:\n/ - Search\n? - This dialog\nEsc - Close'
  }), [lang])

  // UI state
  const [userOpen, setUserOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [shortcutsOpen, setShortcutsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const searchRef = useRef(null)
  const userBtnRef = useRef(null)
  const helpBtnRef = useRef(null)

  // persist language
  useEffect(() => { try { localStorage.setItem('lang', lang) } catch {} }, [lang])

  // global shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault()
        searchRef.current?.focus()
      } else if (e.key === '?' && !e.ctrlKey && !e.metaKey && document.activeElement.tagName !== 'INPUT') {
        e.preventDefault()
        setShortcutsOpen(true)
      } else if (e.key === 'Escape') {
        setShortcutsOpen(false)
        setHelpOpen(false)
        setUserOpen(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // outside click close
  useEffect(() => {
    const onDown = (e) => {
      const ids = ['user-pop','help-pop']
      if (!ids.some(id => document.getElementById(id)?.contains(e.target))) {
        setUserOpen(false)
        setHelpOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  // Search functionality
  useEffect(() => {
    if (!query.trim() || !orders) {
      setSearchResults([])
      return
    }
    const filtered = orders.filter(o =>
      o.order_id?.toLowerCase().includes(query.toLowerCase()) ||
      o.customer_id?.toLowerCase().includes(query.toLowerCase()) ||
      o.status?.toLowerCase().includes(query.toLowerCase())
    ).slice(0, 5)
    setSearchResults(filtered)
  }, [query, orders])

  const Tab = ({ id, label }) => (
    <button className={`odoo-tab ${currentView === id ? 'active' : ''}`} onClick={()=>setCurrentView(id)} role="tab" aria-selected={currentView === id}>{label}</button>
  )

  const handleSearchSelect = (orderId) => {
    setQuery('')
    setSearchResults([])
    setCurrentView('main')
    // Trigger order selection
    setTimeout(() => {
      const orderBtn = document.querySelector(`[data-order-id="${orderId}"]`)
      if (orderBtn) orderBtn.click()
    }, 100)
  }

  const handleDocsClick = () => {
    setHelpOpen(false)
    setCurrentView('guide')
  }

  const handleShortcutsClick = () => {
    setHelpOpen(false)
    setShortcutsOpen(true)
  }

  return (
    <header className="odoo-shell">
      <div className="odoo-topbar">
        <div className="odoo-left">
          <div className="brand">
            <span className="brand-title">{t.appName}</span>
            <span className="brand-sub">{t.tagline}</span>
          </div>
        </div>

        <div className="odoo-center">
          <div className="search-wrapper">
            <input
              ref={searchRef}
              value={query}
              onChange={(e)=>setQuery(e.target.value)}
              className="odoo-search"
              placeholder={t.searchPlaceholder}
              aria-label={t.searchPlaceholder}
            />
            <kbd className="slash">/</kbd>
            {searchResults.length > 0 && (
              <div className="search-results">
                {searchResults.map(o => (
                  <button
                    key={o.order_id}
                    className="search-result-item"
                    onClick={() => handleSearchSelect(o.order_id)}
                  >
                    <span className="result-id">{o.order_id}</span>
                    <span className="result-customer">{o.customer_id}</span>
                    <span className="result-status">{o.status}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="odoo-right">
          <div className="lang-switch">
            <button className={`pill ${lang==='pl'?'active':''}`} onClick={()=>setLang('pl')} aria-pressed={lang==='pl'}>🇵🇱 PL</button>
            <button className={`pill ${lang==='en'?'active':''}`} onClick={()=>setLang('en')} aria-pressed={lang==='en'}>🇬🇧 EN</button>
          </div>

          <button
            ref={helpBtnRef}
            className="icon-btn"
            aria-haspopup="menu"
            aria-expanded={helpOpen}
            onClick={() => { setHelpOpen(v=>!v); setUserOpen(false) }}
            title={t.help}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2"/>
              <path d="M9.5 9a2.5 2.5 0 1 1 4.1 1.9c-.7.5-1.1 1-1.1 2v.3" fill="none" stroke="currentColor" strokeWidth="2"/>
              <circle cx="12" cy="17" r="1.5" fill="currentColor"/>
            </svg>
          </button>
          {helpOpen && (
            <div id="help-pop" className="popover menu">
              <button className="menu-item" onClick={handleDocsClick}>📖 {t.docs}</button>
              <button className="menu-item" onClick={handleShortcutsClick}>⌨️ {t.shortcuts}</button>
            </div>
          )}

          <button
            ref={userBtnRef}
            className="user-btn"
            aria-haspopup="menu"
            aria-expanded={userOpen}
            onClick={() => { setUserOpen(v=>!v); setHelpOpen(false) }}
            title="Account"
          >
            <span className="avatar">{profile?.email?.substring(0,2).toUpperCase() || 'U'}</span>
          </button>
          {userOpen && (
            <div id="user-pop" className="popover menu">
              <div className="menu-user-info">
                <div className="user-email">{profile?.email}</div>
                <div className="user-plan">{profile?.subscription_plan || 'free'}</div>
              </div>
              <hr />
              <button className="menu-item" onClick={() => { setUserOpen(false); onSettings() }}>⚙️ {t.settings}</button>
              <hr />
              <button className="menu-item danger" onClick={() => { setUserOpen(false); onLogout() }}>🚪 {t.logout}</button>
            </div>
          )}
        </div>
      </div>

      <div className="odoo-control">
        <div className="tabs" role="tablist" aria-label="Views">
          <Tab id="main" label={t.tabs.main} />
          <Tab id="guide" label={t.tabs.guide} />
        </div>
      </div>

      {shortcutsOpen && (
        <div className="shortcuts-modal" onClick={() => setShortcutsOpen(false)}>
          <div className="shortcuts-content" onClick={e => e.stopPropagation()}>
            <h3>{t.shortcuts}</h3>
            <pre>{t.shortcutsList}</pre>
            <button onClick={() => setShortcutsOpen(false)}>Close (Esc)</button>
          </div>
        </div>
      )}
    </header>
  )
}
