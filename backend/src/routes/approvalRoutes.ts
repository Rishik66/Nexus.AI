import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';
import { agentEngine } from '../orchestrator/engine.js';

export const approvalRoutes = Router();

approvalRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const approvals = db.getApprovals(businessId);
  const pending = db.getPendingApprovals(businessId);
  res.json({ approvals, pendingCount: pending.length });
});

const DecideApprovalSchema = z.object({
  decision: z.enum(['APPROVED', 'REJECTED', 'MODIFIED']),
  reason: z.string().optional(),
});

approvalRoutes.post('/:id/decide', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const { decision, reason } = DecideApprovalSchema.parse(req.body);

  const approval = db.getApprovals(businessId).find(a => a.id === req.params.id);
  if (!approval) {
    return res.status(404).json({ error: 'Approval request not found.' });
  }

  if (approval.status !== 'PENDING') {
    return res.status(400).json({ error: `Approval has already been resolved as ${approval.status}.` });
  }

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    agent_name: 'SENTINEL',
    action: `APPROVAL_${decision}`,
    entity_type: 'APPROVAL',
    entity_id: approval.id,
    details: { decision, reason, actionType: approval.action_type },
  });

  // Resume paused agent run if linked
  if (approval.run_id) {
    setImmediate(() => {
      agentEngine.resumeExecution(approval.run_id!, approval.id, decision, reason).catch(console.error);
    });
  } else {
    db.updateApproval(approval.id, decision, reason, req.user?.full_name || 'Manager');
  }

  res.json({
    success: true,
    message: `Action ${decision.toLowerCase()} successfully.`,
    approvalId: approval.id,
    decision,
  });
});
