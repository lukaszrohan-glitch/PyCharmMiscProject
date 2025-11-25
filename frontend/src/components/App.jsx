// ...existing code...
  const [showGuide, setShowGuide] = useState(false)
// ...existing code...
  const toggleGuide = (open = true) => setShowGuide(open)
// ...existing code...
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
        onSearchSelect={jumpToFinance}
        onOpenGuide={() => toggleGuide(true)}
      />
// ...existing code...
      {showGuide && (
        <UserGuide
          lang={lang}
          onClose={() => toggleGuide(false)}
        />
      )}
    </div>
  )
}

