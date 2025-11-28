import { useState, useEffect } from 'react';
import * as api from '../services/api';
import styles from '../App.module.css';
import { useI18n } from '../i18n';

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
)

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
)

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
)

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
)

const IconReports = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="4" height="14" rx="1" />
      <rect x="10" y="9" width="4" height="9" rx="1" />
      <rect x="16" y="6" width="4" height="12" rx="1" fill="var(--brand-accent)" stroke="currentColor" strokeWidth="1" />
      <path d="M4 20h16" strokeWidth="2" />
    </g>
  </svg>
)

const IconFinance = () => (
  <svg viewBox="0 0 24 24" width="48" height="48" aria-hidden="true">
    <g fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="5" width="16" height="14" rx="3" />
      <path d="M4 10h16" />
      <circle cx="9" cy="13" r="1.8" fill="var(--brand-accent)" stroke="currentColor" strokeWidth="1" />
      <path d="M13 13h4" strokeWidth="1.5" />
    </g>
  </svg>
)

export default function Dashboard({ lang, setCurrentView }) {
  const { t } = useI18n();
  const [stats, setStats] = useState({
    ordersTotal: 0,
    ordersNew: 0,
    clientsTotal: 0,
    inventoryItems: 0,
    lowStockCount: 0
  });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load statistics
        const [orders, clients, inventory] = await Promise.all([
          api.getOrders(),
          api.getCustomers(),
          api.getInventory()
        ]);

        const newOrders = orders.filter(o => o.status === 'New').length;

        const lowStock = inventory.filter(item =>
          item.balance !== null && item.balance < 10
        ).length;

        setStats({
          ordersTotal: orders.length,
          ordersNew: newOrders,
          clientsTotal: clients.length,
          inventoryItems: inventory.length,
          lowStockCount: lowStock
        });

        // Get recent 5 orders
        setRecentOrders(orders.slice(0, 5));
      } catch (err) {
        console.error('Dashboard data load failed:', err);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  const statCards = [
    {
      label: t?.dashboard?.totalOrders || (lang === 'pl' ? 'Zamówienia' : 'Total Orders'),
      value: stats.ordersTotal,
      subtext: `${stats.ordersNew} ${lang === 'pl' ? 'nowych' : 'new'}`,
      color: '#0891b2'
    },
    {
      label: t?.dashboard?.clients || (lang === 'pl' ? 'Klienci' : 'Clients'),
      value: stats.clientsTotal,
      color: '#8b5cf6'
    },
    {
      label: t?.dashboard?.inventory || (lang === 'pl' ? 'Produkty' : 'Inventory'),
      value: stats.inventoryItems,
      subtext: stats.lowStockCount > 0
        ? `${stats.lowStockCount} ${lang === 'pl' ? 'niski stan' : 'low stock'}`
        : null,
      color: stats.lowStockCount > 0 ? '#ef4444' : '#10b981'
    }
  ];

  const cards = [
    { view: 'orders', icon: <IconOrders />, title: lang === 'pl' ? 'Zamówienia' : 'Orders' },
    { view: 'products', icon: <IconWarehouse />, title: lang === 'pl' ? 'Produkty' : 'Products' },
    { view: 'clients', icon: <IconClients />, title: lang === 'pl' ? 'Klienci' : 'Clients' },
    { view: 'inventory', icon: <IconWarehouse />, title: lang === 'pl' ? 'Magazyn' : 'Inventory' },
    { view: 'timesheets', icon: <IconTimesheets />, title: lang === 'pl' ? 'Czas pracy' : 'Timesheets' },
    { view: 'reports', icon: <IconReports />, title: lang === 'pl' ? 'Raporty' : 'Reports' },
    { view: 'financials', icon: <IconFinance />, title: lang === 'pl' ? 'Finanse' : 'Financials' }
  ];

  return (
    <>
      {/* Statistics Row */}
      {!loading && (
        <div className={styles.statsRow}>
          {statCards.map((stat, idx) => (
            <div key={idx} className={styles.statCard}>
              <div className={styles.statValue} style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className={styles.statLabel}>{stat.label}</div>
              {stat.subtext && (
                <div className={styles.statSubtext}>{stat.subtext}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Recent Activity */}
      {!loading && recentOrders.length > 0 && (
        <div className={styles.recentActivity}>
          <h3 className={styles.sectionTitle}>
            {lang === 'pl' ? 'Ostatnie zamówienia' : 'Recent Orders'}
          </h3>
          <div className={styles.activityList}>
            {recentOrders.map(order => (
              <button
                key={order.order_id}
                type="button"
                className={styles.activityItem}
                onClick={() => setCurrentView('orders')}
              >
                <div className={styles.activityInfo}>
                  <span className={styles.activityTitle}>{order.order_id}</span>
                  <span className={styles.activityMeta}>
                    {order.customer_id} • {order.status}
                  </span>
                </div>
                <span className={styles.activityDate}>
                  {order.due_date || order.created_at}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Actions */}
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
          </button>
        ))}
      </div>
    </>
  );
}
