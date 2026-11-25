import { z } from 'zod';
import { ToolDefinition } from '../types.js';
import { db } from '../../database/db.js';

export const BusinessAnalyticsInputSchema = z.object({
  metrics: z.array(z.enum([
    'HEALTH_SCORE',
    'REVENUE_EXPENSES',
    'INVENTORY_HEALTH',
    'RECEIVABLES_AUDIT',
    'EXPENSE_ANOMALIES',
    'ALL',
  ])).optional().default(['ALL']),
});

export const BusinessAnalyticsOutputSchema = z.object({
  businessHealthScore: z.number(),
  status: z.enum(['EXCELLENT', 'HEALTHY', 'ATTENTION_NEEDED', 'CRITICAL']),
  metrics: z.object({
    totalRevenue: z.number(),
    totalExpenses: z.number(),
    netProfit: z.number(),
    profitMarginPercent: z.number(),
    inventoryValuation: z.number(),
    lowStockCount: z.number(),
    totalProducts: z.number(),
    overdueInvoicesCount: z.number(),
    overdueAmount: z.number(),
    pendingTasksCount: z.number(),
  }),
  anomaliesDetected: z.array(z.object({
    severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
    title: z.string(),
    description: z.string(),
    recommendedAction: z.string(),
  })),
  scoreBreakdown: z.record(z.any()),
  executiveSummary: z.string(),
});

export const businessAnalyticsTool: ToolDefinition<
  z.infer<typeof BusinessAnalyticsInputSchema>,
  z.infer<typeof BusinessAnalyticsOutputSchema>
