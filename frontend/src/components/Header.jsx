      if (e.key === 'Escape') {
        e.preventDefault()
        setMenuOpen(false)
        menuBtnRef.current?.focus()
      }
      if (['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(e.key)) {
        e.preventDefault()
        const items = Array.from(menuRef.current.querySelectorAll('[role="menuitem"]'))
        const idx = items.indexOf(document.activeElement)
        const nextIdx =
          e.key === 'ArrowDown' ? Math.min(idx + 1, items.length - 1)
          : e.key === 'ArrowUp' ? Math.max(idx - 1, 0)
          : e.key === 'Home' ? 0
          : items.length - 1
        items[nextIdx]?.focus()
      }
    }
    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onKey)
    }
  }, [menuOpen])

  // Focus first menu item on open
  useEffect(() => {
    if (menuOpen) {
      const first = menuRef.current?.querySelector('[role="menuitem"]')
      first && first.focus()
    }
  }, [menuOpen])
import React, { useEffect, useRef, useState } from 'react'

export default function Header({ lang, setLang, currentView, setCurrentView }) {
      {/* Skip link for keyboard users */}
      <a href="#main-content" className="skip-link">{t.skip}</a>

  const [menuOpen, setMenuOpen] = useState(false)
  const menuBtnRef = useRef(null)
  const menuRef = useRef(null)
          <div className="logo-section" aria-label="brand">
  // i18n labels
              <rect x="4" y="4" width="40" height="40" rx="8" />
              <path d="M14 16h20M14 24h20M14 32h14" strokeWidth="3" strokeLinecap="round" />
              <circle cx="34" cy="32" r="4" />
        guide: 'Poradnik Użytkownika',
        menu: 'Menu',
              <div className="brand-name">Arkuszownia<span className="brand-accent">SMB</span></div>
              <p className="brand-tagline">{t.brandTag}</p>
        switchLang: 'Przełącz język',
        brandTag: 'System Zarządzania Produkcją',
        skip: 'Przejdź do treści'
      }
            <div className="lang-switcher" aria-label={t.switchLang}>
        guide: 'User Guide',
        menu: 'Menu',
        openMenu: 'Open menu',
                aria-pressed={lang === 'pl'}
        switchLang: 'Switch language',
        brandTag: 'Manufacturing Management System',
        skip: 'Skip to content'
      }

                aria-pressed={lang === 'en'}
  useEffect(() => { try { localStorage.setItem('lang', lang) } catch {} }, [lang])

  const handleSelect = (view) => {
    setCurrentView(view)
    setMenuOpen(false)
    menuBtnRef.current?.focus()
      {/* Second row: navigation/menu */}
      <nav className="header-nav" aria-label="Primary">
  // Click outside & Escape close, roving focus inside menu
  useEffect(() => {
    const onClickOutside = (e) => {
              ref={menuBtnRef}
      if (menuOpen && menuRef.current && !menuRef.current.contains(e.target) && !menuBtnRef.current.contains(e.target)) {
        setMenuOpen(false)
              aria-haspopup="menu"
      }
    }
              title={menuOpen ? t.closeMenu : t.openMenu}
    const onKey = (e) => {
              <span aria-hidden="true">☰</span> {t.menu}


            <div
              id="mainmenu-dropdown"
              ref={menuRef}
              className={`menu-dropdown ${menuOpen ? 'open' : ''}`}
              role="menu"
              aria-hidden={!menuOpen}
            >
              <ul className="menu-list" role="none">
                <li role="none">
                  <button
                    role="menuitem"
                    className={`menu-item ${currentView === 'main' ? 'active' : ''}`}
                    onClick={() => handleSelect('main')}
                  >
                    {t.app}
                  </button>
                </li>
                <li role="none">
                  <button
                    role="menuitem"
                    className={`menu-item ${currentView === 'guide' ? 'active' : ''}`}
                    onClick={() => handleSelect('guide')}
                  >
                    {t.guide}
                  </button>
                </li>
              </ul>
            </div>
            </svg>
            <div className="logo-text">
      </nav>
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
