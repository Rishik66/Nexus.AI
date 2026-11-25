import { Router, Response } from 'express';
import { supabaseService } from '../database/supabaseClient.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';
import { z } from 'zod';

export const supabaseRoutes = Router();

// 1. Get Supabase Status
supabaseRoutes.get('/status', authenticateJWT, async (_req: AuthRequest, res: Response) => {
  try {
    const status = await supabaseService.getStatus();
    res.json(status);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Test Supabase Connection with candidate credentials
const TestConnectionSchema = z.object({
  supabaseUrl: z.string().url('Must be a valid Supabase URL, e.g. https://xyz.supabase.co'),
  supabaseAnonKey: z.string().optional(),
  supabaseServiceRoleKey: z.string().optional(),
  databaseUrl: z.string().optional(),
});

supabaseRoutes.post('/test', authenticateJWT, async (req: AuthRequest, res: Response) => {
  try {
    const payload = TestConnectionSchema.parse(req.body);
    const result = await supabaseService.testConnection(payload);
    res.json(result);
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Invalid parameters' });
  }
});

// 3. Connect & Save Supabase Credentials
supabaseRoutes.post('/connect', authenticateJWT, requireRole(['ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const payload = TestConnectionSchema.parse(req.body);
    
    // First test
    const testResult = await supabaseService.testConnection(payload);
    if (!testResult.success) {
      return res.status(400).json({
        success: false,
        message: `Connection verification failed: ${testResult.message}`,
        details: testResult.details,
      });
    }

    // Save
    const saveResult = await supabaseService.saveConfiguration(payload);
    res.json({
      success: true,
      message: 'Supabase credentials verified and linked successfully!',
      testResult,
      saveResult,
    });
  } catch (err: any) {
    res.status(400).json({ success: false, message: err.message || 'Failed to connect Supabase' });
  }
});

// 4. Sync Local Seed / Current Enterprise Store to Supabase Tables
supabaseRoutes.post('/sync-seed', authenticateJWT, requireRole(['ADMIN']), async (_req: AuthRequest, res: Response) => {
  try {
    const result = await supabaseService.syncSeedDataToSupabase();
    res.json(result);
  } catch (err: any) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// 5. Get Migration SQL Script
supabaseRoutes.get('/migration-sql', authenticateJWT, (_req: AuthRequest, res: Response) => {
  const sql = supabaseService.getMigrationSql();
  res.json({ sql });
});
