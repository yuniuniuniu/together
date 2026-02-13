import { useEffect, useCallback, useState } from 'react';
import { Platform } from '@/shared/utils/platform';
import type { PluginListenerHandle } from '@capacitor/core';

// Import types from capacitor-plugin-jpush
interface ReceiveNotificationData {
  title: string;
  content: string;
  subTitle: string;
  rawData: {
    aps?: {
      alert: {
        body: string;
        subTitle: string;
        title: string;
      };
      badge: number;
      sound: string;
    };
    [x: string]: unknown;
  };
}

interface JPushPluginType {
  startJPush(): Promise<void>;
  setDebugMode(isDebug: boolean): Promise<void>;
  getRegistrationID(): Promise<{ registrationId: string }>;
  checkPermissions(): Promise<{ permission: string }>;
  requestPermissions(): Promise<{ permission: string }>;
  setBadgeNumber(options?: { badge: number }): Promise<void>;
  addListener(
    eventName: 'notificationReceived',
    listenerFunc: (data: ReceiveNotificationData) => void
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'notificationOpened',
    listenerFunc: (data: ReceiveNotificationData) => void
  ): Promise<PluginListenerHandle>;
  removeListeners(): Promise<void>;
}

// Will be imported dynamically
let JPush: JPushPluginType | null = null;

export interface PushNotificationState {
  token: string | null;
  notification: ReceiveNotificationData | null;
  error: string | null;
}

/**
 * Cross-platform push notifications hook using JPush.
 */
export function usePushNotifications(
  onNotificationReceived?: (notification: ReceiveNotificationData) => void,
  onNotificationAction?: (notification: ReceiveNotificationData) => void
) {
  const [state, setState] = useState<PushNotificationState>({
    token: null,
    notification: null,
    error: null
  });

  /**
   * Request push notification permissions and register
   */
  const register = useCallback(async (): Promise<string | null> => {
    if (!Platform.isNative()) {
      // Web fallback - use Notification API
      if (!('Notification' in window)) {
        setState(prev => ({ ...prev, error: 'Notifications not supported' }));
        return null;
      }

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(prev => ({ ...prev, error: 'Notification permission denied' }));
        return null;
      }

      return 'web-notifications-enabled';
    }

    try {
      // Dynamically import JPush plugin
      if (!JPush) {
        const module = await import('capacitor-plugin-jpush');
        JPush = module.JPush;
      }

      // Enable debug mode in development
      await JPush.setDebugMode(import.meta.env.DEV);

      // Start JPush service
      await JPush.startJPush();
      console.log('[JPush] Service started');

      // Request permissions
      const permStatus = await JPush.requestPermissions();
      console.log('[JPush] Permission status:', permStatus.permission);

      if (permStatus.permission !== 'granted') {
        setState(prev => ({ ...prev, error: 'Push notification permission denied' }));
        return null;
      }

      // Get registration ID (may need to wait)
      const getRegId = async (): Promise<string | null> => {
        const result = await JPush!.getRegistrationID();
        if (result.registrationId) {
          return result.registrationId;
        }
        return null;
      };

      let regId = await getRegId();

      if (regId) {
        console.log('[JPush] Registration ID:', regId);
        setState(prev => ({ ...prev, token: regId, error: null }));
        return regId;
      }

      // If no registration ID yet, poll for it
      return new Promise((resolve) => {
        let attempts = 0;
        const maxAttempts = 15;

        const checkInterval = setInterval(async () => {
          attempts++;
          try {
            regId = await getRegId();
            if (regId) {
              clearInterval(checkInterval);
              console.log('[JPush] Registration ID (delayed):', regId);
              setState(prev => ({ ...prev, token: regId, error: null }));
              resolve(regId);
            } else if (attempts >= maxAttempts) {
              clearInterval(checkInterval);
              setState(prev => ({ ...prev, error: 'Registration timeout' }));
              resolve(null);
            }
          } catch (e) {
            console.error('[JPush] Error getting registration ID:', e);
          }
        }, 1000);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register';
      console.error('[JPush] Registration error:', message);
      setState(prev => ({ ...prev, error: message }));
      return null;
    }
  }, []);

  // Set up notification listeners on native platforms
  useEffect(() => {
    if (!Platform.isNative()) return;

    let receivedListener: PluginListenerHandle | null = null;
    let openedListener: PluginListenerHandle | null = null;

    const setupListeners = async () => {
      if (!JPush) {
        try {
          const module = await import('capacitor-plugin-jpush');
          JPush = module.JPush;
        } catch {
          return;
        }
      }

      // Notification received while app is in foreground
      receivedListener = await JPush.addListener('notificationReceived', (data) => {
        console.log('[JPush] Notification received:', data);
        setState(prev => ({ ...prev, notification: data }));
        onNotificationReceived?.(data);
      });

      // User tapped on notification
      openedListener = await JPush.addListener('notificationOpened', (data) => {
        console.log('[JPush] Notification opened:', data);
        onNotificationAction?.(data);
      });
    };

    setupListeners();

    return () => {
      receivedListener?.remove();
      openedListener?.remove();
    };
  }, [onNotificationReceived, onNotificationAction]);

  /**
   * Show a local notification (for testing or immediate feedback)
   */
  const showLocalNotification = useCallback(async (title: string, body: string) => {
    if (!Platform.isNative()) {
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }
    console.log('Local notification:', title, body);
  }, []);

  /**
   * Set badge number
   */
  const setBadge = useCallback(async (count: number) => {
    if (!Platform.isNative() || !JPush) return;
    try {
      await JPush.setBadgeNumber({ badge: count });
    } catch (e) {
      console.error('[JPush] Failed to set badge:', e);
    }
  }, []);

  /**
   * Clear badge
   */
  const clearBadge = useCallback(async () => {
    await setBadge(0);
  }, [setBadge]);

  return {
    token: state.token,
    notification: state.notification,
    error: state.error,
    register,
    showLocalNotification,
    setBadge,
    clearBadge
  };
}
