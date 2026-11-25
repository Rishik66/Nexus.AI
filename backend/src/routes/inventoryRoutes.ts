import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';

export const inventoryRoutes = Router();

inventoryRoutes.get('/movements', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const limit = parseInt(req.query.limit as string || '50', 10);
  const movements = db.getInventoryMovements(businessId, limit);
  res.json({ movements });
});

const AdjustStockSchema = z.object({
  product_id: z.string(),
  quantity: z.number(),
  reason: z.string().min(3),
});

inventoryRoutes.post('/adjust', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const { product_id, quantity, reason } = AdjustStockSchema.parse(req.body);

  const product = db.getProductById(product_id);
  if (!product) {
    return res.status(404).json({ error: 'Product not found.' });
  }

  const prev = product.stock_quantity;
  const next = Math.max(0, prev + quantity);
  db.updateProduct(product_id, { stock_quantity: next });

  const movement = db.recordInventoryMovement({
    business_id: businessId,
    product_id,
    type: quantity >= 0 ? 'ADJUSTMENT' : 'SALE',
    quantity,
    previous_quantity: prev,
    new_quantity: next,
    reason,
    reference_id: `MANUAL-${Date.now()}`,
  });

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    action: 'MANUAL_INVENTORY_ADJUSTMENT',
    entity_type: 'PRODUCT',
    entity_id: product_id,
    details: { prev, next, quantity, reason },
  });

  res.json({ success: true, movement, newQuantity: next });
});
