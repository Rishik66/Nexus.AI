import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest, requireRole } from '../middleware/auth.js';
import { plannerService } from '../orchestrator/planner.js';
import { agentEngine } from '../orchestrator/engine.js';

export const workflowRoutes = Router();

const DEFAULT_WORKFLOW_TEMPLATES = [
  {
    name: 'Weekly Infrastructure & Compute Audit',
    description: 'Autonomous audit of engineering hardware, server clusters, and reorder triggers with purchase order drafting.',
    trigger_type: 'SCHEDULED' as const,
    cron_expression: '0 9 * * 1',
    steps: [
      { agent: 'ATLAS', action: 'AUDIT_INFRASTRUCTURE', order: 1 },
      { agent: 'SENTINEL', action: 'EVALUATE_CAPACITY_GATES', order: 2 },
      { agent: 'ORION', action: 'STAGE_PURCHASE_ORDERS', order: 3 },
    ],
    is_active: true,
  },
  {
    name: 'Daily Cash Flow & Receivables Recovery Sweep',
    description: 'Automated scan of open customer invoices, revenue vs. expenditures, and overdue receivables alert dispatch.',
    trigger_type: 'SCHEDULED' as const,
    cron_expression: '0 8 * * *',
    steps: [
      { agent: 'NOVA', action: 'ANALYZE_EXPENDITURES', order: 1 },
      { agent: 'NOVA', action: 'IDENTIFY_OVERDUE_INVOICES', order: 2 },
      { agent: 'SENTINEL', action: 'AUTHORIZE_CLIENT_REMINDERS', order: 3 },
    ],
    is_active: true,
  },
  {
    name: 'Multimodal Vendor Invoice & Contract Ingestion',
    description: 'Ingests vendor contracts and receipts via Gemini Vision OCR, extracting structured line items, dates, and SLA compliance.',
    trigger_type: 'EVENT_DRIVEN' as const,
    cron_expression: 'ON_UPLOAD',
    steps: [
      { agent: 'SAGE', action: 'MULTIMODAL_DOCUMENT_OCR', order: 1 },
      { agent: 'NOVA', action: 'VALIDATE_BUDGET_COMPLIANCE', order: 2 },
      { agent: 'SENTINEL', action: 'HUMAN_APPROVAL_GATE', order: 3 },
    ],
    is_active: true,
  },
  {
    name: 'Autonomous Expenditure Anomaly & Cloud Burst Sentinel',
    description: 'Real-time detection of anomalous cloud compute usage spikes, SaaS license sprawl, and unauthorized budget deviations.',
    trigger_type: 'SCHEDULED' as const,
    cron_expression: '0 17 * * *',
    steps: [
      { agent: 'NOVA', action: 'FLAG_EXPENSE_ANOMALIES', order: 1 },
      { agent: 'ORION', action: 'INVESTIGATE_COST_DRIVERS', order: 2 },
      { agent: 'SENTINEL', action: 'NOTIFY_EXECUTIVE_STAKEHOLDERS', order: 3 },
    ],
    is_active: true,
  },
];

const CreateWorkflowSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional().default(''),
  trigger_type: z.enum(['SCHEDULED', 'EVENT_DRIVEN', 'WEBHOOK', 'MANUAL']).default('SCHEDULED'),
  cron_expression: z.string().optional().default('0 9 * * 1'),
  steps: z.array(z.object({
    agent: z.string(),
    action: z.string(),
    order: z.number().default(1),
  })).optional().default([]),
  is_active: z.boolean().optional().default(true),
});

workflowRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  let workflows = db.getWorkflows(businessId);

  // Auto-seed default enterprise workflows if current company tenant has none
  if (workflows.length === 0) {
    for (const tpl of DEFAULT_WORKFLOW_TEMPLATES) {
      db.createWorkflow({
        ...tpl,
        business_id: businessId,
      });
    }
    workflows = db.getWorkflows(businessId);
  }

  res.json({ workflows, count: workflows.length });
});

workflowRoutes.post('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const body = CreateWorkflowSchema.parse(req.body);

  const wf = db.createWorkflow({
    business_id: businessId,
    name: body.name,
    description: body.description || '',
    trigger_type: body.trigger_type,
    cron_expression: body.cron_expression,
    steps: body.steps,
    is_active: body.is_active,
  });

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    action: 'CREATE_WORKFLOW',
    entity_type: 'WORKFLOW',
    entity_id: wf.id,
    details: { name: wf.name, trigger: wf.trigger_type },
  });

  res.status(201).json({ workflow: wf });
});

workflowRoutes.post('/seed-defaults', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const existingNames = new Set(db.getWorkflows(businessId).map(w => w.name));

  for (const tpl of DEFAULT_WORKFLOW_TEMPLATES) {
    if (!existingNames.has(tpl.name)) {
      db.createWorkflow({
        ...tpl,
        business_id: businessId,
      });
    }
  }

  const workflows = db.getWorkflows(businessId);
  res.json({ success: true, workflows, count: workflows.length });
});

workflowRoutes.patch('/:id/toggle', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const workflow = db.getWorkflows(businessId).find(w => w.id === req.params.id);

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found.' });
  }

  const updated = db.updateWorkflow(workflow.id, {
    is_active: !workflow.is_active,
  });

  res.json({ workflow: updated });
});

workflowRoutes.delete('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const workflow = db.getWorkflows(businessId).find(w => w.id === req.params.id);

  if (!workflow) {
    return res.status(404).json({ error: 'Workflow not found.' });
  }

  db.deleteWorkflow(workflow.id);
  res.json({ success: true, message: 'Workflow removed.' });
});

workflowRoutes.post('/:id/trigger', authenticateJWT, async (req: AuthRequest, res: Response) => {
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