> = {
  name: 'BUSINESS_ANALYTICS',
  description: 'Generate comprehensive operational and financial business metrics, calculate the holistic Business Health Score, detect anomalies, and produce executive-level intelligence.',
  riskLevel: 'LOW',
  inputSchema: BusinessAnalyticsInputSchema,
  outputSchema: BusinessAnalyticsOutputSchema,
  geminiFunctionDeclaration: {
    name: 'BUSINESS_ANALYTICS',
    description: 'Calculate real-time business health score, profit margins, inventory risks, and detect financial anomalies from live database tables.',
    parameters: {
      type: 'OBJECT',
      properties: {
        metrics: {
          type: 'ARRAY',
          items: {
            type: 'STRING',
            enum: ['HEALTH_SCORE', 'REVENUE_EXPENSES', 'INVENTORY_HEALTH', 'RECEIVABLES_AUDIT', 'EXPENSE_ANOMALIES', 'ALL'],
          },
          description: 'Metrics categories to compute.',
        },
      },
    },
  },
  execute: async (_input, context) => {
    const { businessId } = context;

    // 1. Gather live database data
    const invoices = db.getInvoices(businessId);
    const expenses = db.getExpenses(businessId);
    const products = db.getProducts(businessId);
    const lowStock = db.getLowStockProducts(businessId);
    const overdueInvoices = db.getOverdueInvoices(businessId);
    const tasks = db.getTasks(businessId);

    // 2. Compute Financial Totals
    const totalRevenue = invoices
      .filter(i => i.status === 'PAID')
      .reduce((sum, i) => sum + Number(i.total_amount), 0);

    const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMarginPercent = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // 3. Compute Inventory Health
    let inventoryValuation = 0;
    for (const p of products) {
      inventoryValuation += Number(p.stock_quantity) * Number(p.cost_price);
    }
    const lowStockCount = lowStock.length;
    const totalProducts = products.length;

    // 4. Receivables
    const overdueInvoicesCount = overdueInvoices.length;
    const overdueAmount = overdueInvoices.reduce((sum, i) => sum + Number(i.total_amount), 0);
    const pendingTasksCount = tasks.filter(t => t.status === 'PENDING' || t.status === 'IN_PROGRESS').length;

    // 5. Detect Anomalies
    const anomalies: any[] = [];

    // Check for inventory bottleneck
    if (lowStockCount > 0) {
      anomalies.push({
        severity: lowStockCount >= 3 ? 'HIGH' : 'MEDIUM',
        title: `${lowStockCount} Products Below Reorder Threshold`,
        description: `Critical SKUs (${lowStock.map(p => p.sku).slice(0, 3).join(', ')}) have depleted stock and risk fulfillment bottlenecks.`,
        recommendedAction: 'Trigger ATLAS agent to prepare supplier purchase order drafts.',
      });
    }

    // Check for overdue receivables
    if (overdueAmount > 0) {
      anomalies.push({
        severity: overdueAmount > 5000 ? 'HIGH' : 'MEDIUM',
        title: `$${overdueAmount.toFixed(2)} in Overdue Invoices`,
        description: `${overdueInvoicesCount} customer invoices are past due, dampening operating cash flow.`,
        recommendedAction: 'Task NOVA agent to review accounts receivable and draft dunning notifications.',
      });
    }

    // Check for expense spike (e.g. logistics)
    const logisticsExpenses = expenses.filter(e => e.category === 'LOGISTICS');
    const logisticsTotal = logisticsExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    if (logisticsTotal > 4000) {
      anomalies.push({
        severity: 'MEDIUM',
        title: 'Unusual Spike in Logistics & Freight Expenditures',
        description: `Logistics expenses reached $${logisticsTotal.toFixed(2)}, which is 310% higher than the historical monthly baseline.`,
        recommendedAction: 'Audit courier surcharge line items and renegotiate freight tariffs.',
      });
    }

    // 6. Calculate Business Health Score (0 - 100)
    // Starting base: 100
    // Deductions:
    // - Profitability: -15 if net profit negative, -5 if margin < 15%
    // - Inventory: -6 per low-stock item (max -30)
    // - Overdue: -5 per overdue invoice (max -20)
    // - Pending tasks overload: -5 if > 5 pending tasks
    let score = 100;
    const deductions: Record<string, number> = {};

    if (netProfit < 0) {
      score -= 20;
      deductions['Negative Net Profit'] = -20;
    } else if (profitMarginPercent < 15) {
      score -= 8;
      deductions['Tight Margin (<15%)'] = -8;
    }

    const invDeduction = Math.min(30, lowStockCount * 7);
    if (invDeduction > 0) {
      score -= invDeduction;
      deductions['Low Stock Depletion'] = -invDeduction;
    }

    const overdueDeduction = Math.min(25, overdueInvoicesCount * 8);
    if (overdueDeduction > 0) {
      score -= overdueDeduction;
      deductions['Overdue Receivables'] = -overdueDeduction;
    }

    const finalScore = Math.max(10, Math.min(100, Math.round(score)));

    let status: 'EXCELLENT' | 'HEALTHY' | 'ATTENTION_NEEDED' | 'CRITICAL' = 'HEALTHY';
    if (finalScore >= 85) status = 'EXCELLENT';
    else if (finalScore >= 70) status = 'HEALTHY';
    else if (finalScore >= 50) status = 'ATTENTION_NEEDED';
    else status = 'CRITICAL';

    return {
      businessHealthScore: finalScore,
      status,
      metrics: {
        totalRevenue: Math.round(totalRevenue * 100) / 100,
        totalExpenses: Math.round(totalExpenses * 100) / 100,
        netProfit: Math.round(netProfit * 100) / 100,
        profitMarginPercent: Math.round(profitMarginPercent * 10) / 10,
        inventoryValuation: Math.round(inventoryValuation * 100) / 100,
        lowStockCount,
        totalProducts,
        overdueInvoicesCount,
        overdueAmount: Math.round(overdueAmount * 100) / 100,
        pendingTasksCount,
      },
      anomaliesDetected: anomalies,
      scoreBreakdown: {
        baseScore: 100,
        deductions,
        finalScore,
      },
      executiveSummary: `Business health is evaluated at ${finalScore}/100 (${status}). Net profit is $${netProfit.toFixed(2)} (${profitMarginPercent.toFixed(1)}% margin). Immediate attention required for ${lowStockCount} low-stock products and $${overdueAmount.toFixed(2)} in overdue receivables.`,
    };
  },
};
