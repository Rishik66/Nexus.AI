import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import { db } from '../database/db.js';
import { toolRegistry } from '../tools/registry.js';
import { plannerService } from '../orchestrator/planner.js';
import { agentEngine } from '../orchestrator/engine.js';

describe('NEXUS AI Enterprise Multi-Agent Subsystem Tests', () => {
  let adminToken: string;
  let employeeToken: string;
  let demoBizId: string;

  beforeAll(async () => {
    const biz = db.getDemoBusiness();
    demoBizId = biz?.id || '';

    // Login Admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@nexus.ai', password: 'nexus123' });
    expect(adminRes.status).toBe(200);
    adminToken = adminRes.body.token;

    // Login Employee
    const empRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'employee@nexus.ai', password: 'nexus123' });
    expect(empRes.status).toBe(200);
    employeeToken = empRes.body.token;
  });

  describe('1. Authentication & Role-Based Access Control', () => {
    it('should verify health check endpoint', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('HEALTHY');
      expect(res.body.service).toContain('NEXUS AI');
    });

    it('should authenticate admin and return user profile with ADMIN role', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);
      expect(res.status).toBe(200);
      expect(res.body.user.role).toBe('ADMIN');
      expect(res.body.user.email).toBe('admin@nexus.ai');
    });

    it('should allow admin to create a new product', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          sku: 'TST-999',
          name: 'Test Industrial Sensor',
          category: 'Electronics',
          unit_price: 150.0,
          cost_price: 75.0,
          stock_quantity: 20,
          reorder_threshold: 5,
        });
      expect(res.status).toBe(201);
      expect(res.body.product.sku).toBe('TST-999');
    });

    it('should forbid employee from performing admin-restricted product creation', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${employeeToken}`)
        .send({
          sku: 'FORBIDDEN-01',
          name: 'Unauthorized Product',
          category: 'Electronics',
          unit_price: 100.0,
          cost_price: 50.0,
          stock_quantity: 10,
          reorder_threshold: 2,
        });
      expect(res.status).toBe(403);
      expect(res.body.error).toContain('Access denied');
    });
  });

  describe('2. Real Tool Registry & Deterministic Execution', () => {
    it('should have all 7 enterprise tools registered', () => {
      const tools = toolRegistry.getAllTools();
      expect(tools.length).toBe(7);
      const names = tools.map(t => t.name);
      expect(names).toContain('DATABASE_SEARCH');
      expect(names).toContain('DATABASE_UPDATE');
      expect(names).toContain('BUSINESS_CALCULATOR');
      expect(names).toContain('CURRENCY_CONVERSION');
      expect(names).toContain('EMAIL_NOTIFICATION');
      expect(names).toContain('DOCUMENT_ANALYSIS');
      expect(names).toContain('BUSINESS_ANALYTICS');
    });

    it('should execute DATABASE_SEARCH safely and identify low-stock products', async () => {
      const result = await toolRegistry.executeTool(
        'DATABASE_SEARCH',
        { entity: 'products', filter: { low_stock: true } },
        { businessId: demoBizId, agentName: 'ATLAS' }
      );
      expect(result.success).toBe(true);
      expect(result.output.count).toBeGreaterThan(0);
      expect(result.output.results.some((p: any) => p.stock_quantity <= p.reorder_threshold)).toBe(true);
    });

    it('should execute BUSINESS_CALCULATOR with deterministic reorder arithmetic', async () => {
      const result = await toolRegistry.executeTool(
        'BUSINESS_CALCULATOR',
        {
          operation: 'REORDER_QUANTITY',
          parameters: { current_stock: 4, reorder_threshold: 15, unit_cost: 95.0, buffer_multiplier: 2.0 },
        },
        { businessId: demoBizId, agentName: 'ATLAS' }
      );
      expect(result.success).toBe(true);
      expect(result.output.result).toBe(26); // target = 30, current = 4, needed = 26
      expect(result.output.breakdown.totalEstCost).toBe(2470);
    });

    it('should execute BUSINESS_ANALYTICS and compute Business Health Score and anomalies', async () => {
      const result = await toolRegistry.executeTool(
        'BUSINESS_ANALYTICS',
        { metrics: ['ALL'] },
        { businessId: demoBizId, agentName: 'SAGE' }
      );
      expect(result.success).toBe(true);
      expect(result.output.businessHealthScore).toBeGreaterThan(0);
      expect(result.output.businessHealthScore).toBeLessThanOrEqual(100);
      expect(result.output.metrics.totalRevenue).toBeGreaterThan(0);
      expect(result.output.anomaliesDetected.length).toBeGreaterThan(0);
    });

    it('should execute CURRENCY_CONVERSION with live or resilient fallback rates', async () => {
      const result = await toolRegistry.executeTool(
        'CURRENCY_CONVERSION',
        { amount: 100, from: 'USD', to: 'EUR' },
        { businessId: demoBizId, agentName: 'NOVA' }
      );
      expect(result.success).toBe(true);
      expect(result.output.convertedAmount).toBeGreaterThan(0);
      expect(result.output.from).toBe('USD');
      expect(result.output.to).toBe('EUR');
    });
  });

  describe('3. Planner & Multi-Agent Orchestration', () => {
    it('ORION should generate structured multi-step plan for low-stock restocking', async () => {
      const plan = await plannerService.generatePlan(
        'Find products that are running low on stock and prepare restocking orders',
        demoBizId
      );
      expect(plan.steps.length).toBeGreaterThanOrEqual(4);
      expect(plan.targetAgents).toContain('ATLAS');
      expect(plan.targetAgents).toContain('SENTINEL');
      // At least one step must have MEDIUM risk requiring approval
      expect(plan.steps.some(s => s.riskLevel === 'MEDIUM')).toBe(true);
    });

    it('ORION should generate structured multi-step plan for expense analysis', async () => {
      const plan = await plannerService.generatePlan(
        'Analyze my expenses and identify unnecessary spending anomalies',
        demoBizId
      );
      expect(plan.steps.length).toBeGreaterThanOrEqual(4);
      expect(plan.targetAgents).toContain('NOVA');
      expect(plan.steps.some(s => s.toolName === 'DATABASE_SEARCH')).toBe(true);
    });
  });

  describe('4. Human-In-The-Loop Safety Gate & Stop Control', () => {
    it('should pause execution at WAITING_APPROVAL when encountering a MEDIUM risk step', async () => {
      // Create a test run with a medium risk step
      const run = db.createAgentRun({
        business_id: demoBizId,
        goal: 'Restock test low-stock items with approval gate',
        status: 'PLANNING',
        current_agent: 'ORION',
        plan: {
          steps: [
            {
              stepIndex: 1,
              agentName: 'ATLAS',
              description: 'Audit inventory levels',
              toolName: 'DATABASE_SEARCH',
              suggestedInput: { entity: 'products', filter: { low_stock: true } },
              riskLevel: 'LOW',
              dependencies: [],
              status: 'PENDING',
            },
            {
              stepIndex: 2,
              agentName: 'SENTINEL',
              description: 'Approve purchase order generation',
              riskLevel: 'MEDIUM',
              dependencies: [1],
              status: 'PENDING',
            },
          ],
        },
      });

      // Start execution
      await agentEngine.startExecution(run.id);

      // Verify run status paused at WAITING_APPROVAL
      const updatedRun = db.getAgentRunById(run.id);
      expect(updatedRun?.status).toBe('WAITING_APPROVAL');

      // Verify approval record was created in DB
      const pendingApprovals = db.getPendingApprovals(demoBizId);
      const linkedApproval = pendingApprovals.find(a => a.run_id === run.id);
      expect(linkedApproval).toBeDefined();
      expect(linkedApproval?.risk_level).toBe('MEDIUM');

      // Now simulate Human Approval
      await agentEngine.resumeExecution(run.id, linkedApproval!.id, 'APPROVED', 'Approved by Operations Director');

      // Verify run completed after approval
      const completedRun = db.getAgentRunById(run.id);
      expect(completedRun?.status).toBe('COMPLETED');
    });

    it('STOP EXECUTION control should halt running agent immediately', async () => {
      const run = db.createAgentRun({
        business_id: demoBizId,
        goal: 'Long running simulation to test stop control',
        status: 'PLANNING',
        current_agent: 'ORION',
        plan: {
          steps: [
            {
              stepIndex: 1,
              agentName: 'ATLAS',
              description: 'Step 1 audit',
              toolName: 'DATABASE_SEARCH',
              suggestedInput: { entity: 'products' },
              riskLevel: 'LOW',
              dependencies: [],
              status: 'PENDING',
            },
            {
              stepIndex: 2,
              agentName: 'NOVA',
              description: 'Step 2 calculations',
              toolName: 'BUSINESS_CALCULATOR',
              suggestedInput: { operation: 'PROFIT_MARGIN', parameters: { revenue: 1000, cost: 500 } },
              riskLevel: 'LOW',
              dependencies: [1],
              status: 'PENDING',
            },
          ],
        },
      });

      agentEngine.stopExecution(run.id, 'Alexandra Vance');
      const stoppedRun = db.getAgentRunById(run.id);
      expect(stoppedRun?.status).toBe('STOPPED');
      expect(stoppedRun?.results?.message).toContain('stopped');
    });
  });

  describe('5. Multimodal Document Intelligence', () => {
    it('should parse invoice document data and return structured fields', async () => {
      const result = await toolRegistry.executeTool(
        'DOCUMENT_ANALYSIS',
        { fileName: 'Supplier_Invoice_TechSupply.pdf', documentType: 'INVOICE' },
        { businessId: demoBizId, agentName: 'SAGE' }
      );
      expect(result.success).toBe(true);
      expect(result.output.extractedData.documentNumber).toBeDefined();
      expect(result.output.extractedData.totalAmount).toBeGreaterThan(0);
      expect(result.output.extractedData.items.length).toBeGreaterThan(0);
      expect(result.output.confidenceScore).toBeGreaterThan(0.9);
    });
  });
});
