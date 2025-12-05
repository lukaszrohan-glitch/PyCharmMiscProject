const cx = (...classes) => classes.filter(Boolean).join(' ')

import styles from './MobileNav.module.css'

const NAV_LINKS = [
  { id: 'dashboard', icon: '🏠', key: 'home' },
  { id: 'orders', icon: '📦', key: 'orders' },
  { id: 'production', icon: '⚙️', key: 'production' },
  { id: 'inventory', icon: '🎯', key: 'inventory' },
  { id: 'demand', icon: '📈', key: 'demand' },
  { id: 'financials', icon: '💰', key: 'financials' },
]

const TEXT = {
  pl: {
    home: 'Panel',
    orders: 'Zamówienia',
    production: 'Produkcja',
    inventory: 'Magazyn',
    demand: 'Popyt',
    financials: 'Finanse',
    settings: 'Ustawienia',
  },
  en: {
    home: 'Home',
    orders: 'Orders',
    production: 'Production',
    inventory: 'Inventory',
    demand: 'Demand',
    financials: 'Finance',
    settings: 'Settings',
  },
}

export default function MobileNav({ lang = 'pl', currentView, onNavigate, onSettings }) {
  const labels = TEXT[lang] || TEXT.pl

  return (
    <nav className={styles.nav} aria-label={lang === 'pl' ? 'Dolna nawigacja' : 'Bottom navigation'}>
      <div className={styles.navGrid}>
        {NAV_LINKS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={cx(styles.navBtn, currentView === item.id && styles.active)}
            onClick={() => onNavigate?.(item.id)}
            aria-current={currentView === item.id ? 'page' : undefined}
          >
            <span className={styles.icon} aria-hidden="true">{item.icon}</span>
            <span className={styles.label}>{labels[item.key]}</span>
          </button>
        ))}
        <button
          type="button"
          className={styles.navBtn}
          onClick={onSettings}
        >
          <span className={styles.icon} aria-hidden="true">⚙️</span>
          <span className={styles.label}>{labels.settings}</span>
        </button>
      </div>
    </nav>
  )
}
