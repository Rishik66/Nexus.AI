import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';

export const expenseRoutes = Router();

const ExpenseSchema = z.object({
  category: z.enum(['OPERATIONAL', 'PAYROLL', 'UTILITIES', 'MARKETING', 'INVENTORY', 'LOGISTICS', 'SOFTWARE', 'MISC']),
  description: z.string().min(2),
  amount: z.number().positive(),
  date: z.string().optional(),
  payment_method: z.string().optional().default('CREDIT_CARD'),
  receipt_url: z.string().optional(),
});

expenseRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const expenses = db.getExpenses(businessId);
  const total = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
  res.json({ expenses, totalExpenses: total, count: expenses.length });
});

expenseRoutes.post('/', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const body = ExpenseSchema.parse(req.body);

  const expense = db.createExpense({
    ...body,
    business_id: businessId,
    date: body.date || new Date().toISOString().split('T')[0],
  });

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    action: 'CREATE_EXPENSE',
    entity_type: 'EXPENSE',
    entity_id: expense.id,
    details: { amount: expense.amount, category: expense.category },
  });

  res.status(201).json({ expense });
});
