import { Router, Response } from 'express';
import { AGENT_DESCRIPTORS } from '../agents/descriptors.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';

export const agentRoutes = Router();

agentRoutes.get('/', authenticateJWT, (_req: AuthRequest, res: Response) => {
  const agents = Object.values(AGENT_DESCRIPTORS).map(a => ({
    name: a.name,
    role: a.role,
    tagline: a.tagline,
    avatarColor: a.avatarColor,
    capabilities: a.capabilities,
    permittedTools: a.permittedTools,
  }));
  res.json({ agents });
});
