import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Orders from './components/Orders';
import Inventory from './components/Inventory';
import Timesheets from './components/Timesheets';
import Products from './components/Products';
import { getToken, setToken } from './services/api';
import styles from './App.module.css';

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'pl');
  const [currentView, setCurrentView] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (token) {
      import('./services/api').then(api => {
        api.getProfile()
          .then(profile => setProfile(profile))
          .catch(() => {
            setToken(null);
            setProfile(null);
          });
      });
    }
  }, []);

  const handleLogin = (data) => {
    setProfile(data.user);
    setToken(data.token);
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
      case 'dashboard':
      default:
        return <Dashboard lang={lang} setCurrentView={setCurrentView} />;
    }
  };

  if (!profile) {
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
        <div className={styles.container}>
          {renderView()}
        </div>
      </main>
      {isSettingsOpen && (
        <Settings
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          lang={lang}
        />
      )}
    </div>
  );
}
