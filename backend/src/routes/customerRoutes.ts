import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';

export const customerRoutes = Router();

const CustomerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  total_spend: z.number().optional().default(0),
});

customerRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const customers = db.getCustomers(businessId);
  res.json({ customers, count: customers.length });
});

customerRoutes.get('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
  const customer = db.getCustomerById(req.params.id);
  if (!customer) {
    return res.status(404).json({ error: 'Customer not found.' });
  }
  res.json({ customer });
});

customerRoutes.post('/', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const validated = CustomerSchema.parse(req.body);

  const customer = db.createCustomer({
    ...validated,
    business_id: businessId,
    status: 'ACTIVE',
  });

  res.status(201).json({ customer });
});
