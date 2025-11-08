import React, { useEffect, useMemo, useRef, useState } from 'react'

export default function Header({ lang, setLang, currentView, setCurrentView }) {
  // i18n dictionary
  const t = useMemo(() => (lang === 'pl' ? {
    appName: 'Arkuszownia SMB',
    tagline: 'System Zarządzania Produkcją',
    searchPlaceholder: 'Wyszukaj… (/)',
    help: 'Pomoc',
    docs: 'Dokumentacja',
    shortcuts: 'Skróty klawiaturowe (?)',
    settings: 'Ustawienia',
    logout: 'Wyloguj',
    tabs: { main: 'Aplikacja SMB', guide: 'Poradnik Użytkownika' }
  } : {
    appName: 'Arkuszownia SMB',
    tagline: 'Manufacturing Management System',
    searchPlaceholder: 'Search… (/)',
    help: 'Help',
    docs: 'Documentation',
    shortcuts: 'Keyboard shortcuts (?)',
    settings: 'Settings',
    logout: 'Sign out',
    tabs: { main: 'SMB Application', guide: 'User Guide' }
  }), [lang])

  // UI state
  const [userOpen, setUserOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [appsOpen, setAppsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const searchRef = useRef(null)
  const appsBtnRef = useRef(null)
  const userBtnRef = useRef(null)
  const helpBtnRef = useRef(null)

  // persist language
  useEffect(() => { try { localStorage.setItem('lang', lang) } catch {} }, [lang])

  // global shortcuts
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === '/' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); searchRef.current?.focus() }
      else if (e.key === '?' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); setHelpOpen(true) }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // outside click close
  useEffect(() => {
    const onDown = (e) => {
      const ids = ['apps-pop','user-pop','help-pop']
      if (!ids.some(id => document.getElementById(id)?.contains(e.target))) {
        setAppsOpen(false); setUserOpen(false); setHelpOpen(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const Tab = ({ id, label }) => (
    <button className={`odoo-tab ${currentView === id ? 'active' : ''}`} onClick={()=>setCurrentView(id)} role="tab" aria-selected={currentView === id}>{label}</button>
  )

  return (
    <header className="odoo-shell">
      <div className="odoo-topbar">
        <div className="odoo-left">
          <button
            ref={appsBtnRef}
            className="icon-btn"
            aria-haspopup="menu"
            aria-expanded={appsOpen}
            onClick={() => { setAppsOpen(v=>!v); setUserOpen(false); setHelpOpen(false) }}
            title="Apps"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
              {Array.from({length:9}).map((_,i)=>(<rect key={i} x={(i%3)*7+2} y={Math.floor(i/3)*7+2} width="3" height="3" rx="1"/>))}
            </svg>
          </button>
          {appsOpen && (
            <div id="apps-pop" className="popover menu apps-pop">
              <button className="menu-item" onClick={()=>setCurrentView('main')}>{t.tabs.main}</button>
              <button className="menu-item" onClick={()=>setCurrentView('guide')}>{t.tabs.guide}</button>
            </div>
          )}
          <div className="brand">
            <span className="brand-title">{t.appName}</span>
            <span className="brand-sub">{t.tagline}</span>
          </div>
        </div>
        <div className="odoo-center">
          <input
            ref={searchRef}
            value={query}
            onChange={(e)=>setQuery(e.target.value)}
            className="odoo-search"
            placeholder={t.searchPlaceholder}
            aria-label={t.searchPlaceholder}
          />
          <kbd className="slash">/</kbd>
        </div>
        <div className="odoo-right">
          <div className="lang-switch">
            <button className={`pill ${lang==='pl'?'active':''}`} onClick={()=>setLang('pl')} aria-pressed={lang==='pl'}>PL</button>
            <button className={`pill ${lang==='en'?'active':''}`} onClick={()=>setLang('en')} aria-pressed={lang==='en'}>EN</button>
          </div>
          <button
            ref={helpBtnRef}
            className="icon-btn"
            aria-haspopup="menu"
            aria-expanded={helpOpen}
            onClick={() => { setHelpOpen(v=>!v); setUserOpen(false); setAppsOpen(false) }}
            title={t.help}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="10"/><path d="M9.5 9a2.5 2.5 0 1 1 4.1 1.9c-.7.5-1.1 1-1.1 2v.3"/><circle cx="12" cy="17" r="1"/></svg>
          </button>
          {helpOpen && (
            <div id="help-pop" className="popover menu">
              <button className="menu-item">{t.docs}</button>
              <button className="menu-item">{t.shortcuts}</button>
            </div>
          )}
          <button
            ref={userBtnRef}
            className="user-btn"
            aria-haspopup="menu"
            aria-expanded={userOpen}
            onClick={() => { setUserOpen(v=>!v); setHelpOpen(false); setAppsOpen(false) }}
            title="Account"
          >
            <span className="avatar">AS</span>
          </button>
          {userOpen && (
            <div id="user-pop" className="popover menu">
              <button className="menu-item">{t.settings}</button>
              <hr />
              <button className="menu-item danger">{t.logout}</button>
            </div>
          )}
        </div>
      </div>
      <div className="odoo-control">
        <div className="tabs" role="tablist" aria-label="Views">
          <Tab id="main" label={t.tabs.main} />
          <Tab id="guide" label={t.tabs.guide} />
        </div>
        <div className="cp-actions">
          <button className="chip">Filter</button>
            <button className="chip">Group</button>
          <button className="chip">Favorites</button>
          <span className="badge" aria-label="Notifications">3</span>
        </div>
      </div>
    </header>
  )
}
