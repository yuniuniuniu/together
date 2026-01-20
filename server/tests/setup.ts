import { beforeAll, afterAll, beforeEach } from 'vitest';
import { initializeDatabase, closeDatabase, resetDatabase } from '../src/db/index.js';

beforeAll(async () => {
  // Use in-memory database for tests
  await initializeDatabase(':memory:');
});

afterAll(() => {
  closeDatabase();
});

beforeEach(() => {
  resetDatabase();
});
