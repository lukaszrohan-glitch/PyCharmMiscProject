import { useEffect } from 'react';
import { Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppContext } from './AppContext';
import Header from './components/Header';
import MobileNav from './components/MobileNav';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Orders from './components/Orders';
import Inventory from './components/Inventory';
import Timesheets from './components/Timesheets';
import Reports from './components/Reports';
import Financials from './components/Financials';
import Clients from './components/Clients';
import DemandPlanner from './components/DemandPlanner';
import Admin from './components/Admin';
import UserGuide from './components/UserGuide';
import Products from './components/Products';
import Production from './components/Production';
import { useAuth } from './auth/useAuth';
import styles from './App.module.css';

export default function App() {
  const { lang, isSettingsOpen, setSettingsOpen } = useAppContext();
  const { profile, checkingAuth, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const currentView = location.pathname.substring(1) || 'dashboard';

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
    const viewTitle = {
      dashboard: lang === 'pl' ? 'Panel główny' : 'Dashboard',
      orders: lang === 'pl' ? 'Zamówienia' : 'Orders',
      inventory: lang === 'pl' ? 'Magazyn' : 'Inventory',
      clients: lang === 'pl' ? 'Klienci' : 'Clients',
      timesheets: lang === 'pl' ? 'Czas pracy' : 'Timesheets',
      reports: lang === 'pl' ? 'Raporty' : 'Reports',
      financials: lang === 'pl' ? 'Finanse' : 'Financials',
      admin: lang === 'pl' ? 'Administracja' : 'Admin',
    }[currentView] || 'Synterra';
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
          <Routes>
            <Route path="/dashboard" element={<Dashboard setCurrentView={handleViewChange} />} />
            <Route path="/orders" element={<Orders jumpToFinance={(orderId) => navigate(`/financials?orderId=${orderId}`)} />} />
            <Route path="/products" element={<Products />} />
            <Route path="/production" element={<Production />} />
            <Route path="/planning" element={<Navigate to="/production" replace />} />
            <Route path="/inventory" element={<Inventory />} />
            <Route path="/clients" element={<Clients />} />
            <Route path="/timesheets" element={<Timesheets />} />
            <Route path="/reports" element={<Reports />} />
            <Route path="/demand" element={<DemandPlanner />} />
            <Route path="/financials" element={<Financials />} />
            <Route path="/help" element={<UserGuide />} />
            <Route path="/admin" element={profile?.is_admin ? <Admin /> : <Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
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
    </div>
  );
}
