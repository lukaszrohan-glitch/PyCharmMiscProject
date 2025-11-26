import React, { useState } from 'react'
import Header from './Header'
import Login from './Login'
import UserGuide from './UserGuide'
import HelpPanel from './HelpPanel'
import styles from './App.module.css'
import './styles/global.css'

export default function App({
  lang = 'pl',
  setLang,
  currentView = 'dashboard',
  setCurrentView,
  profile,
  onSettings,
  onLogout,
  onSearchSelect,
  jumpToFinance,
}) {
  const [showGuide, setShowGuide] = useState(false)
  const [showHelp, setShowHelp] = useState(false)

  const handleLogout = () => onLogout?.()
  const handleSettings = () => onSettings?.()
  const handleSearchSelect = jumpToFinance || onSearchSelect

  if (!profile) {
    return <Login lang={lang} setLang={setLang} />
  }

  return (
    <div className={styles.app}>
      <Header
        lang={lang}
        setLang={setLang}
        currentView={currentView}
        setCurrentView={setCurrentView}
        profile={profile}
        onSettings={handleSettings}
        onLogout={handleLogout}
        onSearchSelect={handleSearchSelect}
        onOpenHelp={() => setShowHelp(true)}
        isHelpOpen={showHelp}
      />
      {/* Placeholder for routed content */}
      {showGuide && (
        <UserGuide
          lang={lang}
          onClose={() => setShowGuide(false)}
        />
      )}
      {showHelp && (
        <HelpPanel
          lang={lang}
          onClose={() => setShowHelp(false)}
          onOpenGuide={() => {
            setShowHelp(false)
            setShowGuide(true)
          }}
        />
      )}
    </div>
  )
}
