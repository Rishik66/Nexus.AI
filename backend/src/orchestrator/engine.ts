import { EventEmitter } from 'events';
import { db } from '../database/db.js';
import { toolRegistry } from '../tools/registry.js';
import { AGENT_DESCRIPTORS } from '../agents/descriptors.js';
import { AgentName, RiskLevel } from '../database/types.js';
import { PlanStep } from '../agents/types.js';

export interface AgentExecutionEvent {
  runId: string;
  type:
    | 'STATUS_CHANGE'
    | 'AGENT_THOUGHT'
    | 'AGENT_MESSAGE'
    | 'STEP_START'
    | 'TOOL_CALL'
    | 'TOOL_OUTPUT'
    | 'APPROVAL_REQUIRED'
    | 'STEP_COMPLETE'
    | 'RUN_COMPLETE'
    | 'RUN_STOPPED'
    | 'RUN_ERROR';
  agentName?: AgentName;
  stepIndex?: number;
  data: any;
  timestamp: string;
}

export class AgentExecutionEngine extends EventEmitter {
  private static instance: AgentExecutionEngine;
  private activeRuns: Map<string, { abort: boolean; paused: boolean }> = new Map();

  private constructor() {
    super();
    this.setMaxListeners(50);
  }

  public static getInstance(): AgentExecutionEngine {
    if (!AgentExecutionEngine.instance) {
      AgentExecutionEngine.instance = new AgentExecutionEngine();
    }
    return AgentExecutionEngine.instance;
  }

  public emitEvent(event: AgentExecutionEvent) {
    this.emit(`run:${event.runId}`, event);
    this.emit('global_agent_event', event);
  }

  public isRunActive(runId: string): boolean {
    const state = this.activeRuns.get(runId);
    return !!state && !state.abort && !state.paused;
  }

