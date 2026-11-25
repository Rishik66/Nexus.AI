import { z } from 'zod';
import { ToolDefinition } from '../types.js';
import { db } from '../../database/db.js';

export const DatabaseSearchInputSchema = z.object({
  entity: z.enum(['products', 'inventory', 'customers', 'suppliers', 'purchase_orders', 'invoices', 'expenses', 'tasks']),
  filter: z.record(z.any()).optional().describe('Filter criteria such as { low_stock: true, status: "OVERDUE", category: "Electronics" }'),
  query: z.string().optional().describe('Free text search query'),
  limit: z.number().optional().default(20),
});

export const DatabaseSearchOutputSchema = z.object({
  entity: z.string(),
  count: z.number(),
  results: z.array(z.any()),
  summary: z.string(),
});

export const databaseSearchTool: ToolDefinition<
  z.infer<typeof DatabaseSearchInputSchema>,
  z.infer<typeof DatabaseSearchOutputSchema>
> = {
  name: 'DATABASE_SEARCH',
  description: 'Search business records including products, inventory, customers, suppliers, purchase orders, invoices, expenses, and operational tasks using safe parameterized criteria.',
  riskLevel: 'LOW',
  inputSchema: DatabaseSearchInputSchema,
  outputSchema: DatabaseSearchOutputSchema,
  geminiFunctionDeclaration: {
    name: 'DATABASE_SEARCH',
    description: 'Query database records safely. Entity must be one of: products, inventory, customers, suppliers, purchase_orders, invoices, expenses, tasks.',
    parameters: {
      type: 'OBJECT',
      properties: {
        entity: {
          type: 'STRING',
          enum: ['products', 'inventory', 'customers', 'suppliers', 'purchase_orders', 'invoices', 'expenses', 'tasks'],
          description: 'The type of business records to search for.',
        },
        filter: {
          type: 'OBJECT',
          description: 'Key-value filters (e.g. { "low_stock": true } or { "status": "OVERDUE" }).',
        },
        query: {
          type: 'STRING',
          description: 'Free text substring search for names, SKUs, or descriptions.',
        },
        limit: {
          type: 'INTEGER',
          description: 'Max records to return (default 20).',
        },
      },
      required: ['entity'],
    },
  },
  execute: async (input, context) => {
    const { businessId } = context;
    let results: any[] = [];
    const limit = input.limit || 20;

    switch (input.entity) {
      case 'products':
        if (input.filter?.low_stock) {
          results = db.getLowStockProducts(businessId);
        } else {
          results = db.getProducts(businessId);
        }
        if (input.filter?.category) {
          results = results.filter(p => p.category.toLowerCase() === input.filter?.category.toLowerCase());
        }
        if (input.query) {
          const q = input.query.toLowerCase();
          results = results.filter(p => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q));
        }
        break;

      case 'inventory':
        results = db.getInventoryMovements(businessId, limit);
        break;

      case 'suppliers':
        results = db.getSuppliers(businessId);
        if (input.query) {
          const q = input.query.toLowerCase();
          results = results.filter(s => s.name.toLowerCase().includes(q) || s.contact_person?.toLowerCase().includes(q));
        }
        break;

      case 'customers':
        results = db.getCustomers(businessId);
        if (input.query) {
          const q = input.query.toLowerCase();
          results = results.filter(c => c.name.toLowerCase().includes(q) || c.company?.toLowerCase().includes(q));
        }
        break;

      case 'purchase_orders':
        results = db.getPurchaseOrders(businessId);
        if (input.filter?.status) {
          results = results.filter(po => po.status.toUpperCase() === input.filter?.status.toUpperCase());
        }
        break;

      case 'invoices':
        if (input.filter?.status === 'OVERDUE') {
          results = db.getOverdueInvoices(businessId);
        } else {
          results = db.getInvoices(businessId);
          if (input.filter?.status) {
            results = results.filter(i => i.status.toUpperCase() === input.filter?.status.toUpperCase());
          }
        }
        break;

      case 'expenses':
        results = db.getExpenses(businessId);
        if (input.filter?.category) {
          results = results.filter(e => e.category.toUpperCase() === input.filter?.category.toUpperCase());
        }
        break;

      case 'tasks':
        results = db.getTasks(businessId);
        if (input.filter?.status) {
          results = results.filter(t => t.status.toUpperCase() === input.filter?.status.toUpperCase());
        }
        break;
    }

    const trimmed = results.slice(0, limit);
    return {
      entity: input.entity,
      count: trimmed.length,
      results: trimmed,
      summary: `Found ${trimmed.length} ${input.entity} records matching criteria.`,
    };
  },
};
