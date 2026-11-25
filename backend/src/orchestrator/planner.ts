import { v4 as uuidv4 } from 'uuid';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { config } from '../config/env.js';
import { ExecutionPlan, PlanStep } from '../agents/types.js';
import { AgentName } from '../database/types.js';

export class PlannerService {
  private static instance: PlannerService;

  private constructor() {}

  public static getInstance(): PlannerService {
    if (!PlannerService.instance) {
      PlannerService.instance = new PlannerService();
    }
    return PlannerService.instance;
  }

  /**
   * Generate an execution plan from a user natural language goal
   */
  public async generatePlan(goal: string, businessId: string): Promise<ExecutionPlan> {
    const goalLower = goal.toLowerCase();

    // 1. Try Gemini generation if available
    if (config.geminiApiKey) {
      try {
        const genAI = new GoogleGenerativeAI(config.geminiApiKey);
        const model = genAI.getGenerativeModel({ model: config.geminiModel });

        const prompt = `You are ORION, Master Orchestrator for NEXUS AI.
Break down this user business goal into a structured sequential multi-agent execution plan.
Goal: "${goal}"

Available Specialist Agents:
- ATLAS (Operations, Infrastructure, Inventory, Suppliers, Purchase Orders, Tasks)
- NOVA (Finance, Revenue, Expenses, Invoices, Cash Flow, Forex)
- SAGE (Research, Multimodal Document Extraction, Insights)
- SENTINEL (Quality, Risk Review, Human Approval Gate)
- HERMES (Customer Communications, Accounts Receivable Outreach, Partner Messaging)
- APEX (Executive Strategy, Market Benchmarking, Growth Forecasting)

Available Tools:
- DATABASE_SEARCH (low risk)
- DATABASE_UPDATE (medium/high risk - state mutations)
- BUSINESS_CALCULATOR (low risk - precise arithmetic)
- CURRENCY_CONVERSION (low risk)
- EMAIL_NOTIFICATION (high risk - external messages)
- DOCUMENT_ANALYSIS (low risk - vision parsing)
- BUSINESS_ANALYTICS (low risk - health score calculation)

Output ONLY valid JSON matching this schema:
{
  "summary": "1 sentence executive summary of the plan",
  "targetAgents": ["ORION", "ATLAS", "NOVA", "SAGE", "SENTINEL", "HERMES", "APEX"],
  "estimatedTurns": number,
  "steps": [
    {
      "stepIndex": 1,
      "agentName": "ATLAS",
      "description": "Clear step description",
      "toolName": "DATABASE_SEARCH",
      "suggestedInput": {},
      "riskLevel": "LOW" | "MEDIUM" | "HIGH",
      "dependencies": []
    }
  ]
}
If a step modifies data or drafts purchase orders, classify as MEDIUM risk. If it sends emails, classify as HIGH risk. Always include SENTINEL to review before consequential steps!`;

        const result = await model.generateContent(prompt);
        const text = result.response.text().trim();
        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
        const parsed = JSON.parse(cleaned);

        return {
          goal,
          summary: parsed.summary || `Execution plan generated for: ${goal}`,
          targetAgents: parsed.targetAgents || ['ORION', 'ATLAS', 'SENTINEL'],
          estimatedTurns: parsed.steps?.length || 4,
          steps: (parsed.steps || []).map((s: any, idx: number): PlanStep => ({
            id: uuidv4(),
            stepIndex: idx + 1,
            agentName: s.agentName as AgentName,
            description: s.description,
            toolName: s.toolName,
            suggestedInput: s.suggestedInput,
            riskLevel: s.riskLevel || 'LOW',
            dependencies: s.dependencies || [],
            status: 'PENDING',
          })),
        };
      } catch (err) {
        console.warn('[PLANNER] Gemini plan generation failed, falling back to deterministic template planner:', err);
      }
    }

    // 2. High-Precision Deterministic Domain Planner
    return this.generateDeterministicPlan(goal, businessId);
  }

