import React, { createContext, useContext, useState, useCallback, useEffect, useRef, useMemo, type ReactNode } from 'react';
import { notificationsApi } from '../api/client';
import { useAuth } from './AuthContext';
import { useSpace } from './SpaceContext';
import { Platform } from '../utils/platform';
import { usePushNotifications } from '../hooks/usePushNotifications';

interface Notification {
  id: string;
  userId: string;
  type: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
  actionUrl?: string;
}

interface NotificationContextValue {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

const POLLING_INTERVAL = 30000; // 30 seconds

interface NotificationProviderProps {
  children: ReactNode;
}

const ENABLE_NATIVE_PUSH = import.meta.env.VITE_ENABLE_NATIVE_PUSH === 'true';

export function NotificationProvider({ children }: NotificationProviderProps) {
  const { isAuthenticated } = useAuth();
  const { refreshSpace } = useSpace();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<number | null>(null);
  const seenIdsRef = useRef<Set<string>>(new Set());
  const pushRegisteredRef = useRef(false);
  const { register: registerPush, token: pushToken, error: pushError } = usePushNotifications();

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      const response = await notificationsApi.list();
      const nextNotifications = response.data || [];
      const hasNewProfileUpdate = nextNotifications.some(
        notification => notification.type === 'profile' && !seenIdsRef.current.has(notification.id)
      );
      setNotifications(nextNotifications);
      setError(null);
      seenIdsRef.current = new Set(nextNotifications.map(notification => notification.id));
      if (hasNewProfileUpdate) {
        refreshSpace().catch(() => undefined);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    }
  }, [isAuthenticated, refreshSpace]);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    await fetchNotifications();
    setIsLoading(false);
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await notificationsApi.markAsRead(id);
      setNotifications(prev =>
        prev.map(n => (n.id === id ? { ...n, read: true } : n))
      );
    } catch {
      // Silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationsApi.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch {
      // Silently fail
    }
  }, []);

  // Register native push notifications once per session.
  // Guarded behind env flag because unconfigured JPush on Android can crash on native register().
  useEffect(() => {
    if (!ENABLE_NATIVE_PUSH || !isAuthenticated || !Platform.isNative() || pushRegisteredRef.current) return;

    pushRegisteredRef.current = true;
    registerPush().catch((err) => {
      const message = err instanceof Error ? err.message : 'Failed to register push notifications';
      console.warn('[Push] registration failed:', message);
    });
  }, [isAuthenticated, registerPush]);

  // Register device token with backend when acquired
  useEffect(() => {
    if (pushToken && isAuthenticated) {
      console.log('[Push] Registering device token with backend');
      notificationsApi
        .registerDeviceToken(pushToken, 'android')
        .then(() => console.log('[Push] Device token registered successfully'))
        .catch((err) => console.error('[Push] Failed to register device token:', err));
    }
  }, [pushToken, isAuthenticated]);

  useEffect(() => {
    if (!pushError) return;
    console.warn('[Push] registration error:', pushError);
  }, [pushError]);

  // Initial fetch and polling setup
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      seenIdsRef.current = new Set();
      return;
    }

    // Initial fetch
    refresh();

    // Set up polling
    intervalRef.current = window.setInterval(fetchNotifications, POLLING_INTERVAL);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAuthenticated, refresh, fetchNotifications]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const value = useMemo<NotificationContextValue>(() => ({
    notifications,
    unreadCount,
    isLoading,
    error,
    refresh,
    markAsRead,
    markAllAsRead,
  }), [notifications, unreadCount, isLoading, error, refresh, markAsRead, markAllAsRead]);

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications(): NotificationContextValue {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}

export { NotificationContext };
