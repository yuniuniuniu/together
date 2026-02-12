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
  },
  // JPush configuration - set your AppKey before running npm install
  // Install with: npm install jpush-phonegap-plugin --variable APP_KEY=your-app-key
  cordova: {
    preferences: {
      // JPush AppKey - replace with your actual key from https://www.jiguang.cn/
      // APP_KEY: 'your-jpush-app-key'
    }
  }
};

export default config;
