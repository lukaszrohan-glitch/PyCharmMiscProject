/**
 * Notification Center Component
 * Displays notifications in a dropdown panel
 */
import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './NotificationCenter.module.css';

const NOTIFICATION_ICONS = {
  order_created: '📦',
  order_updated: '✏️',
  order_deleted: '🗑️',
  order_status_changed: '🔄',
  order_overdue: '⚠️',
  inventory_low: '📉',
  inventory_updated: '📊',
  production_started: '🏭',
  production_completed: '✅',
  system_alert: '🔔',
  user_mention: '👤',
  default: '📌',
};

function formatTimeAgo(timestamp, lang = 'pl') {
  const now = new Date();
  const date = new Date(timestamp);
  const diffMs = now - date;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return lang === 'pl' ? 'Teraz' : 'Just now';
  if (diffMins < 60) return lang === 'pl' ? `${diffMins} min temu` : `${diffMins}m ago`;
  if (diffHours < 24) return lang === 'pl' ? `${diffHours} godz. temu` : `${diffHours}h ago`;
  if (diffDays < 7) return lang === 'pl' ? `${diffDays} dni temu` : `${diffDays}d ago`;
  return date.toLocaleDateString(lang === 'pl' ? 'pl-PL' : 'en-US');
}

function NotificationItem({ notification, onRead, onRemove, lang }) {
  const icon = NOTIFICATION_ICONS[notification.type] || NOTIFICATION_ICONS.default;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className={`${styles.item} ${notification.read ? styles.read : ''}`}
      onClick={() => onRead(notification.id)}
    >
      <span className={styles.icon} aria-hidden="true">{icon}</span>
      <div className={styles.content}>
        <p className={styles.title}>{notification.title}</p>
        {notification.message && (
          <p className={styles.message}>{notification.message}</p>
        )}
        <span className={styles.time}>{formatTimeAgo(notification.timestamp, lang)}</span>
      </div>
      <button
        type="button"
        className={styles.removeBtn}
        onClick={(e) => {
          e.stopPropagation();
          onRemove(notification.id);
        }}
        aria-label={lang === 'pl' ? 'Usuń powiadomienie' : 'Remove notification'}
      >
        ✕
      </button>
    </motion.div>
  );
}

export default function NotificationCenter({
  notifications = [],
  unreadCount = 0,
  onMarkAsRead,
  onMarkAllAsRead,
  onRemove,
  onClearAll,
  lang = 'pl',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  const t = {
    notifications: lang === 'pl' ? 'Powiadomienia' : 'Notifications',
    markAllRead: lang === 'pl' ? 'Oznacz jako przeczytane' : 'Mark all read',
    clearAll: lang === 'pl' ? 'Wyczyść wszystko' : 'Clear all',
    noNotifications: lang === 'pl' ? 'Brak powiadomień' : 'No notifications',
    noNewNotifications: lang === 'pl' ? 'Brak nowych powiadomień' : 'No new notifications',
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event) {
      if (event.key === 'Escape') setIsOpen(false);
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  return (
    <div className={styles.container} ref={containerRef}>
      <button
        type="button"
        className={styles.trigger}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={`${t.notifications} (${unreadCount})`}
        aria-expanded={isOpen}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.73 21a2 2 0 0 1-3.46 0" />
        </svg>
        {unreadCount > 0 && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className={styles.badge}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={styles.dropdown}
          >
            <div className={styles.header}>
              <h3 className={styles.headerTitle}>{t.notifications}</h3>
              {notifications.length > 0 && (
                <div className={styles.headerActions}>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      className={styles.headerBtn}
                      onClick={onMarkAllAsRead}
                    >
                      {t.markAllRead}
                    </button>
                  )}
                  <button
                    type="button"
                    className={styles.headerBtn}
                    onClick={onClearAll}
                  >
                    {t.clearAll}
                  </button>
                </div>
              )}
            </div>

            <div className={styles.list}>
              {notifications.length === 0 ? (
                <div className={styles.empty}>
                  <span className={styles.emptyIcon}>🔔</span>
                  <p>{t.noNotifications}</p>
                </div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map(notification => (
                    <NotificationItem
                      key={notification.id}
                      notification={notification}
                      onRead={onMarkAsRead}
                      onRemove={onRemove}
                      lang={lang}
                    />
                  ))}
                </AnimatePresence>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

