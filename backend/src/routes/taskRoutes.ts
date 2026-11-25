import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';

export const taskRoutes = Router();

const TaskSchema = z.object({
  title: z.string().min(2),
  description: z.string().optional(),
  assigned_to: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']).optional().default('MEDIUM'),
  due_date: z.string().optional(),
});

taskRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const tasks = db.getTasks(businessId);
  res.json({ tasks, count: tasks.length });
});

taskRoutes.post('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const body = TaskSchema.parse(req.body);

  const task = db.createTask({
    ...body,
    business_id: businessId,
    status: 'PENDING',
    created_by_agent: 'USER_INTERFACE',
  });

  res.status(201).json({ task });
});

taskRoutes.patch('/:id/status', authenticateJWT, (req: AuthRequest, res: Response) => {
  const { status } = req.body;
  const task = db.updateTaskStatus(req.params.id, status);
  if (!task) {
    return res.status(404).json({ error: 'Task not found.' });
  }
  res.json({ task });
});
