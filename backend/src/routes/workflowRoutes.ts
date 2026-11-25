import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';
import { plannerService } from '../orchestrator/planner.js';
import { agentEngine } from '../orchestrator/engine.js';

export const workflowRoutes = Router();

workflowRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const workflows = db.getWorkflows(businessId);
  res.json({ workflows, count: workflows.length });
});

workflowRoutes.post('/:id/trigger', authenticateJWT, requireRole(['ADMIN', 'MANAGER']), async (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const workflow = db.getWorkflows(businessId).find(w => w.id === req.params.id);

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found.' });
  }

  // Generate autonomous plan matching workflow name
  const plan = await plannerService.generatePlan(workflow.name, businessId);

  const run = db.createAgentRun({
    business_id: businessId,
    user_id: req.user?.id,
    goal: `[Automated Workflow] ${workflow.name}: ${workflow.description || ''}`,
    plan,
    status: 'PLANNING',
    current_agent: 'ORION',
  });

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    agent_name: 'ORION',
    action: 'TRIGGER_WORKFLOW',
    entity_type: 'WORKFLOW',
    entity_id: workflow.id,
    details: { workflowName: workflow.name, runId: run.id },
  });

  setImmediate(() => {
    agentEngine.startExecution(run.id).catch(console.error);
  });

  res.status(202).json({
    message: `Workflow "${workflow.name}" triggered successfully.`,
    runId: run.id,
    status: 'EXECUTING',
  });
});
