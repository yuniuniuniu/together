import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.together.app',
  appName: 'Together',
  webDir: 'dist',
  server: {
    // Use https for production with Cloudflare CDN
    androidScheme: 'https'
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
