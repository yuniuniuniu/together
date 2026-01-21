import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let firebaseApp: admin.app.App | null = null;
let firestore: admin.firestore.Firestore | null = null;

export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

export function initializeFirebaseAdmin(): admin.app.App | null {
  if (!isProduction()) {
    console.log('[Firebase Admin] Skipping initialization in development mode');
    return null;
  }

  if (admin.apps.length > 0) {
    firebaseApp = admin.apps[0];
    return firebaseApp;
  }

  const keyPath = process.env.FIREBASE_ADMIN_KEY_PATH || './config/firebase-admin-key.json';
  const absoluteKeyPath = join(__dirname, '../../..', keyPath);

  if (!existsSync(absoluteKeyPath)) {
    console.error(`[Firebase Admin] Service account key not found at: ${absoluteKeyPath}`);
    throw new Error('Firebase Admin SDK key not found. Please check FIREBASE_ADMIN_KEY_PATH');
  }

  const serviceAccount = JSON.parse(readFileSync(absoluteKeyPath, 'utf-8'));

  firebaseApp = admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id,
  });

  console.log('[Firebase Admin] Initialized successfully');
  return firebaseApp;
}

export function getFirebaseAdmin(): admin.app.App | null {
  if (!firebaseApp && isProduction()) {
    return initializeFirebaseAdmin();
  }
  return firebaseApp;
}

export function getFirestoreAdmin(): admin.firestore.Firestore | null {
  if (!isProduction()) return null;

  const app = getFirebaseAdmin();
  if (!app) return null;

  if (!firestore) {
    firestore = admin.firestore();
  }
  return firestore;
}

export { admin };
