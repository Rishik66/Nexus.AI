import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';

export const businessRoutes = Router();

businessRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const currentBiz = req.businessId ? db.getBusinessById(req.businessId) : null;
  res.json({ businesses: currentBiz ? [currentBiz] : [] });
});

businessRoutes.get('/current', authenticateJWT, (req: AuthRequest, res: Response) => {
  let biz = req.businessId ? db.getBusinessById(req.businessId) : null;
  if (!biz) {
    biz = db.getDemoBusiness() || {
      id: req.businessId || 'default-biz',
      name: 'Enterprise Organization',
      type: 'GENERAL',
      currency: 'USD',
      is_demo: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
  }
  res.json({ business: biz });
});
