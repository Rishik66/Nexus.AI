import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';

export const businessRoutes = Router();

businessRoutes.get('/', authenticateJWT, (_req: AuthRequest, res: Response) => {
  const businesses = db.getBusinesses();
  res.json({ businesses });
});

businessRoutes.get('/current', authenticateJWT, (req: AuthRequest, res: Response) => {
  const biz = (req.businessId && db.getBusinessById(req.businessId)) || db.getDemoBusiness();
  if (!biz) {
    return res.status(404).json({ error: 'Business not found.' });
  }
  res.json({ business: biz });
});
