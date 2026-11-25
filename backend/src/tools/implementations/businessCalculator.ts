import { z } from 'zod';
import { ToolDefinition } from '../types.js';

export const BusinessCalculatorInputSchema = z.object({
  operation: z.enum([
    'REORDER_QUANTITY',
    'PROFIT_MARGIN',
    'INVENTORY_VALUATION',
    'TAX_CALCULATION',
    'VARIANCE_PERCENTAGE',
    'BREAK_EVEN',
  ]),
  parameters: z.record(z.any()),
});

export const BusinessCalculatorOutputSchema = z.object({
  operation: z.string(),
  result: z.number(),
  breakdown: z.record(z.any()),
  explanation: z.string(),
});

export const businessCalculatorTool: ToolDefinition<
  z.infer<typeof BusinessCalculatorInputSchema>,
  z.infer<typeof BusinessCalculatorOutputSchema>
> = {
  name: 'BUSINESS_CALCULATOR',
  description: 'Perform deterministic and auditable financial and operational calculations such as reorder quantities, profit margins, tax, inventory valuation, and variance percentages.',
  riskLevel: 'LOW',
  inputSchema: BusinessCalculatorInputSchema,
  outputSchema: BusinessCalculatorOutputSchema,
  geminiFunctionDeclaration: {
    name: 'BUSINESS_CALCULATOR',
    description: 'Execute precise arithmetic and business formulas. Supported operations: REORDER_QUANTITY, PROFIT_MARGIN, INVENTORY_VALUATION, TAX_CALCULATION, VARIANCE_PERCENTAGE, BREAK_EVEN.',
    parameters: {
      type: 'OBJECT',
      properties: {
        operation: {
          type: 'STRING',
          enum: ['REORDER_QUANTITY', 'PROFIT_MARGIN', 'INVENTORY_VALUATION', 'TAX_CALCULATION', 'VARIANCE_PERCENTAGE', 'BREAK_EVEN'],
          description: 'The formula to compute.',
        },
        parameters: {
          type: 'OBJECT',
          description: 'Arguments required for the selected calculation.',
        },
      },
      required: ['operation', 'parameters'],
    },
  },
  execute: async (input) => {
    const { operation, parameters } = input;

    switch (operation) {
      case 'REORDER_QUANTITY': {
        const currentStock = Number(parameters.current_stock || 0);
        const threshold = Number(parameters.reorder_threshold || 10);
        const bufferMultiplier = Number(parameters.buffer_multiplier || 2.0);
        // Formula: Target Level (threshold * buffer) - currentStock
        const targetStock = Math.ceil(threshold * bufferMultiplier);
        const needed = Math.max(0, targetStock - currentStock);
        const unitCost = Number(parameters.unit_cost || 0);
        const totalEstCost = needed * unitCost;

        return {
          operation,
          result: needed,
          breakdown: { currentStock, threshold, targetStock, recommendedUnits: needed, totalEstCost },
          explanation: `Recommended reorder quantity is ${needed} units (target stock: ${targetStock}, current: ${currentStock}). Estimated total cost: $${totalEstCost.toFixed(2)}.`,
        };
      }

      case 'PROFIT_MARGIN': {
        const revenue = Number(parameters.revenue || 0);
        const cost = Number(parameters.cost || 0);
        const grossProfit = revenue - cost;
        const marginPercentage = revenue > 0 ? (grossProfit / revenue) * 100 : 0;

        return {
          operation,
          result: Math.round(marginPercentage * 100) / 100,
          breakdown: { revenue, cost, grossProfit, marginPercentage: Math.round(marginPercentage * 100) / 100 },
          explanation: `Gross profit is $${grossProfit.toFixed(2)} yielding a profit margin of ${marginPercentage.toFixed(2)}%.`,
        };
      }

      case 'INVENTORY_VALUATION': {
        const items = parameters.items || [];
        let totalValuation = 0;
        let totalRetailValue = 0;
        let totalUnits = 0;

        for (const item of items) {
          const qty = Number(item.stock_quantity || 0);
          const cost = Number(item.cost_price || 0);
          const retail = Number(item.unit_price || 0);
          totalUnits += qty;
          totalValuation += qty * cost;
          totalRetailValue += qty * retail;
        }

        return {
          operation,
          result: Math.round(totalValuation * 100) / 100,
          breakdown: { totalUnits, totalCostValuation: totalValuation, totalRetailValue },
          explanation: `Total inventory valuation at cost is $${totalValuation.toFixed(2)} across ${totalUnits} units (retail value: $${totalRetailValue.toFixed(2)}).`,
        };
      }

      case 'TAX_CALCULATION': {
        const subtotal = Number(parameters.subtotal || 0);
        const rate = Number(parameters.tax_rate || 0.08); // default 8%
        const taxAmount = Math.round(subtotal * rate * 100) / 100;
        const total = Math.round((subtotal + taxAmount) * 100) / 100;

        return {
          operation,
          result: taxAmount,
          breakdown: { subtotal, taxRate: rate, taxAmount, totalWithTax: total },
          explanation: `Tax on $${subtotal.toFixed(2)} at ${(rate * 100).toFixed(1)}% is $${taxAmount.toFixed(2)}, total: $${total.toFixed(2)}.`,
        };
      }

      case 'VARIANCE_PERCENTAGE': {
        const baseline = Number(parameters.baseline || 0);
        const current = Number(parameters.current || 0);
        const diff = current - baseline;
        const pctChange = baseline !== 0 ? (diff / baseline) * 100 : 0;

        return {
          operation,
          result: Math.round(pctChange * 100) / 100,
          breakdown: { baseline, current, difference: diff, percentChange: Math.round(pctChange * 100) / 100 },
          explanation: `Change from baseline ($${baseline}) to current ($${current}) is ${pctChange >= 0 ? '+' : ''}${pctChange.toFixed(2)}% ($${diff.toFixed(2)}).`,
        };
      }

      case 'BREAK_EVEN': {
        const fixedCosts = Number(parameters.fixed_costs || 0);
        const unitPrice = Number(parameters.unit_price || 0);
        const variableCostPerUnit = Number(parameters.variable_cost_per_unit || 0);
        const contributionMargin = unitPrice - variableCostPerUnit;
        const unitsNeeded = contributionMargin > 0 ? Math.ceil(fixedCosts / contributionMargin) : 0;

        return {
          operation,
          result: unitsNeeded,
          breakdown: { fixedCosts, unitPrice, variableCostPerUnit, contributionMargin, unitsNeeded },
          explanation: `Break-even volume is ${unitsNeeded} units with a unit contribution margin of $${contributionMargin.toFixed(2)}.`,
        };
      }

      default:
        throw new Error(`Unsupported business calculator operation: ${operation}`);
    }
  },
};
