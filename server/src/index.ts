import app from './app.js';
import { initializeDatabase } from './db/index.js';

const PORT = process.env.PORT || 3001;

async function main() {
  // Initialize database
  await initializeDatabase();

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

main().catch(console.error);
