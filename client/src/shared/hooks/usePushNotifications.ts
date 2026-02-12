import { useEffect, useCallback, useState } from 'react';
import { Platform } from '@/shared/utils/platform';

// JPush Capacitor plugin types
interface JPushRegistration {
  registrationId: string;
}

interface JPushNotification {
  title?: string;
  content?: string;
  extras?: Record<string, unknown>;
}

// Declare JPush plugin (will be available after installing jpush-phonegap-plugin)
declare const JPush: {
  init(): void;
  setDebugMode(enable: boolean): void;
  getRegistrationID(callback: (result: JPushRegistration) => void): void;
  addConnectEventListener(callback: (result: { isConnected: boolean }) => void): void;
  addNotificationListener(callback: (notification: JPushNotification) => void): void;
  addCustomMessageListener(callback: (message: JPushNotification) => void): void;
  addOpenNotificationListener(callback: (notification: JPushNotification) => void): void;
  requestPermission(): void;
  setBadge(badge: number): void;
  resetBadge(): void;
};

export interface PushNotificationState {
  token: string | null;
  notification: JPushNotification | null;
  error: string | null;
}

/**
 * Cross-platform push notifications hook using JPush.
 * Uses native JPush SDK on Android/iOS, falls back to web Notification API.
 */
export function usePushNotifications(
  onNotificationReceived?: (notification: JPushNotification) => void,
  onNotificationAction?: (notification: JPushNotification) => void
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

      // No token for web notifications
      return 'web-notifications-enabled';
    }

    try {
      // Check if JPush is available
      if (typeof JPush === 'undefined') {
        setState(prev => ({ ...prev, error: 'JPush plugin not available' }));
        return null;
      }

      // Initialize JPush
      JPush.init();
      JPush.setDebugMode(process.env.NODE_ENV !== 'production');

      // Request permission (important for iOS)
      JPush.requestPermission();

      // Get registration ID
      return new Promise((resolve) => {
        // Try to get registration ID immediately
        JPush.getRegistrationID((result) => {
          if (result.registrationId) {
            setState(prev => ({ ...prev, token: result.registrationId, error: null }));
            resolve(result.registrationId);
          } else {
            // Wait for connection and retry
            JPush.addConnectEventListener((connectResult) => {
              if (connectResult.isConnected) {
                JPush.getRegistrationID((retryResult) => {
                  if (retryResult.registrationId) {
                    setState(prev => ({ ...prev, token: retryResult.registrationId, error: null }));
                    resolve(retryResult.registrationId);
                  } else {
                    setState(prev => ({ ...prev, error: 'Failed to get registration ID' }));
                    resolve(null);
                  }
                });
              }
            });
          }
        });

        // Timeout after 10 seconds
        setTimeout(() => {
          if (!state.token) {
            setState(prev => ({ ...prev, error: 'Registration timeout' }));
            resolve(null);
          }
        }, 10000);
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register';
      setState(prev => ({ ...prev, error: message }));
      return null;
    }
  }, [state.token]);

  // Set up notification listeners on native platforms
  useEffect(() => {
    if (!Platform.isNative() || typeof JPush === 'undefined') return;

    // Notification received while app is in foreground
    JPush.addNotificationListener((notification) => {
      setState(prev => ({ ...prev, notification }));
      onNotificationReceived?.(notification);
    });

    // User tapped on notification (app opened from notification)
    JPush.addOpenNotificationListener((notification) => {
      onNotificationAction?.(notification);
    });

    // Custom message listener (for silent push)
    JPush.addCustomMessageListener((message) => {
      console.log('[JPush] Custom message received:', message);
    });

  }, [onNotificationReceived, onNotificationAction]);

  /**
   * Show a local notification (for testing or immediate feedback)
   */
  const showLocalNotification = useCallback(async (title: string, body: string) => {
    if (!Platform.isNative()) {
      // Web notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification(title, { body });
      }
      return;
    }

    // On native with JPush, local notifications are handled differently
    // JPush primarily handles remote push, local notifications need separate plugin
    console.log('Local notification:', title, body);
  }, []);

  /**
   * Reset badge count
   */
  const resetBadge = useCallback(() => {
    if (Platform.isNative() && typeof JPush !== 'undefined') {
      JPush.resetBadge();
    }
  }, []);

  /**
   * Set badge count
   */
  const setBadge = useCallback((count: number) => {
    if (Platform.isNative() && typeof JPush !== 'undefined') {
      JPush.setBadge(count);
    }
  }, []);

  return {
    token: state.token,
    notification: state.notification,
    error: state.error,
    register,
    showLocalNotification,
    resetBadge,
    setBadge
  };
}
