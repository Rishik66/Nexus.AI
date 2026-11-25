import express from 'express';
import cors from 'cors';
import path from 'path';
import os from 'os';
import { config } from './config/env.js';
import { db } from './database/db.js';
import { seedDatabase } from './database/seed.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import { authRoutes } from './routes/authRoutes.js';
import { businessRoutes } from './routes/businessRoutes.js';
import { dashboardRoutes } from './routes/dashboardRoutes.js';
import { productRoutes } from './routes/productRoutes.js';
import { inventoryRoutes } from './routes/inventoryRoutes.js';
import { customerRoutes } from './routes/customerRoutes.js';
import { supplierRoutes } from './routes/supplierRoutes.js';
import { orderRoutes } from './routes/orderRoutes.js';
import { invoiceRoutes } from './routes/invoiceRoutes.js';
import { expenseRoutes } from './routes/expenseRoutes.js';
import { taskRoutes } from './routes/taskRoutes.js';
import { agentRoutes } from './routes/agentRoutes.js';
import { agentRunRoutes } from './routes/agentRunRoutes.js';
import { toolRoutes } from './routes/toolRoutes.js';
import { workflowRoutes } from './routes/workflowRoutes.js';
import { approvalRoutes } from './routes/approvalRoutes.js';
import { documentRoutes } from './routes/documentRoutes.js';
import { auditRoutes } from './routes/auditRoutes.js';
import { integrationRoutes } from './routes/integrationRoutes.js';
import { notificationRoutes } from './routes/notificationRoutes.js';
import { supabaseRoutes } from './routes/supabaseRoutes.js';

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Ensure database is seeded before any route is evaluated
let storeInitialized = false;
let initPromise: Promise<void> | null = null;

const ensureStoreSeeded = async () => {
  if (storeInitialized) return;
  if (!initPromise) {
    initPromise = (async () => {
      try {
        const users = db.getUsers();
        if (users.length === 0) {
          console.log('[BOOT] Auto-seeding enterprise dataset...');
          await seedDatabase();
        }
      } catch (err) {
        console.warn('[BOOT] Error during auto-seed:', err);
      } finally {
        storeInitialized = true;
      }
    })();
  }
  return initPromise;
};

app.use(async (_req, _res, next) => {
  await ensureStoreSeeded();
  next();
});

// Static uploads directory
const isServerlessEnv = Boolean(process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.SERVERLESS_BUNDLE);
const uploadsDir = isServerlessEnv ? path.join(os.tmpdir(), 'nexus_uploads') : path.resolve(process.cwd(), 'uploads');
try {
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
} catch (err) {
  console.warn('[UPLOADS] Warning creating uploads directory:', err);
}
app.use('/uploads', express.static(uploadsDir));

// Health Check
app.get(['/api/health', '/health'], (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'NEXUS AI - Autonomous Business Operations Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    demoMode: config.demoMode,
    geminiLive: !!config.geminiApiKey,
    databaseEngine: db.isUsingPostgres() ? 'PostgreSQL' : 'Embedded Relational Engine',
    userCount: db.getUsers().length,
  });
});

// API Routes - registered on both /api/* and root paths for serverless flexibility
const apiRoutes = [
  { path: '/auth', router: authRoutes },
  { path: '/businesses', router: businessRoutes },
  { path: '/dashboard', router: dashboardRoutes },
  { path: '/products', router: productRoutes },
  { path: '/inventory', router: inventoryRoutes },
  { path: '/customers', router: customerRoutes },
  { path: '/suppliers', router: supplierRoutes },
  { path: '/orders', router: orderRoutes },
  { path: '/invoices', router: invoiceRoutes },
  { path: '/expenses', router: expenseRoutes },
  { path: '/tasks', router: taskRoutes },
  { path: '/agents', router: agentRoutes },
  { path: '/agent-runs', router: agentRunRoutes },
  { path: '/tools', router: toolRoutes },
  { path: '/workflows', router: workflowRoutes },
  { path: '/approvals', router: approvalRoutes },
  { path: '/documents', router: documentRoutes },
  { path: '/audit-logs', router: auditRoutes },
  { path: '/integrations', router: integrationRoutes },
  { path: '/notifications', router: notificationRoutes },
  { path: '/supabase', router: supabaseRoutes },
];

for (const r of apiRoutes) {
  app.use(`/api${r.path}`, r.router);
  app.use(r.path, r.router);
}

// Error Handling
app.use(errorHandler);

// Boot Server & Ensure Seed Data
export async function startServer() {
  // If store is unseeded, seed automatically
  const users = db.getUsers();
  if (users.length === 0) {
    console.log('[BOOT] Initializing and seeding demo business dataset...');
    await seedDatabase();
  }

  const server = app.listen(config.port, () => {
    console.log(`=======================================================`);
    console.log(`  NEXUS AI Backend Server running on port ${config.port}`);
    console.log(`  URL: http://localhost:${config.port}`);
    console.log(`  Health Check: http://localhost:${config.port}/api/health`);
    console.log(`  Gemini: ${config.geminiApiKey ? 'Live API Key Connected' : 'Autonomous Fallback Engine'}`);
    console.log(`  Database: ${db.isUsingPostgres() ? 'PostgreSQL (Supabase)' : 'Local High-Performance Store'}`);
    console.log(`=======================================================`);
  });

  return server;
}

const isServerless = !!(
  process.env.VERCEL ||
  process.env.AWS_LAMBDA_FUNCTION_NAME ||
  process.env.SERVERLESS_BUNDLE
);

if (process.env.NODE_ENV !== 'test' && !isServerless && require.main === module) {
  startServer().catch(err => {
    console.error('[FATAL] Failed to start NEXUS AI server:', err);
    process.exit(1);
  });
}

export default app;
