import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';

export const businessRoutes = Router();

businessRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const currentBiz = req.businessId ? db.getBusinessById(req.businessId) : null;
  res.json({ businesses: currentBiz ? [currentBiz] : [] });
});

businessRoutes.get('/current', authenticateJWT, (req: AuthRequest, res: Response) => {
  const biz = req.businessId ? db.getBusinessById(req.businessId) : null;
  if (!biz) {
    return res.status(404).json({ error: 'Business organization not found.' });
  }
  res.json({ business: biz });
});
