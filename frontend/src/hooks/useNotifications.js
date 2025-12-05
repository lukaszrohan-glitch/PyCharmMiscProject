/**
 * WebSocket Notification System
 * Provides real-time notifications for orders, inventory, and system events
 */
import { useState, useEffect, useCallback, useRef } from 'react';

const WS_RECONNECT_DELAY = 3000;
const WS_MAX_RECONNECT_ATTEMPTS = 5;

/**
 * WebSocket connection hook
 */
export function useWebSocket(url, options = {}) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState(null);
  const [error, setError] = useState(null);
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimeoutRef = useRef(null);

  const {
    onMessage,
    onConnect,
    onDisconnect,
    onError,
    autoReconnect = true,
    enabled = true
  } = options;

  const connect = useCallback(() => {
    if (!enabled || !url) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        setError(null);
        reconnectAttempts.current = 0;
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setLastMessage(data);
          onMessage?.(data);
        } catch (e) {
          console.warn('WebSocket message parse error:', e);
        }
      };

      ws.onerror = (event) => {
        setError('WebSocket error');
        onError?.(event);
      };

      ws.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();

        // Auto-reconnect logic
        if (autoReconnect && reconnectAttempts.current < WS_MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts.current += 1;
          reconnectTimeoutRef.current = setTimeout(() => {
            connect();
          }, WS_RECONNECT_DELAY * reconnectAttempts.current);
        }
      };
    } catch (e) {
      setError(e.message);
    }
  }, [url, enabled, autoReconnect, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const send = useCallback((data) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
      return true;
    }
    return false;
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    lastMessage,
    error,
    send,
    reconnect: connect,
    disconnect,
  };
}

/**
 * Notification types
 */
export const NotificationType = {
  ORDER_CREATED: 'order_created',
  ORDER_UPDATED: 'order_updated',
  ORDER_DELETED: 'order_deleted',
  ORDER_STATUS_CHANGED: 'order_status_changed',
  ORDER_OVERDUE: 'order_overdue',
  INVENTORY_LOW: 'inventory_low',
  INVENTORY_UPDATED: 'inventory_updated',
  PRODUCTION_STARTED: 'production_started',
  PRODUCTION_COMPLETED: 'production_completed',
  SYSTEM_ALERT: 'system_alert',
  USER_MENTION: 'user_mention',
};

/**
 * Notification store hook (local state + localStorage persistence)
 */
export function useNotifications() {
  const [notifications, setNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('notifications');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [unreadCount, setUnreadCount] = useState(0);

  // Calculate unread count
  useEffect(() => {
    const count = notifications.filter(n => !n.read).length;
    setUnreadCount(count);
  }, [notifications]);

  // Persist to localStorage
  useEffect(() => {
    try {
      // Keep only last 50 notifications
      const toSave = notifications.slice(0, 50);
      localStorage.setItem('notifications', JSON.stringify(toSave));
    } catch (e) {
      console.warn('Failed to save notifications:', e);
    }
  }, [notifications]);

  const addNotification = useCallback((notification) => {
    const newNotification = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      read: false,
      ...notification,
    };

    setNotifications(prev => [newNotification, ...prev]);

    // Browser notification if permitted
    if (Notification.permission === 'granted' && notification.showBrowserNotification !== false) {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/favicon.ico',
        tag: notification.id || newNotification.id,
      });
    }

    return newNotification;
  }, []);

  const markAsRead = useCallback((id) => {
    setNotifications(prev =>
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  const requestPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  return {
    notifications,
    unreadCount,
    addNotification,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    requestPermission,
  };
}

/**
 * Combined hook for WebSocket + Notifications
 */
export function useRealtimeNotifications(wsUrl) {
  const notifications = useNotifications();

  const handleMessage = useCallback((message) => {
    if (message.type && Object.values(NotificationType).includes(message.type)) {
      notifications.addNotification({
        type: message.type,
        title: message.title || formatNotificationTitle(message.type),
        message: message.message || message.description,
        data: message.data,
      });
    }
  }, [notifications]);

  const ws = useWebSocket(wsUrl, {
    onMessage: handleMessage,
    enabled: !!wsUrl,
  });

  return {
    ...notifications,
    isConnected: ws.isConnected,
    wsError: ws.error,
  };
}

// Helper to format notification titles
function formatNotificationTitle(type) {
  const titles = {
    [NotificationType.ORDER_CREATED]: 'Nowe zamówienie',
    [NotificationType.ORDER_UPDATED]: 'Zamówienie zaktualizowane',
    [NotificationType.ORDER_DELETED]: 'Zamówienie usunięte',
    [NotificationType.ORDER_STATUS_CHANGED]: 'Zmiana statusu zamówienia',
    [NotificationType.ORDER_OVERDUE]: 'Zamówienie przeterminowane',
    [NotificationType.INVENTORY_LOW]: 'Niski stan magazynowy',
    [NotificationType.INVENTORY_UPDATED]: 'Magazyn zaktualizowany',
    [NotificationType.PRODUCTION_STARTED]: 'Produkcja rozpoczęta',
    [NotificationType.PRODUCTION_COMPLETED]: 'Produkcja zakończona',
    [NotificationType.SYSTEM_ALERT]: 'Alert systemowy',
    [NotificationType.USER_MENTION]: 'Wspomniano o Tobie',
  };
  return titles[type] || 'Powiadomienie';
}

