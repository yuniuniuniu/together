import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getAnalytics, type Analytics } from 'firebase/analytics';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAuth, type Auth } from 'firebase/auth';
import { getStorage, type FirebaseStorage } from 'firebase/storage';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;
let firestore: Firestore | null = null;
let auth: Auth | null = null;
let storage: FirebaseStorage | null = null;

export function isProduction(): boolean {
  return import.meta.env.VITE_ENV === 'production';
}

export function initializeFirebase(): FirebaseApp | null {
  if (!isProduction()) {
    console.log('[Firebase] Skipping initialization in development mode');
    return null;
  }

  if (getApps().length > 0) {
    app = getApps()[0];
    return app;
  }

  app = initializeApp(firebaseConfig);
  console.log('[Firebase] Initialized successfully');
  return app;
}

export function getFirebaseApp(): FirebaseApp | null {
  if (!app && isProduction()) {
    return initializeFirebase();
  }
  return app;
}

export function getFirebaseAnalytics(): Analytics | null {
  if (!isProduction()) return null;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!analytics) {
    analytics = getAnalytics(firebaseApp);
  }
  return analytics;
}

export function getFirebaseFirestore(): Firestore | null {
  if (!isProduction()) return null;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!firestore) {
    firestore = getFirestore(firebaseApp);
  }
  return firestore;
}

export function getFirebaseAuth(): Auth | null {
  if (!isProduction()) return null;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!auth) {
    auth = getAuth(firebaseApp);
  }
  return auth;
}

export function getFirebaseStorage(): FirebaseStorage | null {
  if (!isProduction()) return null;

  const firebaseApp = getFirebaseApp();
  if (!firebaseApp) return null;

  if (!storage) {
    storage = getStorage(firebaseApp);
  }
  return storage;
}

export { firebaseConfig };
