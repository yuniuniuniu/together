import { DatabaseAdapter, isProduction } from './adapter.js';
import { sqliteAdapter } from './sqlite-adapter.js';
import { firestoreAdapter } from './firestore-adapter.js';

let adapter: DatabaseAdapter | null = null;

export function getDatabase(): DatabaseAdapter {
  if (!adapter) {
    if (isProduction()) {
      console.log('[Database] Using Firestore adapter (production mode)');
      adapter = firestoreAdapter;
    } else {
      console.log('[Database] Using SQLite adapter (development mode)');
      adapter = sqliteAdapter;
    }
  }
  return adapter;
}

// Re-export for convenience
export * from './adapter.js';

// Export the db instance
export const db = {
  get adapter(): DatabaseAdapter {
    return getDatabase();
  },
};
