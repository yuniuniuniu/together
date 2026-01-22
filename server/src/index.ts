import 'dotenv/config';
import app from './app.js';
import { initializeDatabase } from './db/index.js';
import { initializeFirebaseAdmin, isProduction } from './config/firebase-admin.js';
import { startReminderChecker } from './services/reminderService.js';

const PORT = process.env.PORT || 3005;

async function main() {
  console.log(`[Server] Starting in ${process.env.NODE_ENV || 'development'} mode`);

  if (isProduction()) {
    // Production mode: Initialize Firebase Admin SDK
    console.log('[Server] Initializing Firebase Admin SDK...');
    initializeFirebaseAdmin();
  } else {
    // Development mode: Initialize SQLite database
    console.log('[Server] Initializing SQLite database...');
    await initializeDatabase();
  }

  app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] Database: ${isProduction() ? 'Firebase Firestore' : 'SQLite'}`);

    // Start reminder checker for anniversary and milestone notifications
    startReminderChecker();
  });
}

main().catch(console.error);
