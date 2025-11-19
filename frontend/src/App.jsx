import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Orders from './components/Orders';
import Inventory from './components/Inventory';
import Timesheets from './components/Timesheets';
import Products from './components/Products';
import Reports from './components/Reports';
import Financials from './components/Financials';
import Clients from './components/Clients';
import Admin from './components/Admin';
import UserGuide from './components/UserGuide';
import { useAuth } from './auth/AuthProvider';
import styles from './App.module.css';

export default function App() {
  const [lang, setLang] = useState(
    typeof window !== 'undefined'
      ? localStorage.getItem('lang') || 'pl'
      : 'pl'
  );
  const [currentView, setCurrentView] = useState('dashboard');
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [initialFinanceOrderId, setInitialFinanceOrderId] = useState(null);
  const [showGuide, setShowGuide] = useState(false);
  const { profile, checkingAuth, setAuth, logout } = useAuth();

  // zapisujemy język przy zmianie
  useEffect(() => {
    try {
      localStorage.setItem('lang', lang);
    } catch {
      // ignorujemy błędy localStorage (np. private mode)
    }
  }, [lang]);

  // sprawdzamy token + profil przy starcie
  useEffect(() => {
    // Auth bootstrap handled by AuthProvider; no-op
    return;

    /* (async () => {
      try {
        // uwaga: dynamiczny import OK jeśli chcesz code-splitting,
        // ale nie jest konieczny, skoro i tak importujesz getToken/setToken
        const api = await import('./services/api');
        const profileData = await api.getProfile();
        setProfile(profileData);
      } catch (e) {
        console.error(e);
        setToken(null); // warto mieć implementację, która czyści token
        setProfile(null);
      } finally {
        setCheckingAuth(false);
      }
    })(); */
  }, []);

  const handleLogin = (data) => {
    // załóżmy, że data = { user, token }
    // Update global auth context as well
    setAuth?.(data.user, data.token);
    
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    logout?.();
    setCurrentView('dashboard');
  };

  const handleSettings = () => {
    setSettingsOpen(true);
  };

  const jumpToFinance = (orderId) => {
    setInitialFinanceOrderId(orderId);
    setCurrentView('financials');
  };

  const renderView = () => {
    switch (currentView) {
      case 'orders':
        return <Orders lang={lang} />;
      case 'inventory':
        return <Inventory lang={lang} />;
      case 'clients':
        return <Clients lang={lang} />;
      case 'timesheets':
        return <Timesheets lang={lang} />;
      case 'reports':
        return <Reports lang={lang} />;
      case 'financials':
        return <Financials lang={lang} initialOrderId={initialFinanceOrderId} />;
      case 'admin':
        // prosty guard po stronie frontu – backend i tak musi sprawdzać
        if (profile?.is_admin) {
          return <Admin lang={lang} />;
        }
        return <Dashboard lang={lang} setCurrentView={setCurrentView} />;
      case 'dashboard':
      default:
        return <Dashboard lang={lang} setCurrentView={setCurrentView} />;
    }
  };

  // podczas sprawdzania autoryzacji – prosty ekran ładowania
  if (checkingAuth) {
    return (
      <div className={styles.app}>
        <main id="main-content" className={styles.mainContent}>
          <div className={styles.container}>
            <p>Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (!profile) {
    // Login może mieć przełącznik języka, więc przekazanie setLang ma sens
    return <Login lang={lang} setLang={setLang} />;
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
        onOpenGuide={() => setShowGuide(true)}
      />
      <main id="main-content" className={styles.mainContent}>
        <div className={styles.container}>{renderView()}</div>
      </main>
      {isSettingsOpen && (
        <Settings
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          onOpenAdmin={() => {
            setSettingsOpen(false);
            setCurrentView('admin');
          }}
          lang={lang}
        />
      )}
      {showGuide && <UserGuide lang={lang} onClose={() => setShowGuide(false)} />}
    </div>
  );
}
