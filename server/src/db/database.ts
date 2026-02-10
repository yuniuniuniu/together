import { DatabaseAdapter } from './adapter.js';
import { sqliteAdapter } from './sqlite-adapter.js';

let adapter: DatabaseAdapter | null = null;

export function getDatabase(): DatabaseAdapter {
  if (!adapter) {
    console.log('[Database] Using SQLite adapter');
    adapter = sqliteAdapter;
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
