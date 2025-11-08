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
      <div className="header-content">
        <div className="logo-section">
          <svg className="logo-icon" viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
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
          {/* Simple dropdown menu */}
          <div className="menu-wrapper">
            <button className="menu-btn" onClick={() => setMenuOpen(o => !o)} aria-haspopup="true" aria-expanded={menuOpen}>
              ☰ {labels.menu}
            </button>
            {menuOpen && (
              <div className="menu-dropdown" role="menu">
                <button
                  role="menuitem"
                  className={`menu-item ${currentView === 'main' ? 'active' : ''}`}
                  onClick={() => handleSelect('main')}
                >
                  {labels.app}
                </button>
                <button
                  role="menuitem"
                  className={`menu-item ${currentView === 'guide' ? 'active' : ''}`}
                  onClick={() => handleSelect('guide')}
                >
                  {labels.guide}
                </button>
              </div>
            )}
          </div>

          {/* Language switcher - text PL/EN same size */}
          <div className="lang-switcher">
            <button
              className={`lang-btn ${lang === 'pl' ? 'active' : ''}`}
              onClick={() => setLang('pl')}
              title="Polski"
            >
              PL
            </button>
            <button
              className={`lang-btn ${lang === 'en' ? 'active' : ''}`}
              onClick={() => setLang('en')}
              title="English"
            >
              EN
            </button>
          </div>
        </div>
      </div>
    </header>
  )
}
