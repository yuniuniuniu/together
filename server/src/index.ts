import 'dotenv/config';
import app from './app.js';
import { initializeDatabase } from './db/index.js';
import { startReminderChecker } from './services/reminderService.js';

const parsedPort = Number.parseInt(process.env.PORT ?? '', 10);
const PORT = Number.isNaN(parsedPort) ? 3005 : parsedPort;

async function main() {
  console.log(`[Server] Starting in ${process.env.NODE_ENV || 'development'} mode`);

  console.log('[Server] Initializing SQLite database...');
  await initializeDatabase();

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[Server] Running on http://0.0.0.0:${PORT}`);
    console.log(`[Server] Database: SQLite`);

    // Start reminder checker for anniversary and milestone notifications
    startReminderChecker();
  });
}

main().catch(console.error);
