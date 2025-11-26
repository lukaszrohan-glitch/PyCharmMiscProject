import styles from '../App.module.css';
import RotatingQuotes from './RotatingQuotes';

const IconOrders = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
    <g fill="none" stroke="#06B6D4" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="11" height="4" rx="2" />
      <rect x="4" y="10" width="11" height="4" rx="2" />
      <rect x="4" y="16" width="11" height="4" rx="2" />
      <circle cx="17.5" cy="6" r="1.4" fill="#A3E635" stroke="#111827" strokeWidth="0.9" />
      <circle cx="17.5" cy="12" r="1.4" />
      <circle cx="17.5" cy="18" r="1.4" />
      <path d="M15.5 11.5l1.2 1.6 2.3-3.2" stroke="#A3E635" />
    </g>
  </svg>
)

const IconClients = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
    <g fill="none" stroke="#06B6D4" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="2.4" />
      <path d="M4.8 14.2c0-2.2 1.9-3.6 4.2-3.6s4.2 1.4 4.2 3.6" />
      <circle cx="15.5" cy="7.5" r="2" stroke="#A3E635" />
      <path d="M13.3 12.5c0-1.8 1.6-3 3.2-3" stroke="#A3E635" />
      <circle cx="6" cy="18" r="1.3" fill="#A3E635" stroke="#111827" strokeWidth="0.7" />
      <circle cx="12" cy="18" r="1.3" />
      <circle cx="18" cy="18" r="1.3" />
      <path d="M7.3 18h3.4M13.3 18h3.4" />
    </g>
  </svg>
)

const IconWarehouse = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
    <g fill="none" stroke="#06B6D4" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.5L12 4.5l8.5 6" />
      <path d="M5 10.5v8.5h14v-8.5" />
      <rect x="7" y="12" width="4" height="3" rx="0.8" />
      <rect x="13" y="12" width="4" height="3" rx="0.8" />
      <rect x="10" y="16" width="4" height="3" rx="0.8" fill="#A3E635" stroke="#111827" strokeWidth="0.9" />
    </g>
  </svg>
)

const IconTimesheets = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
    <g fill="none" stroke="#06B6D4" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3.5" width="10" height="17" rx="2" />
      <line x1="6.5" y1="8" x2="12.5" y2="8" />
      <line x1="6.5" y1="11" x2="12.5" y2="11" />
      <line x1="6.5" y1="14" x2="11" y2="14" />
      <circle cx="17.5" cy="15.5" r="3.3" fill="#A3E635" stroke="#111827" strokeWidth="1.1" />
      <path d="M17.5 13.7v1.9l1.4 0.9" stroke="#111827" strokeWidth="1.1" />
    </g>
  </svg>
)

const IconReports = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
    <g fill="none" stroke="#06B6D4" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="4" height="14" rx="1" />
      <rect x="10" y="9" width="4" height="9" rx="1" />
      <rect x="16" y="6" width="4" height="12" rx="1" fill="#A3E635" stroke="#111827" strokeWidth="0.9" />
      <path d="M4 20h16" />
    </g>
  </svg>
)

const IconFinance = () => (
  <svg viewBox="0 0 24 24" width="32" height="32" aria-hidden="true">
    <g fill="none" stroke="#06B6D4" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M4 10h16" />
      <circle cx="9" cy="13" r="1.6" fill="#A3E635" stroke="#111827" strokeWidth="0.9" />
      <path d="M13 13h4" />
    </g>
  </svg>
)

export default function Dashboard({ lang, setCurrentView }) {
  const cards = [
    { view: 'orders', icon: <IconOrders />, title: lang === 'pl' ? 'Zamówienia' : 'Orders', text: lang === 'pl' ? 'Zarządzaj zamówieniami klientów' : 'Manage customer orders' },
    { view: 'clients', icon: <IconClients />, title: lang === 'pl' ? 'Klienci' : 'Clients', text: lang === 'pl' ? 'Zarządzaj klientami' : 'Manage customers' },
    { view: 'inventory', icon: <IconWarehouse />, title: lang === 'pl' ? 'Magazyn' : 'Inventory', text: lang === 'pl' ? 'Kontroluj stany magazynowe' : 'Control inventory levels' },
    { view: 'timesheets', icon: <IconTimesheets />, title: lang === 'pl' ? 'Czas pracy' : 'Timesheets', text: lang === 'pl' ? 'Monitoruj czas pracowników' : 'Monitor employee time' },
    { view: 'reports', icon: <IconReports />, title: lang === 'pl' ? 'Raporty' : 'Reports', text: lang === 'pl' ? 'Analizuj wyniki działalności' : 'Analyze business results' },
    { view: 'financials', icon: <IconFinance />, title: lang === 'pl' ? 'Finanse' : 'Financials', text: lang === 'pl' ? 'Przegląd finansów zamówień' : 'Order financial overview' }
  ]

  return (
    <>
      <div className={styles.hero}>
        <RotatingQuotes lang={lang} />
      </div>

      <div className={styles.cards}>
        {cards.map(card => (
          <button
            key={card.view}
            type="button"
            className={styles.card}
            onClick={() => setCurrentView(card.view)}
          >
            <div className={styles.cardIcon}>{card.icon}</div>
            <h3 className={styles.cardTitle}>{card.title}</h3>
            <p className={styles.cardText}>{card.text}</p>
          </button>
        ))}
      </div>
      <div className={styles.status}>
        <div className={styles.statusBadge}>
          <span className={styles.statusDot}></span>
          <span className={styles.statusText}>
            {lang === 'pl' ? 'System działa poprawnie' : 'System operational'}
          </span>
        </div>
      </div>
    </>
  );
}
