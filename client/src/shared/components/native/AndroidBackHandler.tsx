import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Platform } from '@/shared/utils/platform';

/**
 * Android back button handler component.
 * Must be rendered inside HashRouter to access navigation.
 */
export const AndroidBackHandler: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!Platform.isAndroid()) return;

    const handleBackButton = App.addListener('backButton', () => {
      // Define root screens where back should exit the app
      const rootPaths = ['/', '/dashboard', '/sanctuary'];
      const isRootScreen = rootPaths.includes(location.pathname);

      if (isRootScreen) {
        // Exit app on root screens
        App.exitApp();
      } else {
        // Navigate back in history
        navigate(-1);
      }
    });

    return () => {
      handleBackButton.remove();
    };
  }, [navigate, location.pathname]);

  return null;
};

export default AndroidBackHandler;
