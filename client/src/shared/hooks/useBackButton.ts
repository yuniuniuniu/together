import { useEffect } from 'react';
import { App } from '@capacitor/app';
import { useNavigate, useLocation } from 'react-router-dom';
import { Platform } from '@/shared/utils/platform';

/**
 * Android back button handler hook.
 * Handles back navigation on Android, allowing app to exit from root screens.
 */
export function useBackButton() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Platform.isAndroid()) return;

    const handleBackButton = App.addListener('backButton', ({ canGoBack }) => {
      // Define root screens where back should exit the app
      const rootPaths = ['/', '/dashboard', '/sanctuary'];
      const isRootScreen = rootPaths.includes(location.pathname);

      if (isRootScreen) {
        // Exit app on root screens
        App.exitApp();
      } else if (canGoBack) {
        // Navigate back in history
        navigate(-1);
      } else {
        // Fallback: go to dashboard
        navigate('/dashboard');
      }
    });

    return () => {
      handleBackButton.remove();
    };
  }, [navigate, location.pathname]);
}

/**
 * Hook to listen for app state changes (foreground/background)
 */
export function useAppState(onForeground?: () => void, onBackground?: () => void) {
  useEffect(() => {
    if (!Platform.isNative()) return;

    const listener = App.addListener('appStateChange', ({ isActive }) => {
      if (isActive) {
        onForeground?.();
      } else {
        onBackground?.();
      }
    });

    return () => {
      listener.remove();
    };
  }, [onForeground, onBackground]);
}
