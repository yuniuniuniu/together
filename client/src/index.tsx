import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { initializeFirebase, isProduction } from './shared/config/firebase';

// Initialize Firebase in production mode
if (isProduction()) {
  console.log('[App] Production mode - initializing Firebase');
  initializeFirebase();
} else {
  console.log('[App] Development mode - using backend API');
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
