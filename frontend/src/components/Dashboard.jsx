import { useI18n } from '../i18n';
import ProductionHealth from './ProductionHealth';
import RecentActivity from './RecentActivity';
import styles from '../App.module.css';
import { useEffect, useMemo } from 'react';
import { translateError } from '../services/api';
import { useAnalyticsSummary } from '../hooks/useAnalyticsCache';

const IconOrders = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="11" height="4" rx="2" />
      <rect x="4" y="10" width="11" height="4" rx="2" />
      <rect x="4" y="16" width="11" height="4" rx="2" />
      <circle cx="17.5" cy="6" r="1.5" fill="var(--brand-accent)" stroke="currentColor" strokeWidth="1" />
      <circle cx="17.5" cy="12" r="1.5" />
      <circle cx="17.5" cy="18" r="1.5" />
      <path d="M15.5 11.5l1.2 1.6 2.3-3.2" stroke="var(--brand-accent)" strokeWidth="2" />
    </g>
  </svg>
);

const IconClients = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="8" r="2.5" />
      <path d="M4.8 14.2c0-2.2 1.9-3.6 4.2-3.6s4.2 1.4 4.2 3.6" />
      <circle cx="15.5" cy="7.5" r="2.2" stroke="var(--brand-accent)" />
      <path d="M13.3 12.5c0-1.8 1.6-3 3.2-3" stroke="var(--brand-accent)" />
      <circle cx="6" cy="18" r="1.4" fill="var(--brand-accent)" stroke="currentColor" strokeWidth="0.8" />
      <circle cx="12" cy="18" r="1.4" />
      <circle cx="18" cy="18" r="1.4" />
      <path d="M7.3 18h3.4M13.3 18h3.4" strokeWidth="1.5" />
    </g>
  </svg>
);

const IconWarehouse = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3.5 10.5L12 4.5l8.5 6" />
      <path d="M5 10.5v8.5h14v-8.5" />
      <rect x="7" y="12" width="4" height="3" rx="0.8" />
      <rect x="13" y="12" width="4" height="3" rx="0.8" />
      <rect x="10" y="16" width="4" height="3" rx="0.8" fill="var(--brand-accent)" stroke="currentColor" strokeWidth="1" />
    </g>
  </svg>
);

const IconTimesheets = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="3.5" width="10" height="17" rx="2" />
      <line x1="6.5" y1="8" x2="12.5" y2="8" />
      <line x1="6.5" y1="11" x2="12.5" y2="11" />
      <line x1="6.5" y1="14" x2="11" y2="14" />
      <circle cx="17.5" cy="15.5" r="3.5" fill="var(--brand-accent)" stroke="currentColor" strokeWidth="1.2" />
      <path d="M17.5 13.7v1.9l1.4 0.9" stroke="currentColor" strokeWidth="1.2" />
    </g>
  </svg>
);

const IconReports = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="4" height="14" rx="1" />
      <rect x="10" y="9" width="4" height="9" rx="1" />
      <rect x="16" y="6" width="4" height="12" rx="1" fill="var(--brand-accent)" stroke="currentColor" strokeWidth="1" />
      <path d="M4 20h16" strokeWidth="2" />
    </g>
  </svg>
);

const IconFinance = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M4 10h16" />
      <circle cx="9" cy="13" r="1.8" fill="var(--brand-accent)" stroke="currentColor" strokeWidth="1" />
      <path d="M13 13h4" strokeWidth="1.5" />
    </g>
  </svg>
);

