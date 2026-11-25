import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';

export const auditRoutes = Router();

auditRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const limit = parseInt(req.query.limit as string || '100', 10);
  const { action, agent } = req.query;

  let logs = db.getAuditLogs(businessId, limit);
  if (action && typeof action === 'string') {
    logs = logs.filter(l => l.action.toLowerCase().includes(action.toLowerCase()));
  }
  if (agent && typeof agent === 'string') {
    logs = logs.filter(l => l.agent_name?.toLowerCase() === agent.toLowerCase());
  }

  res.json({ logs, count: logs.length });
});
