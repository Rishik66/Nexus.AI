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
  customer_id: z.string().optional(),
  customer_name: z.string().optional(),
  invoice_number: z.string().optional(),
  due_date: z.string().optional(),
  subtotal: z.number().positive(),
  tax_amount: z.number().nonnegative().optional().default(0),
  status: z.enum(['ISSUED', 'PAID', 'OVERDUE']).optional().default('ISSUED'),
  notes: z.string().optional(),
  items: z.array(z.object({
    description: z.string(),
    quantity: z.number().positive(),
    unit_price: z.number().positive(),
    total_price: z.number().positive(),
    product_id: z.string().optional(),
  })).optional().default([]),
});

invoiceRoutes.post('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const body = CreateInvoiceSchema.parse(req.body);

  let custId = body.customer_id;
  if (!custId) {
    const custName = body.customer_name?.trim() || 'Valued Enterprise Client';
    const existing = db.getCustomers(businessId).find(c => c.name.toLowerCase() === custName.toLowerCase());
    if (existing) {
      custId = existing.id;
    } else {
      const newCust = db.createCustomer({
        business_id: businessId,
        name: custName,
        email: `${custName.toLowerCase().replace(/[^a-z0-9]/g, '')}@client.com`,
        status: 'ACTIVE',
      });
      custId = newCust.id;
    }
  }

  const invNum = body.invoice_number || `INV-${Date.now().toString().slice(-6)}`;
  const total = body.subtotal + (body.tax_amount || 0);
  const defaultDueDate = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  const invoice = db.createInvoice(
    {
      business_id: businessId,
      customer_id: custId,
      invoice_number: invNum,
      status: body.status || 'ISSUED',
      issue_date: new Date().toISOString().split('T')[0],
      due_date: body.due_date || defaultDueDate,
      subtotal: body.subtotal,
      tax_amount: body.tax_amount || 0,
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
