import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.together.app',
  appName: 'Together',
  webDir: 'dist',
  server: {
    // Use http scheme for development to allow connecting to local API
    // Change to 'https' for production
    androidScheme: 'http'
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      backgroundColor: '#F6E7D8',
      showSpinner: false
    }
  }
};

export default config;