  private generateDeterministicPlan(goal: string, _businessId: string): ExecutionPlan {
    const g = goal.toLowerCase();

    // Template 1: Enterprise Infrastructure Assets, Cloud Capacity & Procurement Requisitions
    if (
      g.includes('asset') ||
      g.includes('infrastructure') ||
      g.includes('capacity') ||
      g.includes('procurement') ||
      g.includes('low stock') ||
      g.includes('restock') ||
      g.includes('inventory') ||
      g.includes('purchase order')
    ) {
      const steps: PlanStep[] = [
        {
          id: uuidv4(),
          stepIndex: 1,
          agentName: 'ATLAS',
          description: 'Audit operational infrastructure, compute nodes, and hardware assets depleted below capacity threshold.',
          toolName: 'DATABASE_SEARCH',
          suggestedInput: { entity: 'products', filter: { low_stock: true } },
          riskLevel: 'LOW',
          dependencies: [],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 2,
          agentName: 'ATLAS',
          description: 'Calculate optimal capacity expansion quantities and vendor lead times.',
          toolName: 'BUSINESS_CALCULATOR',
          suggestedInput: {
            operation: 'REORDER_QUANTITY',
            parameters: { current_stock: 4, reorder_threshold: 15, unit_cost: 95.0, buffer_multiplier: 2.0 },
          },
          riskLevel: 'LOW',
          dependencies: [1],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 3,
          agentName: 'SENTINEL',
          description: 'Review infrastructure expansion plan, check vendor SLAs, and enforce human approval gate.',
          riskLevel: 'MEDIUM',
          dependencies: [2],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 4,
          agentName: 'ATLAS',
          description: 'Generate formal procurement requisition draft for approved infrastructure assets.',
          toolName: 'DATABASE_UPDATE',
          suggestedInput: {
            action: 'CREATE_PURCHASE_ORDER_DRAFT',
            payload: { notes: 'Procurement draft generated for critical infrastructure and operational assets' },
            reason: 'Replenish depleted enterprise infrastructure capacity',
          },
          riskLevel: 'MEDIUM',
          dependencies: [3],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 5,
          agentName: 'ORION',
          description: 'Synthesize operational report and present final procurement & capacity summary.',
          riskLevel: 'LOW',
          dependencies: [4],
          status: 'PENDING',
        },
      ];

      return {
        goal,
        summary: 'Audit depleted operational infrastructure & software licenses, calculate capacity replenishment, submit for SENTINEL safety approval, and draft vendor procurement requisitions.',
        targetAgents: ['ORION', 'ATLAS', 'SENTINEL'],
        steps,
        estimatedTurns: steps.length,
      };
    }

    // Template 2: Expense analysis and anomaly detection
    if (g.includes('expense') || g.includes('spending') || g.includes('unnecessary') || g.includes('cost')) {
      const steps: PlanStep[] = [
        {
          id: uuidv4(),
          stepIndex: 1,
          agentName: 'NOVA',
          description: 'Retrieve categorized business expenses and historical records.',
          toolName: 'DATABASE_SEARCH',
          suggestedInput: { entity: 'expenses', limit: 25 },
          riskLevel: 'LOW',
          dependencies: [],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 2,
          agentName: 'NOVA',
          description: 'Compute category breakdowns and calculate cost variance percentages.',
          toolName: 'BUSINESS_CALCULATOR',
          suggestedInput: {
            operation: 'VARIANCE_PERCENTAGE',
            parameters: { baseline: 950, current: 4850 },
          },
          riskLevel: 'LOW',
          dependencies: [1],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 3,
          agentName: 'NOVA',
          description: 'Scan ledger for spending anomalies, freight surcharges, and budget overruns.',
          toolName: 'BUSINESS_ANALYTICS',
          suggestedInput: { metrics: ['EXPENSE_ANOMALIES'] },
          riskLevel: 'LOW',
          dependencies: [2],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 4,
          agentName: 'SENTINEL',
          description: 'Audit NOVA calculations and flag high-risk cost leakages for executive review.',
          riskLevel: 'LOW',
          dependencies: [3],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 5,
          agentName: 'ORION',
          description: 'Synthesize comprehensive expense reduction recommendations.',
          riskLevel: 'LOW',
          dependencies: [4],
          status: 'PENDING',
        },
      ];

      return {
        goal,
        summary: 'Extract categorized expenditures, audit anomalous freight and software spikes, and formulate cost reduction strategies.',
        targetAgents: ['ORION', 'NOVA', 'SENTINEL'],
        steps,
        estimatedTurns: steps.length,
      };
    }

    // Template 3: Invoices & overdue receivables
    if (g.includes('invoice') || g.includes('overdue') || g.includes('receivable') || g.includes('pending payment')) {
      const steps: PlanStep[] = [
        {
          id: uuidv4(),
          stepIndex: 1,
          agentName: 'NOVA',
          description: 'Search accounts receivable for overdue customer invoices.',
          toolName: 'DATABASE_SEARCH',
          suggestedInput: { entity: 'invoices', filter: { status: 'OVERDUE' } },
          riskLevel: 'LOW',
          dependencies: [],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 2,
          agentName: 'NOVA',
          description: 'Calculate aging schedule, interest impact, and total past-due exposure.',
          toolName: 'BUSINESS_CALCULATOR',
          suggestedInput: {
            operation: 'PROFIT_MARGIN',
            parameters: { revenue: 22356, cost: 6970 },
          },
          riskLevel: 'LOW',
          dependencies: [1],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 3,
          agentName: 'SENTINEL',
          description: 'Authorize operational task creation and verify customer communication parameters.',
          riskLevel: 'MEDIUM',
          dependencies: [2],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 4,
          agentName: 'ATLAS',
          description: 'Create operational follow-up tasks for customer service managers.',
          toolName: 'DATABASE_UPDATE',
          suggestedInput: {
            action: 'CREATE_TASK',
            payload: {
              title: 'Follow Up Overdue Customer Invoices',
              description: 'Contact customers with invoices past due to accelerate cash collection.',
              priority: 'HIGH',
            },
            reason: 'Accelerate overdue receivables cash collection',
          },
          riskLevel: 'MEDIUM',
          dependencies: [3],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 5,
          agentName: 'ORION',
          description: 'Synthesize receivables report with action steps and aging breakdown.',
          riskLevel: 'LOW',
          dependencies: [4],
          status: 'PENDING',
        },
      ];

      return {
        goal,
        summary: 'Audit overdue invoices, calculate outstanding financial exposure, and deploy customer follow-up tasks.',
        targetAgents: ['ORION', 'NOVA', 'ATLAS', 'SENTINEL'],
        steps,
        estimatedTurns: steps.length,
      };
    }

    // Template 4: Multimodal document extraction & processing
    if (g.includes('document') || g.includes('uploaded') || g.includes('receipt') || g.includes('pdf')) {
      const steps: PlanStep[] = [
        {
          id: uuidv4(),
          stepIndex: 1,
          agentName: 'SAGE',
          description: 'Extract vendor details, line items, and totals from uploaded invoice document.',
          toolName: 'DOCUMENT_ANALYSIS',
          suggestedInput: { documentType: 'INVOICE' },
          riskLevel: 'LOW',
          dependencies: [],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 2,
          agentName: 'ATLAS',
          description: 'Cross-reference extracted vendor against approved supplier directory.',
          toolName: 'DATABASE_SEARCH',
          suggestedInput: { entity: 'suppliers' },
          riskLevel: 'LOW',
          dependencies: [1],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 3,
          agentName: 'NOVA',
          description: 'Verify extracted line-item arithmetic and tax calculation.',
          toolName: 'BUSINESS_CALCULATOR',
          suggestedInput: {
            operation: 'TAX_CALCULATION',
            parameters: { subtotal: 1390.0, tax_rate: 0.08 },
          },
          riskLevel: 'LOW',
          dependencies: [2],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 4,
          agentName: 'SENTINEL',
          description: 'Present extracted form for user verification and enforce approval gate.',
          riskLevel: 'MEDIUM',
          dependencies: [3],
          status: 'PENDING',
        },
        {
          id: uuidv4(),
          stepIndex: 5,
          agentName: 'ORION',
          description: 'Confirm invoice record registration into enterprise database.',
          riskLevel: 'LOW',
          dependencies: [4],
          status: 'PENDING',
        },
      ];

      return {
        goal,
        summary: 'Extract structured line-items from uploaded document, verify supplier and arithmetic, and submit for verification.',
        targetAgents: ['ORION', 'SAGE', 'ATLAS', 'NOVA', 'SENTINEL'],
        steps,
        estimatedTurns: steps.length,
      };
    }

    // Template 5: General complete business health check (Default Mega Workflow)
    const steps: PlanStep[] = [
      {
        id: uuidv4(),
        stepIndex: 1,
        agentName: 'ATLAS',
        description: 'Audit enterprise infrastructure assets, capacity allocation alerts, and vendor SLA constraints.',
        toolName: 'DATABASE_SEARCH',
        suggestedInput: { entity: 'products', filter: { low_stock: true } },
        riskLevel: 'LOW',
        dependencies: [],
        status: 'PENDING',
      },
      {
        id: uuidv4(),
        stepIndex: 2,
        agentName: 'NOVA',
        description: 'Analyze financial health, revenue vs expenses, and overdue receivables.',
        toolName: 'DATABASE_SEARCH',
        suggestedInput: { entity: 'invoices', filter: { status: 'OVERDUE' } },
        riskLevel: 'LOW',
        dependencies: [],
        status: 'PENDING',
      },
      {
        id: uuidv4(),
        stepIndex: 3,
        agentName: 'SAGE',
        description: 'Compute comprehensive Business Health Score and benchmark anomalies.',
        toolName: 'BUSINESS_ANALYTICS',
        suggestedInput: { metrics: ['ALL'] },
        riskLevel: 'LOW',
        dependencies: [1, 2],
        status: 'PENDING',
      },
      {
        id: uuidv4(),
        stepIndex: 4,
        agentName: 'SENTINEL',
        description: 'Audit calculations, verify risk scores, and check strategic validity.',
        riskLevel: 'LOW',
        dependencies: [3],
        status: 'PENDING',
      },
      {
        id: uuidv4(),
        stepIndex: 5,
        agentName: 'ORION',
        description: 'Synthesize holistic Executive Business Health Briefing with prioritized action plan.',
        riskLevel: 'LOW',
        dependencies: [4],
        status: 'PENDING',
      },
    ];

    return {
      goal,
      summary: 'Conduct 360-degree autonomous audit covering operations, inventory depletion, fiscal health, and strategic growth priorities.',
      targetAgents: ['ORION', 'ATLAS', 'NOVA', 'SAGE', 'SENTINEL'],
      steps,
      estimatedTurns: steps.length,
    };
  }
}

export const plannerService = PlannerService.getInstance();
