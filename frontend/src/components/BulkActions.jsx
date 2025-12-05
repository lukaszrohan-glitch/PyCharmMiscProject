/**
 * Bulk Actions Toolbar - appears when items are selected
 * Usage:
 *   <BulkActions
 *     selectedCount={3}
 *     totalCount={10}
 *     onSelectAll={() => {}}
 *     onClearSelection={() => {}}
 *     actions={[
 *       { id: 'delete', label: 'Usuń', icon: '🗑️', variant: 'danger', onClick: handleDelete },
 *       { id: 'export', label: 'Eksportuj', icon: '📤', onClick: handleExport }
 *     ]}
 *   />
 */
import { useEffect, useRef } from 'react';
import styles from './BulkActions.module.css';

export default function BulkActions({
  selectedCount = 0,
  totalCount = 0,
  onSelectAll,
  onClearSelection,
  actions = [],
  lang = 'pl'
}) {
  const toolbarRef = useRef(null);

  const t = {
    selected: lang === 'pl' ? 'Zaznaczono' : 'Selected',
    of: lang === 'pl' ? 'z' : 'of',
    selectAll: lang === 'pl' ? 'Zaznacz wszystkie' : 'Select all',
    clearSelection: lang === 'pl' ? 'Wyczyść zaznaczenie' : 'Clear selection',
  };

  // Focus trap when toolbar appears
  useEffect(() => {
    if (selectedCount > 0 && toolbarRef.current) {
      const firstButton = toolbarRef.current.querySelector('button');
      firstButton?.focus();
    }
  }, [selectedCount]);

  if (selectedCount === 0) return null;

  const allSelected = selectedCount === totalCount;

  return (
    <div
      className={styles.toolbar}
      ref={toolbarRef}
      role="toolbar"
      aria-label={lang === 'pl' ? 'Akcje zbiorcze' : 'Bulk actions'}
    >
      <div className={styles.info}>
        <span className={styles.count}>
          {t.selected} <strong>{selectedCount}</strong> {t.of} {totalCount}
        </span>

        <div className={styles.selectionActions}>
          {!allSelected && (
            <button
              type="button"
              className={styles.linkButton}
              onClick={onSelectAll}
            >
              {t.selectAll}
            </button>
          )}
          <button
            type="button"
            className={styles.linkButton}
            onClick={onClearSelection}
          >
            {t.clearSelection}
          </button>
        </div>
      </div>

      <div className={styles.actions}>
        {actions.map(action => (
          <button
            key={action.id}
            type="button"
            className={`${styles.actionButton} ${action.variant === 'danger' ? styles.danger : ''}`}
            onClick={action.onClick}
            disabled={action.disabled}
            aria-label={action.label}
          >
            {action.icon && <span className={styles.actionIcon} aria-hidden="true">{action.icon}</span>}
            <span className={styles.actionLabel}>{action.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
