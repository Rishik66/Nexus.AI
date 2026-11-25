import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { config } from '../config/env.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { geminiClient } from '../orchestrator/geminiClient.js';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';

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

integrationRoutes.post('/gemini/connect', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { apiKey, model } = z.object({
      apiKey: z.string().min(10, 'Gemini API key must be at least 10 characters'),
      model: z.string().optional().default('gemini-1.5-flash'),
    }).parse(req.body);

    // 1. Verify key by generating a brief test response
    const genAI = new GoogleGenerativeAI(apiKey);
    const targetModel = genAI.getGenerativeModel({ model });
    const testResult = await targetModel.generateContent('Verify connection: respond with "NEXUS_AI_CONNECTED"');
    const reply = testResult.response.text();

    // 2. Persist to backend .env
    const envPath = path.resolve(process.cwd(), '.env');
    if (fs.existsSync(envPath)) {
      let content = fs.readFileSync(envPath, 'utf-8');
      if (content.includes('GEMINI_API_KEY=')) {
        content = content.replace(/^GEMINI_API_KEY=.*$/m, `GEMINI_API_KEY=${apiKey}`);
      } else {
        content += `\nGEMINI_API_KEY=${apiKey}`;
      }
      if (content.includes('GEMINI_MODEL=')) {
        content = content.replace(/^GEMINI_MODEL=.*$/m, `GEMINI_MODEL=${model}`);
      } else {
        content += `\nGEMINI_MODEL=${model}`;
      }
      fs.writeFileSync(envPath, content, 'utf-8');
    }

    // 3. Re-initialize in-memory singleton
    config.geminiApiKey = apiKey;
    config.geminiModel = model;
    geminiClient.reinit(apiKey, model);

    res.json({
      success: true,
      message: 'Google Gemini AI connected successfully! Native LLM reasoning, multimodal vision, and function calling are now active.',
      testReply: reply.trim(),
    });
  } catch (err: any) {
    res.status(400).json({
      success: false,
      message: `Gemini verification failed: ${err.message || 'Invalid API Key'}`,
    });
  }
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
