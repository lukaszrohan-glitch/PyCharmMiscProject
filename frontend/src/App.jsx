import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Orders from './components/Orders';
import Inventory from './components/Inventory';
import Timesheets from './components/Timesheets';
import Products from './components/Products';
import Admin from './components/Admin';
import { getToken, setToken } from './services/api';
import styles from './App.module.css';

export default function App() {
  const [lang, setLang] = useState(
    typeof window !== 'undefined'
      ? localStorage.getItem('lang') || 'pl'
      : 'pl'
  );
  const [currentView, setCurrentView] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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
    const token = getToken();
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    (async () => {
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
    })();
  }, []);

  const handleLogin = (data) => {
    // załóżmy, że data = { user, token }
    setProfile(data.user);
    setToken(data.token);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    setProfile(null);
    setToken(null);
    setCurrentView('dashboard');
  };

  const handleSettings = () => {
    setSettingsOpen(true);
  };

  const renderView = () => {
    switch (currentView) {
      case 'orders':
        return <Orders lang={lang} />;
      case 'inventory':
        return <Inventory lang={lang} />;
      case 'timesheets':
        return <Timesheets lang={lang} />;
      case 'reports':
        return <Products lang={lang} />;
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
    return <Login onLogin={handleLogin} lang={lang} setLang={setLang} />;
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
    </div>
  );
}
