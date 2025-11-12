import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import { getToken, setToken } from './services/api';
import styles from './App.module.css';

// Placeholder components for different views
const Orders = () => <div>Orders View (w budowie)</div>;
const Inventory = () => <div>Inventory View (w budowie)</div>;
const Timesheets = () => <div>Timesheets View (w budowie)</div>;
const Reports = () => <div>Reports View (w budowie)</div>;

export default function App() {
  const [lang, setLang] = useState(localStorage.getItem('lang') || 'pl');
  const [currentView, setCurrentView] = useState('dashboard');
  const [profile, setProfile] = useState(null);
  const [isSettingsOpen, setSettingsOpen] = useState(false);

  // Check for existing token on initial load
  useEffect(() => {
    const token = getToken();
    if (token) {
      // In a real app, you'd verify the token and fetch the user profile
      setProfile({ name: 'Admin', email: 'admin@arkuszowniasmb.pl', is_admin: true });
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
        return <Orders />;
      case 'inventory':
        return <Inventory />;
      case 'timesheets':
        return <Timesheets />;
      case 'reports':
        return <Reports />;
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
