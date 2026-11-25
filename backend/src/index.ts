import express from 'express';
import cors from 'cors';
import path from 'path';
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

const app = express();

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// Static uploads directory
const uploadsDir = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(uploadsDir));

// Health Check
app.get('/api/health', (_req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'NEXUS AI - Autonomous Business Operations Platform',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    demoMode: config.demoMode,
    geminiLive: !!config.geminiApiKey,
    databaseEngine: db.isUsingPostgres() ? 'PostgreSQL' : 'Embedded Relational Engine',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/businesses', businessRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/suppliers', supplierRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/agent-runs', agentRunRoutes);
app.use('/api/tools', toolRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/approvals', approvalRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/audit-logs', auditRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/notifications', notificationRoutes);

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

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(err => {
    console.error('[FATAL] Failed to start NEXUS AI server:', err);
    process.exit(1);
  });
}

export default app;
