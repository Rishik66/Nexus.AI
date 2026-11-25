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

businessRoutes.put('/current', authenticateJWT, (req: AuthRequest, res: Response) => {
  const bizId = req.businessId || req.user?.business_id || db.getDemoBusiness()?.id || 'default-biz';
  const { name, type, currency, address, phone } = req.body;

  const updates: any = {};
  if (name !== undefined) updates.name = String(name).trim();
  if (type !== undefined) updates.type = String(type).trim();
  if (currency !== undefined) updates.currency = String(currency).trim().toUpperCase();
  if (address !== undefined) updates.address = String(address).trim();
  if (phone !== undefined) updates.phone = String(phone).trim();

  const updated = db.updateBusiness(bizId, updates);

  // Also sync demo business if currently active
  const demo = db.getDemoBusiness();
  if (demo && demo.id !== bizId && demo.is_demo) {
    db.updateBusiness(demo.id, updates);
  }

  res.json({ success: true, business: updated });
});
