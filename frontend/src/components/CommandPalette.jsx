import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import styles from './CommandPalette.module.css';

const commands = [
  // Navigation
  { id: 'nav-dashboard', label: 'Przejdź do Dashboard', labelEn: 'Go to Dashboard', category: 'Nawigacja', path: '/dashboard', icon: '🏠' },
  { id: 'nav-orders', label: 'Przejdź do Zamówień', labelEn: 'Go to Orders', category: 'Nawigacja', path: '/orders', icon: '📦' },
  { id: 'nav-products', label: 'Przejdź do Produktów', labelEn: 'Go to Products', category: 'Nawigacja', path: '/products', icon: '🏷️' },
  { id: 'nav-production', label: 'Przejdź do Produkcji', labelEn: 'Go to Production', category: 'Nawigacja', path: '/production', icon: '🏭' },
  { id: 'nav-inventory', label: 'Przejdź do Magazynu', labelEn: 'Go to Inventory', category: 'Nawigacja', path: '/inventory', icon: '📋' },
  { id: 'nav-clients', label: 'Przejdź do Klientów', labelEn: 'Go to Clients', category: 'Nawigacja', path: '/clients', icon: '👥' },
  { id: 'nav-timesheets', label: 'Przejdź do Czasu pracy', labelEn: 'Go to Timesheets', category: 'Nawigacja', path: '/timesheets', icon: '⏱️' },
  { id: 'nav-reports', label: 'Przejdź do Raportów', labelEn: 'Go to Reports', category: 'Nawigacja', path: '/reports', icon: '📊' },
  { id: 'nav-demand', label: 'Przejdź do Popytu', labelEn: 'Go to Demand Planner', category: 'Nawigacja', path: '/demand', icon: '📈' },
  { id: 'nav-financials', label: 'Przejdź do Finansów', labelEn: 'Go to Financials', category: 'Nawigacja', path: '/financials', icon: '💰' },
  { id: 'nav-admin', label: 'Przejdź do Administracji', labelEn: 'Go to Admin', category: 'Nawigacja', path: '/admin', icon: '⚙️' },
  { id: 'nav-help', label: 'Przejdź do Pomocy', labelEn: 'Go to Help', category: 'Nawigacja', path: '/help', icon: '❓' },

  // Actions
  { id: 'action-new-order', label: 'Nowe zamówienie', labelEn: 'New Order', category: 'Akcje', action: 'newOrder', icon: '➕' },
  { id: 'action-new-product', label: 'Nowy produkt', labelEn: 'New Product', category: 'Akcje', action: 'newProduct', icon: '➕' },
  { id: 'action-new-client', label: 'Nowy klient', labelEn: 'New Client', category: 'Akcje', action: 'newClient', icon: '➕' },
  { id: 'action-export-orders', label: 'Eksportuj zamówienia', labelEn: 'Export Orders', category: 'Akcje', action: 'exportOrders', icon: '📤' },
  { id: 'action-export-inventory', label: 'Eksportuj magazyn', labelEn: 'Export Inventory', category: 'Akcje', action: 'exportInventory', icon: '📤' },

  // Settings
  { id: 'settings-theme', label: 'Przełącz tryb ciemny', labelEn: 'Toggle Dark Mode', category: 'Ustawienia', action: 'toggleTheme', icon: '🌙' },
  { id: 'settings-lang-pl', label: 'Zmień język na Polski', labelEn: 'Switch to Polish', category: 'Ustawienia', action: 'langPL', icon: '🇵🇱' },
  { id: 'settings-lang-en', label: 'Zmień język na Angielski', labelEn: 'Switch to English', category: 'Ustawienia', action: 'langEN', icon: '🇬🇧' },
  { id: 'settings-open', label: 'Otwórz ustawienia', labelEn: 'Open Settings', category: 'Ustawienia', action: 'openSettings', icon: '⚙️' },
];

export default function CommandPalette({ isOpen, onClose, lang, onAction }) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const navigate = useNavigate();

  const filteredCommands = commands.filter(cmd => {
    const label = lang === 'pl' ? cmd.label : cmd.labelEn;
    const searchText = `${label} ${cmd.category}`.toLowerCase();
    return searchText.includes(query.toLowerCase());
  });

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {});

  const flatCommands = Object.values(groupedCommands).flat();

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    const selectedEl = listRef.current?.querySelector(`[data-index="${selectedIndex}"]`);
    selectedEl?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const executeCommand = useCallback((cmd) => {
    if (cmd.path) {
      navigate(cmd.path);
    } else if (cmd.action) {
      onAction?.(cmd.action);
    }
    onClose();
  }, [navigate, onAction, onClose]);

  const handleKeyDown = useCallback((e) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(i => Math.min(i + 1, flatCommands.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(i => Math.max(i - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (flatCommands[selectedIndex]) {
          executeCommand(flatCommands[selectedIndex]);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
      default:
        break;
    }
  }, [flatCommands, selectedIndex, executeCommand, onClose]);

  if (!isOpen) return null;

  let itemIndex = -1;

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions
    <div
      className={styles.overlay}
      onClick={onClose}
      onKeyDown={(e) => e.key === 'Escape' && onClose()}
    >
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/click-events-have-key-events */}
      <div
        className={styles.palette}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
      >
        <div className={styles.inputWrapper}>
          <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor" width="20" height="20">
            <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
          </svg>
          <input
            ref={inputRef}
            type="text"
            className={styles.input}
            placeholder={lang === 'pl' ? 'Wpisz polecenie...' : 'Type a command...'}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <kbd className={styles.escHint}>ESC</kbd>
        </div>

        <div className={styles.results} ref={listRef}>
          {flatCommands.length === 0 ? (
            <div className={styles.empty}>
              {lang === 'pl' ? 'Brak wyników' : 'No results'}
            </div>
          ) : (
            Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className={styles.group}>
                <div className={styles.groupLabel}>{category}</div>
                {cmds.map(cmd => {
                  itemIndex++;
                  const currentIndex = itemIndex;
                  return (
                    <button
                      key={cmd.id}
                      data-index={currentIndex}
                      className={`${styles.item} ${currentIndex === selectedIndex ? styles.itemSelected : ''}`}
                      onClick={() => executeCommand(cmd)}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                    >
                      <span className={styles.itemIcon}>{cmd.icon}</span>
                      <span className={styles.itemLabel}>{lang === 'pl' ? cmd.label : cmd.labelEn}</span>
                      {cmd.path && <span className={styles.itemPath}>{cmd.path}</span>}
                    </button>
                  );
                })}
              </div>
            ))
          )}
        </div>

        <div className={styles.footer}>
          <span><kbd>↑↓</kbd> {lang === 'pl' ? 'nawiguj' : 'navigate'}</span>
          <span><kbd>↵</kbd> {lang === 'pl' ? 'wybierz' : 'select'}</span>
          <span><kbd>esc</kbd> {lang === 'pl' ? 'zamknij' : 'close'}</span>
        </div>
      </div>
    </div>
  );
}

