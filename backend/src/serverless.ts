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
async function handler(req: any, res: any) {
  // CORS Preflight handling
  if (res.setHeader) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
    );
  }

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  await ensureInitialized();

  return new Promise<void>((resolve, reject) => {
    if (res.on) {
      res.on('finish', resolve);
      res.on('close', resolve);
      res.on('error', reject);
    }
    (app as any)(req, res, (err: any) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

export default handler;
