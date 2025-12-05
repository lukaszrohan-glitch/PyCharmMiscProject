/**
 * Empty state component for when there's no data
 * Usage:
 *   <EmptyState
 *     icon="📦"
 *     title="Brak zamówień"
 *     description="Nie masz jeszcze żadnych zamówień"
 *     action={{ label: "Dodaj zamówienie", onClick: handleAdd }}
 *   />
 */
import styles from './EmptyState.module.css';

// SVG illustrations for common empty states
const illustrations = {
  orders: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
      <rect x="25" y="20" width="70" height="55" rx="6" fill="var(--background-tertiary)" stroke="var(--border-color)" strokeWidth="2"/>
      <rect x="35" y="32" width="35" height="6" rx="3" fill="var(--primary-color)" opacity="0.3"/>
      <rect x="35" y="44" width="50" height="4" rx="2" fill="var(--text-tertiary)"/>
      <rect x="35" y="54" width="40" height="4" rx="2" fill="var(--text-tertiary)"/>
      <circle cx="85" cy="70" r="18" fill="var(--background-secondary)" stroke="var(--primary-color)" strokeWidth="2"/>
      <path d="M85 62v16M77 70h16" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  inventory: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
      <rect x="20" y="35" width="35" height="35" rx="4" fill="var(--background-tertiary)" stroke="var(--border-color)" strokeWidth="2"/>
      <rect x="42" y="25" width="35" height="35" rx="4" fill="var(--background-secondary)" stroke="var(--border-color)" strokeWidth="2"/>
      <rect x="65" y="40" width="35" height="35" rx="4" fill="var(--primary-color)" opacity="0.2" stroke="var(--primary-color)" strokeWidth="2"/>
      <path d="M75 57h15M82.5 49.5v15" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  clients: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
      <circle cx="45" cy="40" r="15" fill="var(--background-tertiary)" stroke="var(--border-color)" strokeWidth="2"/>
      <circle cx="75" cy="40" r="15" fill="var(--primary-color)" opacity="0.2" stroke="var(--primary-color)" strokeWidth="2"/>
      <path d="M25 75c0-11 9-20 20-20h30c11 0 20 9 20 20" stroke="var(--border-color)" strokeWidth="2" fill="none"/>
      <circle cx="90" cy="70" r="12" fill="var(--background-secondary)" stroke="var(--primary-color)" strokeWidth="2"/>
      <path d="M90 64v12M84 70h12" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  ),
  search: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
      <circle cx="50" cy="45" r="25" fill="var(--background-tertiary)" stroke="var(--border-color)" strokeWidth="2"/>
      <path d="M68 63l20 20" stroke="var(--text-tertiary)" strokeWidth="4" strokeLinecap="round"/>
      <path d="M40 45h20M50 35v20" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round" opacity="0.5"/>
    </svg>
  ),
  error: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
      <circle cx="60" cy="50" r="30" fill="var(--error-bg)" stroke="var(--error-color)" strokeWidth="2"/>
      <path d="M60 35v20" stroke="var(--error-color)" strokeWidth="3" strokeLinecap="round"/>
      <circle cx="60" cy="65" r="3" fill="var(--error-color)"/>
    </svg>
  ),
  default: (
    <svg viewBox="0 0 120 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={styles.svg}>
      <rect x="30" y="25" width="60" height="50" rx="8" fill="var(--background-tertiary)" stroke="var(--border-color)" strokeWidth="2"/>
      <circle cx="60" cy="50" r="15" fill="var(--primary-color)" opacity="0.2" stroke="var(--primary-color)" strokeWidth="2"/>
      <path d="M60 42v16M52 50h16" stroke="var(--primary-color)" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  )
};

export default function EmptyState({
  icon,
  illustration = 'default',
  title,
  description,
  action,
  secondaryAction,
  className = '',
  compact = false
}) {
  const Illustration = illustrations[illustration] || illustrations.default;

  return (
    <div className={`${styles.container} ${compact ? styles.compact : ''} ${className}`}>
      <div className={styles.visual}>
        {icon ? (
          <span className={styles.icon} aria-hidden="true">{icon}</span>
        ) : (
          Illustration
        )}
      </div>

      {title && <h3 className={styles.title}>{title}</h3>}

      {description && <p className={styles.description}>{description}</p>}

      {(action || secondaryAction) && (
        <div className={styles.actions}>
          {action && (
            <button
              type="button"
              className={styles.primaryAction}
              onClick={action.onClick}
            >
              {action.icon && <span aria-hidden="true">{action.icon}</span>}
              {action.label}
            </button>
          )}
          {secondaryAction && (
            <button
              type="button"
              className={styles.secondaryAction}
              onClick={secondaryAction.onClick}
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Pre-configured empty states for common scenarios
function EmptyStateOrders({ lang = 'pl', onAdd }) {
  return (
    <EmptyState
      illustration="orders"
      title={lang === 'pl' ? 'Brak zamówień' : 'No orders'}
      description={lang === 'pl'
        ? 'Nie masz jeszcze żadnych zamówień. Zacznij od dodania pierwszego.'
        : 'You don\'t have any orders yet. Start by adding one.'}
      action={onAdd && {
        label: lang === 'pl' ? 'Dodaj zamówienie' : 'Add order',
        icon: '➕',
        onClick: onAdd
      }}
    />
  );
}

function EmptyStateInventory({ lang = 'pl', onAdd }) {
  return (
    <EmptyState
      illustration="inventory"
      title={lang === 'pl' ? 'Pusty magazyn' : 'Empty inventory'}
      description={lang === 'pl'
        ? 'Nie ma jeszcze żadnych transakcji magazynowych.'
        : 'No inventory transactions yet.'}
      action={onAdd && {
        label: lang === 'pl' ? 'Dodaj transakcję' : 'Add transaction',
        icon: '➕',
        onClick: onAdd
      }}
    />
  );
}

function EmptyStateClients({ lang = 'pl', onAdd }) {
  return (
    <EmptyState
      illustration="clients"
      title={lang === 'pl' ? 'Brak klientów' : 'No clients'}
      description={lang === 'pl'
        ? 'Dodaj pierwszego klienta, aby rozpocząć współpracę.'
        : 'Add your first client to get started.'}
      action={onAdd && {
        label: lang === 'pl' ? 'Dodaj klienta' : 'Add client',
        icon: '➕',
        onClick: onAdd
      }}
    />
  );
}

function EmptyStateSearch({ lang = 'pl', query = '' }) {
  return (
    <EmptyState
      illustration="search"
      title={lang === 'pl' ? 'Brak wyników' : 'No results'}
      description={lang === 'pl'
        ? `Nie znaleziono wyników dla "${query}". Spróbuj innych słów kluczowych.`
        : `No results found for "${query}". Try different keywords.`}
      compact
    />
  );
}

function EmptyStateError({ lang = 'pl', onRetry }) {
  return (
    <EmptyState
      illustration="error"
      title={lang === 'pl' ? 'Coś poszło nie tak' : 'Something went wrong'}
      description={lang === 'pl'
        ? 'Wystąpił błąd podczas ładowania danych. Spróbuj ponownie.'
        : 'An error occurred while loading data. Please try again.'}
      action={onRetry && {
        label: lang === 'pl' ? 'Spróbuj ponownie' : 'Try again',
        icon: '🔄',
        onClick: onRetry
      }}
    />
  );
}

EmptyState.Orders = EmptyStateOrders;
EmptyState.Inventory = EmptyStateInventory;
EmptyState.Clients = EmptyStateClients;
EmptyState.Search = EmptyStateSearch;
EmptyState.Error = EmptyStateError;

