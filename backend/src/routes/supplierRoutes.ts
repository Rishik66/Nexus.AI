import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';

export const supplierRoutes = Router();

const SupplierSchema = z.object({
  name: z.string().min(2),
  contact_person: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  rating: z.number().min(1).max(5).optional().default(4.5),
  lead_time_days: z.number().positive().optional().default(3),
});

supplierRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const suppliers = db.getSuppliers(businessId);
  res.json({ suppliers, count: suppliers.length });
});

supplierRoutes.get('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
  const supplier = db.getSupplierById(req.params.id);
  if (!supplier) {
    return res.status(404).json({ error: 'Supplier not found.' });
  }
  res.json({ supplier });
});

supplierRoutes.post('/', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const validated = SupplierSchema.parse(req.body);

  const supplier = db.createSupplier({
    ...validated,
    business_id: businessId,
  });

  res.status(201).json({ supplier });
});
