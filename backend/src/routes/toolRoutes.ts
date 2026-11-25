import { Router, Response } from 'express';
import { toolRegistry } from '../tools/registry.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';
import { db } from '../database/db.js';

export const toolRoutes = Router();

toolRoutes.get('/', authenticateJWT, (_req: AuthRequest, res: Response) => {
  const tools = toolRegistry.getAllTools().map(t => ({
    name: t.name,
    description: t.description,
    riskLevel: t.riskLevel,
    geminiDeclaration: t.geminiFunctionDeclaration,
  }));
  res.json({ tools, count: tools.length });
});

toolRoutes.post('/:name/execute', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
  const { name } = req.params;
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';

  const result = await toolRegistry.executeTool(name, req.body, {
    businessId,
    userId: req.user?.id,
    agentName: 'MANUAL_API_TESTER',
  });

  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
});
