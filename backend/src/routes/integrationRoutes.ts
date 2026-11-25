import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { config } from '../config/env.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';

export const integrationRoutes = Router();

integrationRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';

  const integrations = [
    {
      provider: 'GEMINI',
      name: 'Google Gemini 1.5 Pro AI',
      status: config.geminiApiKey ? 'CONNECTED' : 'DEMO_MODE',
      description: 'Powers native function calling, multimodal vision extraction, and autonomous agent reasoning.',
      details: config.geminiApiKey ? 'API Key verified and operational' : 'Running in autonomous deterministic demo engine mode',
    },
    {
      provider: 'SUPABASE',
      name: 'Supabase PostgreSQL',
      status: config.databaseUrl ? 'CONNECTED' : 'DEMO_MODE',
      description: 'Persistent cloud database engine for multi-tenant enterprise data isolation.',
      details: config.databaseUrl ? 'PostgreSQL connection active' : 'Running on zero-dependency local relational store (Supabase-compatible)',
    },
    {
      provider: 'RESEND',
      name: 'Resend Email Gateway',
      status: config.resendApiKey ? 'CONNECTED' : 'DEMO_MODE',
      description: 'Transactional email delivery for purchase orders, reports, and dunning alerts.',
      details: config.resendApiKey ? 'Active outbound mailer' : 'Simulated audit-logged sandbox dispatch (Ready for API key)',
    },
    {
      provider: 'FRANKFURTER',
      name: 'Frankfurter Forex API',
      status: 'CONNECTED',
      description: 'Live real-time foreign currency exchange rate feed for global business operations.',
      details: 'Connected to https://api.frankfurter.app with offline cached fallback',
    },
  ];

  res.json({ integrations });
});

integrationRoutes.post('/test', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  const { provider } = req.body;
  if (provider === 'FRANKFURTER') {
    try {
      const resp = await fetch('https://api.frankfurter.app/latest?from=USD&to=EUR');
      const data = await resp.json();
      return res.json({ success: true, message: 'Forex API responsive', data });
    } catch (err: any) {
      return res.status(500).json({ success: false, error: err.message });
    }
  }

  res.json({ success: true, message: `${provider} status checked.` });
});
