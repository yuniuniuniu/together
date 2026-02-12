import React, { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Platform } from '@/shared/utils/platform';
import { useToast } from '@/shared/components/feedback/Toast';

/**
 * Android back button handler component.
 * Must be rendered inside HashRouter to access navigation.
 */
export const AndroidBackHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { showToast } = useToast();
  const lastBackPressRef = useRef<number>(0);

  useEffect(() => {
    if (!Platform.isAndroid()) return;

    const handleBackButton = App.addListener('backButton', () => {
      // Define root screens where back should exit the app
      const rootPaths = ['/', '/dashboard', '/sanctuary'];
      const isRootScreen = rootPaths.includes(location.pathname);

      if (isRootScreen) {
        const now = Date.now();
        const shouldExit = now - lastBackPressRef.current < 2000;
        if (shouldExit) {
          App.exitApp();
          return;
        }
        lastBackPressRef.current = now;
        showToast('Press back again to exit', 'info', 1500);
      } else {
        // Navigate back in history
        navigate(-1);
      }
    });

    return () => {
      handleBackButton.then((listener) => listener.remove());
    };
  }, [navigate, location.pathname, showToast]);

  return null;
};

export default AndroidBackHandler;
