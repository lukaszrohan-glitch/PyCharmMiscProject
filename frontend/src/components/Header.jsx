import React, { useState } from 'react'

export default function Header({ lang, setLang, currentView, setCurrentView }) {
  const [menuOpen, setMenuOpen] = useState(false)

  const labels = lang === 'pl'
    ? { app: 'Aplikacja SMB', guide: 'Poradnik Użytkownika', menu: 'Menu' }
    : { app: 'SMB Application', guide: 'User Guide', menu: 'Menu' }

  const handleSelect = (view) => {
    setCurrentView(view)
    setMenuOpen(false)
  }

  return (
    <header className="app-header">
      {/* Top row: brand + language */}
      <div className="header-top">
        <div className="header-content">
          <div className="logo-section">
            <svg className="logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
              <rect x="4" y="4" width="40" height="40" rx="8" fill="#2c5282" />
              <path d="M14 16h20M14 24h20M14 32h14" stroke="white" strokeWidth="3" strokeLinecap="round" />
              <circle cx="34" cy="32" r="4" fill="#48bb78" />
            </svg>
            <div className="logo-text">
              <h1 className="brand-name">Arkuszownia<span className="brand-accent">SMB</span></h1>
              <p className="brand-tagline">System Zarządzania Produkcją</p>
            </div>
          </div>

          <div className="header-actions">
            {/* Language switcher - far right */}
            <div className="lang-switcher" aria-label={lang==='pl'?'Przełącz język':'Switch language'}>
              <button
                className={`lang-btn ${lang === 'pl' ? 'active' : ''}`}
                onClick={() => setLang('pl')}
                title="Polski"
              >PL</button>
              <span className="v-sep" aria-hidden="true" />
              <button
                className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
                onClick={() => setLang('en')}
                title="English"
              >EN</button>
            </div>
          </div>
        </div>
      </div>

      {/* Second row: navigation/menu - left aligned */}
      <div className="header-nav">
        <div className="header-content">
          <div className="menu-wrapper">
            <button
              className="menu-btn"
              onClick={() => setMenuOpen(o => !o)}
              aria-haspopup="true"
              aria-expanded={menuOpen}
              aria-controls="mainmenu-dropdown"
            >
              ☰ {labels.menu}
            </button>
            {menuOpen && (
              <div id="mainmenu-dropdown" className="menu-dropdown" role="menu">
                <button role="menuitem" className={`menu-item ${currentView === 'main' ? 'active' : ''}`} onClick={() => handleSelect('main')}>
                  {labels.app}
                </button>
                <button role="menuitem" className={`menu-item ${currentView === 'guide' ? 'active' : ''}`} onClick={() => handleSelect('guide')}>
                  {labels.guide}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
