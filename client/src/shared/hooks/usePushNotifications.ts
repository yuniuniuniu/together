import { useEffect, useCallback, useState } from 'react';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { Platform } from '@/shared/utils/platform';

export interface PushNotificationState {
  token: string | null;
  notification: PushNotificationSchema | null;
  error: string | null;
}

/**
 * Cross-platform push notifications hook.
 * Uses native Capacitor Push Notifications on Android, falls back to web Notification API.
 */
export function usePushNotifications(
  onNotificationReceived?: (notification: PushNotificationSchema) => void,
  onNotificationAction?: (action: ActionPerformed) => void
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
      // Check current permission status
      let permStatus = await PushNotifications.checkPermissions();

      if (permStatus.receive === 'prompt') {
        permStatus = await PushNotifications.requestPermissions();
      }

      if (permStatus.receive !== 'granted') {
        setState(prev => ({ ...prev, error: 'Push notification permission denied' }));
        return null;
      }

      // Register for push notifications
      await PushNotifications.register();

      return new Promise((resolve) => {
        // Listen for registration success
        PushNotifications.addListener('registration', (token: Token) => {
          setState(prev => ({ ...prev, token: token.value, error: null }));
          resolve(token.value);
        });

        // Listen for registration errors
        PushNotifications.addListener('registrationError', (error) => {
          setState(prev => ({ ...prev, error: error.error }));
          resolve(null);
        });
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to register';
      setState(prev => ({ ...prev, error: message }));
      return null;
    }
  }, []);

  // Set up notification listeners on native platforms
  useEffect(() => {
    if (!Platform.isNative()) return;

    // Notification received while app is in foreground
    const receivedListener = PushNotifications.addListener(
      'pushNotificationReceived',
      (notification: PushNotificationSchema) => {
        setState(prev => ({ ...prev, notification }));
        onNotificationReceived?.(notification);
      }
    );

    // User tapped on notification
    const actionListener = PushNotifications.addListener(
      'pushNotificationActionPerformed',
      (action: ActionPerformed) => {
        onNotificationAction?.(action);
      }
    );

    return () => {
      receivedListener.then(l => l.remove());
      actionListener.then(l => l.remove());
    };
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

    // On native, use local notifications (requires @capacitor/local-notifications)
    // For now, just log - this is mainly handled by FCM
    console.log('Local notification:', title, body);
  }, []);

  return {
    token: state.token,
    notification: state.notification,
    error: state.error,
    register,
    showLocalNotification
  };
}