export default function Dashboard({ lang, setCurrentView }) {
  const { t } = useI18n();
  const fallback = (key, defaultValue) => {
    const translated = t(key);
    return translated !== key ? translated : defaultValue;
  };

  // Use cached analytics summary to avoid redundant fetches on view changes
  const {
    data: cachedSummary,
    loading: analyticsLoading,
    error: analyticsErr,
    fromCache: _fromCache,
    fetch: fetchAnalytics
  } = useAnalyticsSummary({ ttl: 5 * 60 * 1000 }); // 5 minutes cache

  const defaultSummary = useMemo(() => ({
    total_revenue: 0, total_margin: 0, margin_pct: 0, revenue_yoy_change_pct: 0, top_customer: null
  }), []);
  const summary = cachedSummary || defaultSummary;
  const analyticsError = analyticsErr
    ? (translateError(analyticsErr, lang) || analyticsErr?.message || (lang === 'pl' ? 'Nie udało się pobrać danych analitycznych' : 'Unable to load analytics'))
    : '';

  useEffect(() => {
    fetchAnalytics().catch(() => {/* error already stored in hook */});
  }, [fetchAnalytics]);

  const stats = useMemo(() => ([
    {
      key: 'totalRevenue',
      label: lang === 'pl' ? 'Łączne przychody' : 'Total revenue',
      value: new Intl.NumberFormat(lang === 'pl' ? 'pl-PL' : 'en-US', { style: 'currency', currency: 'PLN' }).format(summary.total_revenue || 0),
      trend: summary.revenue_yoy_change_pct ? `${summary.revenue_yoy_change_pct > 0 ? '+' : ''}${summary.revenue_yoy_change_pct.toFixed(1)}% YoY` : (lang === 'pl' ? 'brak danych' : 'n/a')
    },
    {
      key: 'margin',
      label: lang === 'pl' ? 'Marża brutto' : 'Gross margin',
      value: new Intl.NumberFormat(lang === 'pl' ? 'pl-PL' : 'en-US', { style: 'currency', currency: 'PLN' }).format(summary.total_margin || 0),
      trend: (summary.margin_pct != null && typeof summary.margin_pct === 'number') ? `${summary.margin_pct.toFixed(1)}%` : (lang === 'pl' ? 'brak danych' : 'n/a')
    },
    {
      key: 'topCustomer',
      label: lang === 'pl' ? 'Top klient' : 'Top customer',
      value: summary.top_customer?.name || (lang === 'pl' ? 'Brak danych' : 'No data'),
      trend: summary.top_customer ? `${summary.top_customer.orders_count || 0} ${lang === 'pl' ? 'zleceń' : 'orders'}` : ''
    }
  ]), [summary, lang])

  const navTiles = [
    {
      key: 'orders',
      icon: <IconOrders />,
      title: fallback('dashboard.orders', lang === 'pl' ? 'Zamówienia' : 'Orders')
    },
    {
      key: 'products',
      icon: <IconWarehouse />,
      title: fallback('dashboard.products', lang === 'pl' ? 'Produkty' : 'Products')
    },
    {
      key: 'planning',
      icon: <IconReports />,
      title: fallback('dashboard.planning', lang === 'pl' ? 'Planowanie produkcji' : 'Production Planning')
    },
    {
      key: 'demand',
      icon: <IconFinance />,
      title: fallback('dashboard.demand', lang === 'pl' ? 'Popyt' : 'Demand Planner')
    },
    {
      key: 'clients',
      icon: <IconClients />,
      title: fallback('dashboard.clients', lang === 'pl' ? 'Klienci' : 'Clients')
    },
    {
      key: 'inventory',
      icon: <IconWarehouse />,
      title: fallback('dashboard.inventory', lang === 'pl' ? 'Magazyn' : 'Warehouse')
    },
    {
      key: 'timesheets',
      icon: <IconTimesheets />,
      title: fallback('dashboard.timesheets', lang === 'pl' ? 'Czas pracy' : 'Timesheets')
    },
    {
      key: 'reports',
      icon: <IconReports />,
      title: fallback('dashboard.reports', lang === 'pl' ? 'Raporty' : 'Reports')
    },
    {
      key: 'financials',
      icon: <IconFinance />,
      title: fallback('dashboard.financials', lang === 'pl' ? 'Finanse' : 'Finance')
    }
  ];

  return (
    <div className={styles.dashboardGrid}>
      <section className={styles.statStrip}>
        {analyticsLoading && (
          <article className={styles.statCardMini}>{lang === 'pl' ? 'Ładowanie…' : 'Loading…'}</article>
        )}
        {!analyticsLoading && analyticsError && (
          <article className={styles.statCardMini}>
            <p className={styles.statLabel}>{lang === 'pl' ? 'Błąd danych' : 'Analytics error'}</p>
            <div className={styles.statValueRow}>
              <strong>{analyticsError}</strong>
            </div>
          </article>
        )}
        {!analyticsLoading && !analyticsError && stats.map((stat) => (
          <article key={stat.key} className={styles.statCardMini}>
            <p className={styles.statLabel}>{stat.label}</p>
            <div className={styles.statValueRow}>
              <strong>{stat.value}</strong>
              {stat.trend && <span className={styles.statTrend}>{stat.trend}</span>}
            </div>
          </article>
        ))}
      </section>
      {navTiles.map(tile => (
        <button
          key={tile.key}
          type="button"
          className={styles.navTile}
          onClick={() => setCurrentView(tile.key)}
        >
          <div className={styles.navTileIcon}>
            {tile.icon}
          </div>
          <h3 className={styles.navTileTitle}>{tile.title}</h3>
        </button>
      ))}
      <div className={styles.analyticsSection}>
        <ProductionHealth />
        <RecentActivity />
      </div>
    </div>
  );
}
