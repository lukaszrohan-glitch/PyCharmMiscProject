import { lazy, Suspense, useCallback, useEffect, useState } from 'react'
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import styles from './App.module.css'
import Header from './components/Header'
import MobileNav from './components/MobileNav'
import Settings from './components/Settings'
import CommandPalette from './components/CommandPalette'
import ErrorBoundary from './components/ErrorBoundary'
import { useAppContext } from './AppContext'
import { useAuth } from './auth/useAuth'

// Lazy loaded views
const LazyDashboard = lazy(() => import('./components/Dashboard'))
const LazyOrders = lazy(() => import('./components/Orders'))
const LazyProducts = lazy(() => import('./components/Products'))
const LazyProduction = lazy(() => import('./components/Production'))
const LazyInventory = lazy(() => import('./components/Inventory'))
const LazyClients = lazy(() => import('./components/Clients'))
const LazyTimesheets = lazy(() => import('./components/Timesheets'))
const LazyReports = lazy(() => import('./components/Reports'))
const LazyDemandPlanner = lazy(() => import('./components/DemandPlanner'))
const LazyFinancials = lazy(() => import('./components/Financials'))
const LazyUserGuide = lazy(() => import('./components/UserGuide'))
const LazyAdmin = lazy(() => import('./components/Admin'))

export default function App() {
  const navigate = useNavigate()
  const location = useLocation()
  const { profile, logout } = useAuth()
  const { lang, setLang, isSettingsOpen, setSettingsOpen } = useAppContext()

  const [currentView, setCurrentView] = useState('dashboard')
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false)

  // Sync current view with URL path
  useEffect(() => {
    const path = location.pathname.replace(/^\//, '') || 'dashboard'
    const root = path.split('/')[0]
    setCurrentView(root)
  }, [location.pathname])

  const handleViewChange = useCallback((view) => {
    setCurrentView(view)
    const map = {
      dashboard: '/dashboard',
      orders: '/orders',
      products: '/products',
      production: '/production',
      inventory: '/inventory',
      clients: '/clients',
      timesheets: '/timesheets',
      reports: '/reports',
      demand: '/demand',
      financials: '/financials',
      help: '/help',
      admin: '/admin',
    }
    navigate(map[view] || '/dashboard')
  }, [navigate])

  const handleSettings = useCallback(() => setSettingsOpen(true), [setSettingsOpen])

  const handleCommandAction = useCallback((action) => {
    if (!action) return
    if (action.type === 'go' && action.target) {
      handleViewChange(action.target)
      setCommandPaletteOpen(false)
    }
  }, [handleViewChange])

  // Inline wrapper so we can read orderId from query string for Financials
  function FinancialsRoute() {
    const qs = new URLSearchParams(location.search)
    const orderId = qs.get('orderId')
    return <LazyFinancials orderId={orderId} lang={lang} />
  }

  const isTransitioning = false

  return (
    <ErrorBoundary>
      <div className={styles.app}>
        <Header
          lang={lang}
          setLang={setLang}
          currentView={currentView}
          setCurrentView={handleViewChange}
          profile={profile}
          onSettings={handleSettings}
          onLogout={logout}
          onSearchSelect={(item) => {
            if (item?.order_id) {
              navigate(`/financials?orderId=${item.order_id}`)
              setCurrentView('financials')
            }
          }}
        />

        <main id="main-content" className={styles.mainContent}>
          <div className={isTransitioning ? `${styles.container} ${styles.transitioning}` : styles.container}>
            <Suspense fallback={<p>Loading...</p>}>
              <Routes>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<LazyDashboard lang={lang} setCurrentView={handleViewChange} />} />
                <Route path="/orders" element={<LazyOrders lang={lang} jumpToFinance={(orderId) => navigate(`/financials?orderId=${orderId}`)} />} />
                <Route path="/products" element={<LazyProducts lang={lang} />} />
                <Route path="/production" element={<LazyProduction lang={lang} />} />
                <Route path="/inventory" element={<LazyInventory lang={lang} />} />
                <Route path="/clients" element={<LazyClients lang={lang} />} />
                <Route path="/timesheets" element={<LazyTimesheets lang={lang} />} />
                <Route path="/reports" element={<LazyReports lang={lang} />} />
                <Route path="/demand" element={<LazyDemandPlanner lang={lang} />} />
                <Route path="/financials" element={<FinancialsRoute />} />
                <Route path="/help" element={<LazyUserGuide lang={lang} />} />
                <Route path="/admin" element={profile?.is_admin ? <LazyAdmin lang={lang} /> : <Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>

        <MobileNav
          lang={lang}
          currentView={currentView}
          onNavigate={handleViewChange}
          onSettings={handleSettings}
        />

        {isSettingsOpen && (
          <Settings
            profile={profile}
            onClose={() => setSettingsOpen(false)}
            onOpenAdmin={() => {
              setSettingsOpen(false)
              handleViewChange('admin')
            }}
            lang={lang}
          />
        )}

        <CommandPalette
          isOpen={commandPaletteOpen}
          onClose={() => setCommandPaletteOpen(false)}
          lang={lang}
          onAction={handleCommandAction}
        />
      </div>
    </ErrorBoundary>
  )
}
