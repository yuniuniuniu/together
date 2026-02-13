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
    },
    JPush: {
      // JPush AppKey from https://www.jiguang.cn/
      appKey: '6f8e22f75ffb083bf9e141aa',
      channel: 'developer-default'
    }
  }
};

export default config;
