// Accessible, two-row header with dropdown menu and language switcher
import React, { useEffect, useRef, useState } from 'react'

export default function Header({ lang, setLang, currentView, setCurrentView }) {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef(null)
  const menuRef = useRef(null)

  const t = lang === 'pl'
    ? { app: 'Aplikacja SMB', guide: 'Poradnik Użytkownika', menu: 'Menu', openMenu: 'Otwórz menu', closeMenu: 'Zamknij menu', switchLang: 'Przełącz język', brandTag: 'System Zarządzania Produkcją', skip: 'Przejdź do treści' }
    : { app: 'SMB Application', guide: 'User Guide', menu: 'Menu', openMenu: 'Open menu', closeMenu: 'Close menu', switchLang: 'Switch language', brandTag: 'Manufacturing Management System', skip: 'Skip to content' }

  // Persist language selection
  useEffect(()=>{ try{ localStorage.setItem('lang', lang) }catch{} }, [lang])

  const handleSelect = (view) => { setCurrentView(view); setMenuOpen(false); menuBtnRef.current?.focus() }

  useEffect(() => {
    const onClickOutside = (e) => {
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target) && !menuBtnRef.current.contains(e.target)) {
        setMenuOpen(false); menuBtnRef.current?.focus()
      }
    }
    const onKey = (e) => {
      if (!menuOpen) return
      if (e.key === 'Escape') { e.preventDefault(); setMenuOpen(false); menuBtnRef.current?.focus() }
      if (['ArrowDown','ArrowUp','Home','End'].includes(e.key)) {
        e.preventDefault()
        const items = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]'))
        const idx = items.indexOf(document.activeElement)
        const nextIdx = e.key==='ArrowDown'?Math.min(idx+1,items.length-1): e.key==='ArrowUp'?Math.max(idx-1,0): e.key==='Home'?0: items.length-1
        items[nextIdx]?.focus()
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onClickOutside); document.removeEventListener('keydown', onKey) }
  }, [menuOpen])

  useEffect(()=>{ if(menuOpen){ const first = menuRef.current?.querySelector('[role="menuitem"]'); first && first.focus() } }, [menuOpen])

  return (
    <header className="app-header">
      <a href="#main-content" className="skip-link">{t.skip}</a>
      <div className="header-top">
        <div className="header-content">
          <div className="logo-section" aria-label="brand">
            <svg className="logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="4" y="4" width="40" height="40" rx="8" />
              <path d="M14 16h20M14 24h20M14 32h14" strokeWidth="3" strokeLinecap="round" />
              <circle cx="34" cy="32" r="4" />
            </svg>
            <div className="logo-text">
              <div className="brand-name">Arkuszownia<span className="brand-accent">SMB</span></div>
              <p className="brand-tagline">{t.brandTag}</p>
            </div>
          </div>
          <div className="header-actions">
            <div className="lang-switcher" aria-label={t.switchLang}>
              <button className={`lang-btn ${lang==='pl'?'active':''}`} onClick={()=>setLang('pl')} aria-pressed={lang==='pl'}>PL</button>
              <span className="v-sep" aria-hidden="true" />
              <button className={`lang-btn ${lang==='en'?'active':''}`} onClick={()=>setLang('en')} aria-pressed={lang==='en'}>EN</button>
            </div>
          </div>
        </div>
      </div>
      <nav className="header-nav" aria-label="Primary">
        <div className="header-content">
          <div className="menu-wrapper">
            <button ref={menuBtnRef} className="menu-btn" onClick={()=>setMenuOpen(o=>!o)} aria-haspopup="menu" aria-expanded={menuOpen} aria-controls="mainmenu-dropdown" title={menuOpen? t.closeMenu : t.openMenu}>
              <span aria-hidden="true">☰</span> {t.menu}
            </button>
            <div id="mainmenu-dropdown" ref={menuRef} className={`menu-dropdown ${menuOpen?'open':''}`} role="menu" aria-hidden={!menuOpen}>
              <ul className="menu-list" role="none">
                <li role="none"><button role="menuitem" className={`menu-item ${currentView==='main'?'active':''}`} onClick={()=>handleSelect('main')} aria-current={currentView==='main'?'page':undefined}>{t.app}</button></li>
                <li role="none"><button role="menuitem" className={`menu-item ${currentView==='guide'?'active':''}`} onClick={()=>handleSelect('guide')} aria-current={currentView==='guide'?'page':undefined}>{t.guide}</button></li>
              </ul>
            </div>
          </div>
        </div>
      </nav>
    </header>
  )
}
