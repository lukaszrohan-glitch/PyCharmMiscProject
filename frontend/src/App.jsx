import { Suspense, lazy, useEffect, useState, useCallback } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from './AppContext';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import Login from './components/Login';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './auth/useAuth';
import { useTheme } from './hooks/useTheme';
import styles from './App.module.css';
import CommandPalette from './components/CommandPalette';

const LazyDashboard = lazy(() => import('./components/Dashboard'));
const LazyOrders = lazy(() => import('./components/Orders'));
const LazyProducts = lazy(() => import('./components/Products'));
const LazyProduction = lazy(() => import('./components/Production'));
const LazyInventory = lazy(() => import('./components/Inventory'));
const LazyClients = lazy(() => import('./components/Clients'));
const LazyTimesheets = lazy(() => import('./components/Timesheets'));
const LazyReports = lazy(() => import('./components/Reports'));
const LazyDemandPlanner = lazy(() => import('./components/DemandPlanner'));
const LazyFinancials = lazy(() => import('./components/Financials'));
const LazyUserGuide = lazy(() => import('./components/UserGuide'));
const LazyAdmin = lazy(() => import('./components/Admin'));

export default function App() {
  const { lang, setLang, isSettingsOpen, setSettingsOpen } = useAppContext();
  const { profile, checkingAuth, logout } = useAuth();
  const { toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = location.pathname.substring(1) || 'dashboard';
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Keyboard shortcut for Command Palette (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Handle Command Palette actions
  const handleCommandAction = useCallback((action) => {
    switch (action) {
      case 'toggleTheme':
        toggleTheme();
        break;
      case 'langPL':
        setLang('pl');
        break;
      case 'langEN':
        setLang('en');
        break;
      case 'openSettings':
        setSettingsOpen(true);
        break;
      case 'newOrder':
        navigate('/orders');
        // Could dispatch an event to open new order form
        break;
      case 'newProduct':
        navigate('/products');
        break;
      case 'newClient':
        navigate('/clients');
        break;
      default:
        break;
    }
  }, [toggleTheme, setLang, setSettingsOpen, navigate]);

  useEffect(() => {
    localStorage.setItem('lang', lang);
  }, [lang]);

  const handleLogout = () => {
    logout?.();
    navigate('/dashboard');
  };

  const handleSettings = () => setSettingsOpen(true);

  const handleViewChange = (newView) => {
    if (newView !== currentView) {
      navigate(`/${newView}`);
    }
  };

  useEffect(() => {
    const titles = {
      dashboard: lang === 'pl' ? 'Panel główny' : 'Dashboard',
      orders: lang === 'pl' ? 'Zamówienia' : 'Orders',
      products: lang === 'pl' ? 'Produkty' : 'Products',
      production: lang === 'pl' ? 'Produkcja' : 'Production',
      planning: lang === 'pl' ? 'Planowanie' : 'Planning',
      inventory: lang === 'pl' ? 'Magazyn' : 'Inventory',
      clients: lang === 'pl' ? 'Klienci' : 'Clients',
      timesheets: lang === 'pl' ? 'Czas pracy' : 'Timesheets',
      reports: lang === 'pl' ? 'Raporty' : 'Reports',
      demand: lang === 'pl' ? 'Popyt' : 'Demand planner',
      financials: lang === 'pl' ? 'Finanse' : 'Financials',
      help: lang === 'pl' ? 'Pomoc' : 'Help',
      admin: lang === 'pl' ? 'Administracja' : 'Admin',
    }
    const viewTitle = titles[currentView] || 'Synterra'
    document.title = `${viewTitle} - Synterra`;
  }, [currentView, lang]);

  if (checkingAuth) {
    return (
      <div className={styles.app}>
        <main id="main-content" className={styles.mainContent}>
          <div className={styles.container}><p>Loading...</p></div>
        </main>
      </div>
    );
  }

  if (!profile) {
    return <Login />;
  }

  return (
    <ErrorBoundary>
      <div className={styles.app}>
        <Header
          currentView={currentView}
          setCurrentView={handleViewChange}
          profile={profile}
          onSettings={handleSettings}
          onLogout={handleLogout}
        />
        <main id="main-content" className={styles.mainContent}>
          <div className={styles.container}>
            <Suspense fallback={<p>Loading...</p>}>
              <Routes>
                <Route path="/dashboard" element={<LazyDashboard setCurrentView={handleViewChange} />} />
                <Route path="/orders" element={<LazyOrders jumpToFinance={(orderId) => navigate(`/financials?orderId=${orderId}`)} />} />
                <Route path="/products" element={<LazyProducts />} />
                <Route path="/production" element={<LazyProduction />} />
                <Route path="/inventory" element={<LazyInventory />} />
                <Route path="/clients" element={<LazyClients />} />
                <Route path="/timesheets" element={<LazyTimesheets />} />
                <Route path="/reports" element={<LazyReports />} />
                <Route path="/demand" element={<LazyDemandPlanner />} />
                <Route path="/financials" element={<LazyFinancials />} />
                <Route path="/help" element={<LazyUserGuide />} />
                <Route path="/admin" element={profile?.is_admin ? <LazyAdmin /> : <Navigate to="/dashboard" replace />} />
                <Route path="*" element={<Navigate to="/dashboard" replace />} />
              </Routes>
            </Suspense>
          </div>
        </main>
        <MobileNav
          currentView={currentView}
          onNavigate={handleViewChange}
          onSettings={handleSettings}
        />
        {isSettingsOpen && (
          <Settings
            profile={profile}
            onClose={() => setSettingsOpen(false)}
            onOpenAdmin={() => {
              setSettingsOpen(false);
              handleViewChange('admin');
            }}
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
  );
}
