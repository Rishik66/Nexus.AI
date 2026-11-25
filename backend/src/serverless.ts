import app from './index.js';
import { db } from './database/db.js';
import { seedDatabase } from './database/seed.js';

let initialized = false;

async function ensureInitialized() {
  if (!initialized) {
    try {
      const users = db.getUsers();
      if (users.length === 0) {
        await seedDatabase();
      }
    } catch (err) {
      console.warn('[SERVERLESS BOOT] Warning during store initialization:', err);
    }
    initialized = true;
  }
}

// Vercel Serverless Function Handler
export default async function handler(req: any, res: any) {
  await ensureInitialized();
  return (app as any)(req, res);
}
