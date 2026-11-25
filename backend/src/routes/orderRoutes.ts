import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';

export const orderRoutes = Router();

orderRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const orders = db.getPurchaseOrders(businessId);
  res.json({ orders, count: orders.length });
});

const CreatePurchaseOrderSchema = z.object({
  supplier_id: z.string(),
  items: z.array(z.object({
    product_id: z.string(),
    quantity: z.number().positive(),
    unit_cost: z.number().positive(),
  })),
  notes: z.string().optional(),
});

orderRoutes.post('/', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const { supplier_id, items, notes } = CreatePurchaseOrderSchema.parse(req.body);

  const supplier = db.getSupplierById(supplier_id);
  if (!supplier) {
    return res.status(404).json({ error: 'Supplier not found.' });
  }

  let total = 0;
  const formattedItems = items.map(item => {
    const cost = item.quantity * item.unit_cost;
    total += cost;
    return {
      product_id: item.product_id,
      quantity: item.quantity,
      unit_cost: item.unit_cost,
      total_cost: cost,
    };
  });

  const po = db.createPurchaseOrder(
    {
      business_id: businessId,
      supplier_id,
      order_number: `PO-${Date.now().toString().slice(-6)}`,
      status: 'DRAFT',
      total_amount: total,
      notes,
      created_by: req.user?.full_name || 'User',
    },
    formattedItems
  );

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    action: 'CREATE_PURCHASE_ORDER',
    entity_type: 'PURCHASE_ORDER',
    entity_id: po.id,
    details: { order_number: po.order_number, total_amount: po.total_amount },
  });

  res.status(201).json({ purchaseOrder: po });
});

orderRoutes.patch('/:id/status', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const { status } = req.body;

  const po = db.updatePurchaseOrderStatus(req.params.id, status, req.user?.full_name);
  if (!po) {
    return res.status(404).json({ error: 'Purchase order not found.' });
  }

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    action: 'UPDATE_PURCHASE_ORDER_STATUS',
    entity_type: 'PURCHASE_ORDER',
    entity_id: po.id,
    details: { status, approved_by: req.user?.full_name },
  });

  res.json({ purchaseOrder: po });
});
