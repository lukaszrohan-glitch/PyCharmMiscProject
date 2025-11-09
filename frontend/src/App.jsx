import React, { useState } from 'react';
import Header from './components/Header';
import styles from './App.module.css';

export default function App() {
  const [lang, setLang] = useState(
    localStorage.getItem('lang') || 'pl'
  );
  const [currentView, setCurrentView] = useState('dashboard');
  const [profile] = useState({
    name: 'Admin',
    email: 'admin@arkuszowniasmb.pl'
  });

  const handleLogout = () => {
    alert(lang === 'pl' ? 'Wylogowano (demo)' : 'Logged out (demo)');
  };

  const handleSettings = () => {
    alert(lang === 'pl' ? 'Ustawienia (w przygotowaniu)' : 'Settings (coming soon)');
  };

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
          <div className={styles.hero}>
            <h1 className={styles.heroTitle}>
              {lang === 'pl' ? 'Witamy w Arkuszownia SMB' : 'Welcome to Arkuszownia SMB'}
            </h1>
            <p className={styles.heroSubtitle}>
              {lang === 'pl'
                ? 'System zarządzania produkcją dla małych i średnich przedsiębiorstw'
                : 'Manufacturing management system for small and medium enterprises'
              }
            </p>
          </div>

          <div className={styles.cards}>
            <div className={styles.card}>
              <div className={styles.cardIcon}>📋</div>
              <h3 className={styles.cardTitle}>
                {lang === 'pl' ? 'Zamówienia' : 'Orders'}
              </h3>
              <p className={styles.cardText}>
                {lang === 'pl'
                  ? 'Zarządzaj zamówieniami klientów'
                  : 'Manage customer orders'
                }
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>📦</div>
              <h3 className={styles.cardTitle}>
                {lang === 'pl' ? 'Magazyn' : 'Inventory'}
              </h3>
              <p className={styles.cardText}>
                {lang === 'pl'
                  ? 'Kontroluj stany magazynowe'
                  : 'Control inventory levels'
                }
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>⏱️</div>
              <h3 className={styles.cardTitle}>
                {lang === 'pl' ? 'Czas pracy' : 'Timesheets'}
              </h3>
              <p className={styles.cardText}>
                {lang === 'pl'
                  ? 'Monitoruj czas pracowników'
                  : 'Monitor employee time'
                }
              </p>
            </div>

            <div className={styles.card}>
              <div className={styles.cardIcon}>📈</div>
              <h3 className={styles.cardTitle}>
                {lang === 'pl' ? 'Raporty' : 'Reports'}
              </h3>
              <p className={styles.cardText}>
                {lang === 'pl'
                  ? 'Analizuj wyniki działalności'
                  : 'Analyze business results'
                }
              </p>
            </div>
          </div>

          <div className={styles.status}>
            <div className={styles.statusBadge}>
              <span className={styles.statusDot}></span>
              <span className={styles.statusText}>
                {lang === 'pl' ? 'System działa poprawnie' : 'System operational'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

