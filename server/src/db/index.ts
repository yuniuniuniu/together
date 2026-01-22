import initSqlJs, { type Database } from 'sql.js';
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

let db: Database | null = null;
let dbPath: string | null = null;

export function getDatabase(): Database {
  if (!db) {
    throw new Error('Database not initialized. Call initializeDatabase first.');
  }
  return db;
}

export async function initializeDatabase(path?: string): Promise<Database> {
  const SQL = await initSqlJs();

  dbPath = path || join(__dirname, '../../data/sanctuary.db');

  // Create data directory if needed
  if (dbPath !== ':memory:') {
    const dataDir = dirname(dbPath);
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // Load existing database if it exists
    if (existsSync(dbPath)) {
      const fileBuffer = readFileSync(dbPath);
      db = new SQL.Database(fileBuffer);
    } else {
      db = new SQL.Database();
    }
  } else {
    db = new SQL.Database();
  }

  // Run schema
  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf-8');
  db.run(schema);

  // Run migrations for soft delete
  runMigrations(db);

  return db;
}

function runMigrations(database: Database): void {
  // Add is_deleted column to existing tables if they don't have it
  const tables = [
    'users',
    'verification_codes',
    'sessions',
    'spaces',
    'space_members',
    'memories',
    'milestones',
    'notifications',
    'reactions',
    'unbind_requests',
  ];

  for (const table of tables) {
    try {
      // Check if column exists
      const columns = database.exec(`PRAGMA table_info(${table})`);
      const hasIsDeleted = columns[0]?.values?.some((col) => col[1] === 'is_deleted');

      if (!hasIsDeleted) {
        database.run(`ALTER TABLE ${table} ADD COLUMN is_deleted INTEGER DEFAULT 0`);
      }
    } catch {
      // Column might already exist or table doesn't exist yet
    }
  }
}

export function saveDatabase(): void {
  if (db && dbPath && dbPath !== ':memory:') {
    const data = db.export();
    const buffer = Buffer.from(data);
    writeFileSync(dbPath, buffer);
  }
}

export function closeDatabase(): void {
  if (db) {
    saveDatabase();
    db.close();
    db = null;
    dbPath = null;
  }
}

export function resetDatabase(): void {
  if (!db) return;

  // Drop all tables data
  db.run(`
    DELETE FROM reactions;
    DELETE FROM notifications;
    DELETE FROM milestones;
    DELETE FROM memories;
    DELETE FROM space_members;
    DELETE FROM spaces;
    DELETE FROM sessions;
    DELETE FROM verification_codes;
    DELETE FROM users;
  `);
}

// Helper functions to match better-sqlite3 API style
export interface QueryResult {
  [key: string]: unknown;
}

type SqlValue = string | number | null | Uint8Array;

export function dbPrepare(sql: string) {
  return {
    run(...params: unknown[]): void {
      const database = getDatabase();
      database.run(sql, params as SqlValue[]);
      saveDatabase();
    },
    get(...params: unknown[]): QueryResult | undefined {
      const database = getDatabase();
      const stmt = database.prepare(sql);
      stmt.bind(params as SqlValue[]);
      if (stmt.step()) {
        const row = stmt.getAsObject();
        stmt.free();
        return row as QueryResult;
      }
      stmt.free();
      return undefined;
    },
    all(...params: unknown[]): QueryResult[] {
      const database = getDatabase();
      const stmt = database.prepare(sql);
      stmt.bind(params as SqlValue[]);
      const results: QueryResult[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as QueryResult);
      }
      stmt.free();
      return results;
    },
  };
}