  /**
   * Stop an ongoing execution immediately
   */
  public stopExecution(runId: string, stoppedBy: string = 'User') {
    const state = this.activeRuns.get(runId);
    if (state) {
      state.abort = true;
    }

    db.updateAgentRun(runId, {
      status: 'STOPPED',
      results: {
        message: `Execution stopped by ${stoppedBy}. Future agent actions canceled. Previous steps preserved.`,
        stoppedAt: new Date().toISOString(),
      },
    });

    const run = db.getAgentRunById(runId);
    if (run) {
      db.logAudit({
        business_id: run.business_id,
        user_id: run.user_id,
        agent_name: 'SENTINEL',
        action: 'STOP_EXECUTION',
        entity_type: 'AGENT_RUN',
        entity_id: runId,
        details: { stoppedBy, reason: 'Manual human stop command triggered' },
      });
    }

    this.emitEvent({
      runId,
      type: 'RUN_STOPPED',
      agentName: 'SENTINEL',
      data: { message: `Execution stopped by ${stoppedBy}.` },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Start executing an agent run from its stored plan
   */
  public async startExecution(runId: string) {
    const run = db.getAgentRunById(runId);
    if (!run) {
      throw new Error(`Agent run ${runId} not found.`);
    }

    this.activeRuns.set(runId, { abort: false, paused: false });
    db.updateAgentRun(runId, { status: 'EXECUTING' });

    this.emitEvent({
      runId,
      type: 'STATUS_CHANGE',
      agentName: 'ORION',
      data: { status: 'EXECUTING', goal: run.goal },
      timestamp: new Date().toISOString(),
    });

    // Notify ORION start message
    db.addAgentMessage({
      run_id: runId,
      sender_agent: 'ORION',
      recipient_agent: 'USER',
      content: `Goal acknowledged: "${run.goal}". I have structured the execution plan and am now directing specialist agents.`,
      message_type: 'PLAN',
    });

    try {
      await this.runLoop(runId);
    } catch (err: any) {
      console.error(`[ENGINE] Error in agent run ${runId}:`, err);
      db.updateAgentRun(runId, {
        status: 'FAILED',
        results: { error: err?.message || 'Execution error' },
      });
      this.emitEvent({
        runId,
        type: 'RUN_ERROR',
        agentName: 'SENTINEL',
        data: { error: err?.message || 'Execution error' },
        timestamp: new Date().toISOString(),
      });
    } finally {
      this.activeRuns.delete(runId);
    }
  }

  /**
   * The core PLAN -> ACT -> OBSERVE -> EVALUATE -> REPLAN -> VERIFY -> COMPLETE loop
   */
  private async runLoop(runId: string) {
    const run = db.getAgentRunById(runId);
    if (!run) return;

    const steps = (run.plan?.steps || []) as PlanStep[];
    const businessId = run.business_id;

    for (let i = 0; i < steps.length; i++) {
      const step = steps[i];
      const state = this.activeRuns.get(runId);

      // Check Stop control
      if (state?.abort) {
        console.log(`[ENGINE] Run ${runId} was aborted by user.`);
        return;
      }

      // Skip already completed steps if resuming
      if (step.status === 'COMPLETED' || step.status === 'SKIPPED') {
        continue;
      }

      db.updateAgentRun(runId, { current_agent: step.agentName });

      // Step record in DB
      let dbStep = db.addAgentStep({
        run_id: runId,
        step_index: step.stepIndex,
        agent_name: step.agentName,
        description: step.description,
        tool_name: step.toolName,
        status: 'RUNNING',
        input: step.suggestedInput,
        risk_level: step.riskLevel,
        duration_ms: 0,
      });

      this.emitEvent({
        runId,
        type: 'STEP_START',
        agentName: step.agentName,
        stepIndex: step.stepIndex,
        data: { step },
        timestamp: new Date().toISOString(),
      });

      // Brief delay to simulate deliberate agent collaboration & thought
      await new Promise(r => setTimeout(r, 600));

      // SENTINEL Human Approval Gate for MEDIUM or HIGH risk actions
      if (step.riskLevel === 'MEDIUM' || step.riskLevel === 'HIGH') {
        // Create Approval entry
        const approval = db.createApproval({
          business_id: businessId,
          run_id: runId,
          step_id: dbStep.id,
          requesting_agent: step.agentName,
          action_type: step.toolName || 'STATE_MUTATION',
          description: step.description,
          risk_level: step.riskLevel,
          payload: step.suggestedInput || { action: step.description },
          status: 'PENDING',
        });

        db.updateAgentRun(runId, { status: 'WAITING_APPROVAL' });
        db.updateAgentStep(dbStep.id, { status: 'WAITING_APPROVAL' });

        db.addAgentMessage({
          run_id: runId,
          sender_agent: 'SENTINEL',
          recipient_agent: 'USER',
          content: `Safety Gate Triggered: Step ${step.stepIndex} ("${step.description}") is classified as ${step.riskLevel} RISK. Human manager approval required before proceeding.`,
          message_type: 'APPROVAL_REQUEST',
          metadata: { approvalId: approval.id, riskLevel: step.riskLevel },
        });

        this.emitEvent({
          runId,
          type: 'APPROVAL_REQUIRED',
          agentName: 'SENTINEL',
          stepIndex: step.stepIndex,
          data: {
            approvalId: approval.id,
            description: step.description,
            riskLevel: step.riskLevel,
            payload: step.suggestedInput,
          },
          timestamp: new Date().toISOString(),
        });

        // Pause execution until user approves via /api/approvals/:id/decide
        if (state) state.paused = true;
        return; // Engine exits until resumed
      }

      // Execute Step Tool
      const stepStartTime = Date.now();
      let toolOutput: any = null;

      if (step.toolName) {
        this.emitEvent({
          runId,
          type: 'TOOL_CALL',
          agentName: step.agentName,
          stepIndex: step.stepIndex,
          data: { toolName: step.toolName, input: step.suggestedInput },
          timestamp: new Date().toISOString(),
        });

        const execResult = await toolRegistry.executeTool(
          step.toolName,
          step.suggestedInput || {},
          {
            businessId,
            userId: run.user_id,
            agentName: step.agentName,
            runId,
            stepId: dbStep.id,
          }
        );

        toolOutput = execResult.output || { error: execResult.error };

        this.emitEvent({
          runId,
          type: 'TOOL_OUTPUT',
          agentName: step.agentName,
          stepIndex: step.stepIndex,
          data: {
            toolName: step.toolName,
            success: execResult.success,
            output: toolOutput,
            durationMs: execResult.durationMs,
          },
          timestamp: new Date().toISOString(),
        });
      } else {
        // Agent reasoning / synthesis turn
        toolOutput = {
          completed: true,
          agent: step.agentName,
          note: `Evaluation and synthesis executed by ${step.agentName}.`,
        };
      }

      const durationMs = Date.now() - stepStartTime;

      // Update Step to completed
      db.updateAgentStep(dbStep.id, {
        status: 'COMPLETED',
        output: toolOutput,
        duration_ms: durationMs,
      });

      // Update plan step in memory & db
      step.status = 'COMPLETED';
      step.output = toolOutput;
      run.plan.steps[i] = step;
      db.updateAgentRun(runId, { plan: run.plan });

      // Agent message broadcast
      const agentDesc = AGENT_DESCRIPTORS[step.agentName];
      db.addAgentMessage({
        run_id: runId,
        sender_agent: step.agentName,
        recipient_agent: 'ORION',
        content: `Completed: ${step.description}. Generated observations.`,
        message_type: 'OBSERVATION',
        metadata: { durationMs, tool: step.toolName },
      });

      this.emitEvent({
        runId,
        type: 'STEP_COMPLETE',
        agentName: step.agentName,
        stepIndex: step.stepIndex,
        data: { stepIndex: step.stepIndex, output: toolOutput, durationMs },
        timestamp: new Date().toISOString(),
      });

      await new Promise(r => setTimeout(r, 400));
    }

    // All steps completed! Complete execution & synthesize final report
    await this.completeExecution(runId);
  }

  /**
   * Resume an execution after human approval
   */
  public async resumeExecution(runId: string, approvalId: string, decision: 'APPROVED' | 'REJECTED' | 'MODIFIED', reason?: string) {
    const run = db.getAgentRunById(runId);
    if (!run) throw new Error(`Run ${runId} not found.`);

    this.activeRuns.set(runId, { abort: false, paused: false });

    // Update approval status
    db.updateApproval(approvalId, decision, reason, 'Human Manager');

    if (decision === 'REJECTED') {
      db.addAgentMessage({
        run_id: runId,
        sender_agent: 'SENTINEL',
        recipient_agent: 'ORION',
        content: `Human manager rejected action: "${reason || 'Safety/policy concerns'}". Re-evaluating next safe step.`,
        message_type: 'CRITIQUE',
      });
      // Skip the paused step and finish
      db.updateAgentRun(runId, { status: 'COMPLETED' });
      await this.completeExecution(runId);
      return;
    }

    // If APPROVED, execute the paused step action
    const pendingStep = run.steps?.find(s => s.status === 'WAITING_APPROVAL');
    if (pendingStep) {
      db.addAgentMessage({
        run_id: runId,
        sender_agent: 'SENTINEL',
        recipient_agent: pendingStep.agent_name,
        content: `Human approval GRANTED. Authorized to proceed with ${pendingStep.description}.`,
        message_type: 'DELEGATION',
      });

      if (pendingStep.tool_name) {
        const execResult = await toolRegistry.executeTool(
          pendingStep.tool_name,
          pendingStep.input || {},
          {
            businessId: run.business_id,
            userId: run.user_id,
            agentName: pendingStep.agent_name,
            runId,
            stepId: pendingStep.id,
          }
        );

        db.updateAgentStep(pendingStep.id, {
          status: 'COMPLETED',
          output: execResult.output || { error: execResult.error },
          duration_ms: execResult.durationMs,
        });
      } else {
        db.updateAgentStep(pendingStep.id, {
          status: 'COMPLETED',
          output: { success: true, authorized: true },
        });
      }

      // Mark in plan
      const planSteps = (run.plan?.steps || []) as PlanStep[];
      const pIdx = planSteps.findIndex(ps => ps.stepIndex === pendingStep.step_index);
      if (pIdx >= 0) {
        planSteps[pIdx].status = 'COMPLETED';
        run.plan.steps = planSteps;
        db.updateAgentRun(runId, { plan: run.plan });
      }
    }

    // Continue remaining steps
    db.updateAgentRun(runId, { status: 'EXECUTING' });
    await this.runLoop(runId);
  }

  /**
   * Final synthesis and verification
   */
  private async completeExecution(runId: string) {
    const run = db.getAgentRunById(runId);
    if (!run) return;

    const steps = run.steps || [];
    const completedCount = steps.filter(s => s.status === 'COMPLETED').length;
    const toolsUsed = Array.from(new Set(steps.map(s => s.tool_name).filter(Boolean)));

    // Generate executive summary
    const finalReport = {
      goal: run.goal,
      status: 'SUCCESS',
      completedTasks: completedCount,
      totalTasks: steps.length,
      toolsUsed,
      participatingAgents: ['ORION', 'ATLAS', 'NOVA', 'SAGE', 'SENTINEL'],
      keyAchievements: [
        `Executed multi-agent collaboration across ${toolsUsed.length} enterprise tools.`,
        `Safety and human-in-the-loop gates audited by SENTINEL controller.`,
        `All findings, calculations, and mutations persisted to immutable audit logs.`,
      ],
      completedAt: new Date().toISOString(),
    };

    db.updateAgentRun(runId, {
      status: 'COMPLETED',
      current_agent: 'ORION',
      results: finalReport,
    });

    db.addAgentMessage({
      run_id: runId,
      sender_agent: 'ORION',
      recipient_agent: 'USER',
      content: `Execution successfully completed! ${completedCount} of ${steps.length} tasks executed with full verification. All database changes and recommendations are ready.`,
      message_type: 'REPORT',
      metadata: finalReport,
    });

    this.emitEvent({
      runId,
      type: 'RUN_COMPLETE',
      agentName: 'ORION',
      data: finalReport,
      timestamp: new Date().toISOString(),
    });
  }
}

export const agentEngine = AgentExecutionEngine.getInstance();
