import app from './index.js';
import { db } from './database/db.js';
import { seedDatabase } from './database/seed.js';

let initialized = false;

// Middleware ensuring enterprise store is seeded on first serverless invocation
app.use(async (_req: any, _res: any, next: any) => {
  if (!initialized) {
    try {
      const users = db.getUsers();
      if (users.length === 0) {
        await seedDatabase();
      }
    } catch (err) {
      console.warn('[SERVERLESS INIT] Warning during store initialization:', err);
    }
    initialized = true;
  }
  next();
});

export default app;
