import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';

export const invoiceRoutes = Router();

invoiceRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const invoices = db.getInvoices(businessId);
  res.json({ invoices, count: invoices.length });
});

invoiceRoutes.get('/overdue', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const overdue = db.getOverdueInvoices(businessId);
  const totalOverdue = overdue.reduce((sum, inv) => sum + Number(inv.total_amount), 0);
  res.json({ invoices: overdue, count: overdue.length, totalOverdueAmount: totalOverdue });
});

const CreateInvoiceSchema = z.object({
  customer_id: z.string(),
  invoice_number: z.string().optional(),
  due_date: z.string(),
  subtotal: z.number().positive(),
  tax_amount: z.number().nonnegative(),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    total_price: z.number().positive(),
    product_id: z.string().optional(),
  })).optional().default([]),
});

invoiceRoutes.post('/', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const body = CreateInvoiceSchema.parse(req.body);

  const invNum = body.invoice_number || `INV-${Date.now().toString().slice(-6)}`;
  const total = body.subtotal + body.tax_amount;

  const invoice = db.createInvoice(
    {
      business_id: businessId,
      customer_id: body.customer_id,
      invoice_number: invNum,
      status: 'ISSUED',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: body.due_date,
      subtotal: body.subtotal,
      tax_amount: body.tax_amount,
      total_amount: total,
      notes: body.notes,
    },
    body.items
  );

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    action: 'CREATE_INVOICE',
    entity_type: 'INVOICE',
    entity_id: invoice.id,
    details: { invoice_number: invNum, total_amount: total },
  });

  res.status(201).json({ invoice });
});

invoiceRoutes.patch('/:id/status', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const { status } = req.body;

  const updated = db.updateInvoiceStatus(req.params.id, status);
  if (!updated) {
    return res.status(404).json({ error: 'Invoice not found.' });
  }

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    action: 'UPDATE_INVOICE_STATUS',
    entity_type: 'INVOICE',
    entity_id: updated.id,
    details: { status },
  });

  res.json({ invoice: updated });
});
