import { Router, Response } from 'express';
import { z } from 'zod';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';
import { plannerService } from '../orchestrator/planner.js';
import { agentEngine, AgentExecutionEvent } from '../orchestrator/engine.js';

export const agentRunRoutes = Router();

const PlanGoalSchema = z.object({
  goal: z.string().min(3),
});

agentRunRoutes.post('/plan', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const { goal } = PlanGoalSchema.parse(req.body);

  const plan = await plannerService.generatePlan(goal, businessId);
  res.json({ plan });
});

const ExecuteRunSchema = z.object({
  goal: z.string().min(3),
  plan: z.any().optional(),
});

agentRunRoutes.post('/execute', authenticateJWT, async (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const { goal, plan } = ExecuteRunSchema.parse(req.body);

  // Generate plan if not provided
  const finalPlan = plan || await plannerService.generatePlan(goal, businessId);

  const run = db.createAgentRun({
    business_id: businessId,
    user_id: req.user?.id,
    goal,
    plan: finalPlan,
    status: 'PLANNING',
    current_agent: 'ORION',
  });

  db.logAudit({
    business_id: businessId,
    user_id: req.user?.id,
    agent_name: 'ORION',
    action: 'START_AGENT_RUN',
    entity_type: 'AGENT_RUN',
    entity_id: run.id,
    details: { goal, stepsCount: finalPlan.steps?.length },
  });

  // Start asynchronous agent execution loop
  setImmediate(() => {
    agentEngine.startExecution(run.id).catch(err => {
      console.error(`[AGENT_RUN] Failed execution for ${run.id}:`, err);
    });
  });

  res.status(202).json({
    runId: run.id,
    status: 'EXECUTING',
    goal: run.goal,
    plan: finalPlan,
  });
});

agentRunRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const limit = parseInt(req.query.limit as string || '20', 10);
  const runs = db.getAgentRuns(businessId, limit);
  res.json({ runs, count: runs.length });
});

agentRunRoutes.get('/:id', authenticateJWT, (req: AuthRequest, res: Response) => {
  const run = db.getAgentRunById(req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Agent run not found.' });
  }
  res.json({ run });
});

agentRunRoutes.post('/:id/stop', authenticateJWT, (req: AuthRequest, res: Response) => {
  const run = db.getAgentRunById(req.params.id);
  if (!run) {
    return res.status(404).json({ error: 'Agent run not found.' });
  }

  agentEngine.stopExecution(run.id, req.user?.full_name || 'User');
  res.json({ success: true, message: 'Execution stopped.' });
});

// Server-Sent Events (SSE) Live Stream for the AI Command Center
agentRunRoutes.get('/:id/stream', (req, res) => {
  const runId = req.params.id;
  const run = db.getAgentRunById(runId);
  if (!run) {
    return res.status(404).json({ error: 'Agent run not found.' });
  }

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*',
  });

  // Send initial snapshot
  const initialSnapshot = {
    type: 'SNAPSHOT',
    runId,
    data: {
      status: run.status,
      currentAgent: run.current_agent,
      steps: run.steps || [],
      messages: run.messages || [],
      plan: run.plan,
      results: run.results,
    },
    timestamp: new Date().toISOString(),
  };
  res.write(`data: ${JSON.stringify(initialSnapshot)}\n\n`);

  // Event listener callback
  const eventHandler = (event: AgentExecutionEvent) => {
    res.write(`data: ${JSON.stringify(event)}\n\n`);
  };

  agentEngine.on(`run:${runId}`, eventHandler);

  // Heartbeat every 15 seconds to keep connection open
  const heartbeat = setInterval(() => {
    res.write(': heartbeat\n\n');
  }, 15000);

  req.on('close', () => {
    clearInterval(heartbeat);
    agentEngine.off(`run:${runId}`, eventHandler);
  });
});
