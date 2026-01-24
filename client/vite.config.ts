import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Enable HTTPS for microphone access on mobile devices
    // Run with: HTTPS=true npm run dev
    // You'll see a browser security warning, click "Advanced" -> "Proceed"
    const useHttps = process.env.HTTPS === 'true';
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
        allowedHosts: ['together1024.top', 'www.together1024.top'],
        ...(useHttps && { https: {} }),
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      }
    };
});
