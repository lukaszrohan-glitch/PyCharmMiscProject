import { useState, useEffect } from 'react';
import Header from './components/Header';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Settings from './components/Settings';
import Orders from './components/Orders';
import Inventory from './components/Inventory';
import Timesheets from './components/Timesheets';
import Reports from './components/Reports';
import Financials from './components/Financials';
import Clients from './components/Clients';
import Admin from './components/Admin';
import UserGuide from './components/UserGuide';
import HelpPanel from './components/HelpPanel';
import Products from './components/Products';
import Production from './components/Production';
import { useAuth } from './auth/useAuth';
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
  const [showHelp, setShowHelp] = useState(false);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const { profile, checkingAuth, logout } = useAuth();

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

  const handleLogout = () => {
    console.log('Logging out...');
    logout?.();
    setCurrentView('dashboard');
  };

  const handleSettings = () => {
    console.log('Opening Settings modal...');
    setSettingsOpen(true);
  };

  // Jump to finance view with specific order
  const jumpToFinance = (orderId) => {
    setInitialFinanceOrderId(orderId);
    handleViewChange('financials');
  };

  // Smooth view transitions
  const handleViewChange = (newView) => {
    if (newView === currentView) return;
    setIsTransitioning(true);
    setCurrentView(newView);
    // Reset after animation duration
    setTimeout(() => setIsTransitioning(false), 300);
  };

  // Update document title when view changes
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

  const renderView = () => {

    let content;
    switch (currentView) {
      case 'orders':
        content = <Orders lang={lang} jumpToFinance={jumpToFinance} />;
        break;
      case 'products':
        content = <Products lang={lang} />;
        break;
      case 'production':
        content = <Production lang={lang} />;
        break;
      case 'inventory':
        content = <Inventory lang={lang} />;
        break;
      case 'clients':
        content = <Clients lang={lang} />;
        break;
      case 'timesheets':
        content = <Timesheets lang={lang} />;
        break;
      case 'reports':
        content = <Reports lang={lang} />;
        break;
      case 'financials':
        content = <Financials lang={lang} initialOrderId={initialFinanceOrderId} />;
        break;
      case 'admin':
        // prosty guard po stronie frontu – backend i tak musi sprawdzać
        if (profile?.is_admin) {
          content = <Admin lang={lang} />;
        } else {
          content = <Dashboard lang={lang} setCurrentView={setCurrentView} />;
        }
        break;
      case 'dashboard':
      default:
        content = <Dashboard lang={lang} setCurrentView={setCurrentView} />;
    }

    return (
      <div className={styles.viewWrapper} key={currentView}>
        {content}
      </div>
    );
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
        setCurrentView={handleViewChange}
        profile={profile}
        onSettings={handleSettings}
        onLogout={handleLogout}
        onSearchSelect={jumpToFinance}
        onOpenHelp={() => setShowHelp(true)}
        isHelpOpen={showHelp}
      />
      <main id="main-content" className={styles.mainContent}>
        <div className={`${styles.container} ${isTransitioning ? styles.transitioning : ''}`}>
          {isTransitioning && (
            <div className={styles.loadingOverlay}>
              <div className={styles.spinner} />
            </div>
          )}
          {renderView()}
        </div>
      </main>
      {isSettingsOpen && (
        <Settings
          profile={profile}
          onClose={() => setSettingsOpen(false)}
          onOpenAdmin={() => {
            setSettingsOpen(false);
            handleViewChange('admin');
          }}
          lang={lang}
        />
      )}
      {showGuide && <UserGuide lang={lang} onClose={() => setShowGuide(false)} />}
      {showHelp && (
        <HelpPanel
          lang={lang}
          onClose={() => setShowHelp(false)}
          onOpenGuide={() => {
            setShowHelp(false);
            setShowGuide(true);
          }}
        />
      )}
    </div>
  );
}
