import { z } from 'zod';
import { ToolDefinition } from '../types.js';
import { db } from '../../database/db.js';

export const DatabaseUpdateInputSchema = z.object({
  action: z.enum([
    'CREATE_TASK',
    'ADJUST_INVENTORY',
    'CREATE_PURCHASE_ORDER_DRAFT',
    'UPDATE_INVOICE_STATUS',
    'UPDATE_PRODUCT_STOCK',
  ]),
  payload: z.record(z.any()),
  reason: z.string().describe('Business rationale for mutation'),
});

export const DatabaseUpdateOutputSchema = z.object({
  success: z.boolean(),
  action: z.string(),
  affectedId: z.string().optional(),
  message: z.string(),
  data: z.any().optional(),
});

export const databaseUpdateTool: ToolDefinition<
  z.infer<typeof DatabaseUpdateInputSchema>,
  z.infer<typeof DatabaseUpdateOutputSchema>
> = {
  name: 'DATABASE_UPDATE',
  description: 'Create or update business records such as creating operational tasks, adjusting inventory levels, generating purchase order drafts, or updating invoice records.',
  riskLevel: 'MEDIUM', // Requires approval for state mutations
  inputSchema: DatabaseUpdateInputSchema,
  outputSchema: DatabaseUpdateOutputSchema,
  geminiFunctionDeclaration: {
    name: 'DATABASE_UPDATE',
    description: 'Execute state mutations in the business database. Operations include CREATE_TASK, ADJUST_INVENTORY, CREATE_PURCHASE_ORDER_DRAFT, UPDATE_INVOICE_STATUS, UPDATE_PRODUCT_STOCK.',
    parameters: {
      type: 'OBJECT',
      properties: {
        action: {
          type: 'STRING',
          enum: ['CREATE_TASK', 'ADJUST_INVENTORY', 'CREATE_PURCHASE_ORDER_DRAFT', 'UPDATE_INVOICE_STATUS', 'UPDATE_PRODUCT_STOCK'],
          description: 'The mutation action to perform.',
        },
        payload: {
          type: 'OBJECT',
          description: 'Data payload for the mutation.',
        },
        reason: {
          type: 'STRING',
          description: 'Clear business rationale for this update.',
        },
      },
      required: ['action', 'payload', 'reason'],
    },
  },
  execute: async (input, context) => {
    const { businessId, agentName, userId } = context;

    switch (input.action) {
      case 'CREATE_TASK': {
        const task = db.createTask({
          business_id: businessId,
          title: input.payload.title || 'Agent-generated Operational Task',
          description: input.payload.description,
          assigned_to: input.payload.assigned_to || 'Operations Team',
          priority: input.payload.priority || 'MEDIUM',
          status: 'PENDING',
          due_date: input.payload.due_date,
          created_by_agent: agentName,
        });

        db.logAudit({
          business_id: businessId,
          user_id: userId,
          agent_name: agentName,
          action: 'CREATE_TASK',
          entity_type: 'TASK',
          entity_id: task.id,
          details: { title: task.title, assigned_to: task.assigned_to, reason: input.reason },
        });

        return {
          success: true,
          action: input.action,
          affectedId: task.id,
          message: `Operational task "${task.title}" created successfully.`,
          data: task,
        };
      }

      case 'ADJUST_INVENTORY': {
        const { product_id, quantity, reason } = input.payload;
        const product = db.getProductById(product_id);
        if (!product) {
          throw new Error(`Product with ID ${product_id} not found.`);
        }
        const prev = product.stock_quantity;
        const next = Math.max(0, prev + Number(quantity));
        db.updateProduct(product_id, { stock_quantity: next });

        const movement = db.recordInventoryMovement({
          business_id: businessId,
          product_id,
          type: quantity >= 0 ? 'ADJUSTMENT' : 'SALE',
          quantity: Number(quantity),
          previous_quantity: prev,
          new_quantity: next,
          reason: reason || input.reason,
          reference_id: `ADJ-${Date.now()}`,
        });

        db.logAudit({
          business_id: businessId,
          user_id: userId,
          agent_name: agentName,
          action: 'ADJUST_INVENTORY',
          entity_type: 'PRODUCT',
          entity_id: product.id,
          details: { sku: product.sku, prev, next, quantity, reason: input.reason },
        });

        return {
          success: true,
          action: input.action,
          affectedId: movement.id,
          message: `Inventory for ${product.name} adjusted from ${prev} to ${next} units.`,
          data: movement,
        };
      }

      case 'CREATE_PURCHASE_ORDER_DRAFT': {
        const { supplier_id, items, notes } = input.payload;
        const supplier = db.getSupplierById(supplier_id);
        if (!supplier) {
          throw new Error(`Supplier with ID ${supplier_id} not found.`);
        }

        const orderNum = `PO-${Date.now().toString().slice(-6)}`;
        let total = 0;
        const formattedItems = (items || []).map((item: any) => {
          const cost = Number(item.quantity) * Number(item.unit_cost);
          total += cost;
          return {
            product_id: item.product_id,
            quantity: Number(item.quantity),
            unit_cost: Number(item.unit_cost),
            total_cost: cost,
          };
        });

        const po = db.createPurchaseOrder(
          {
            business_id: businessId,
            supplier_id,
            order_number: orderNum,
            status: 'DRAFT',
            total_amount: total,
            notes: notes || `Restock draft generated by ${agentName}. Reason: ${input.reason}`,
            created_by: agentName,
          },
          formattedItems
        );

        db.logAudit({
          business_id: businessId,
          user_id: userId,
          agent_name: agentName,
          action: 'CREATE_PURCHASE_ORDER_DRAFT',
          entity_type: 'PURCHASE_ORDER',
          entity_id: po.id,
          details: { order_number: po.order_number, total_amount: po.total_amount, supplier: supplier.name },
        });

        return {
          success: true,
          action: input.action,
          affectedId: po.id,
          message: `Purchase Order draft ${po.order_number} created for ${supplier.name} totaling $${total.toFixed(2)}.`,
          data: po,
        };
      }

      case 'UPDATE_INVOICE_STATUS': {
        const { invoice_id, status } = input.payload;
        const updated = db.updateInvoiceStatus(invoice_id, status);
        if (!updated) {
          throw new Error(`Invoice ${invoice_id} not found.`);
        }

        db.logAudit({
          business_id: businessId,
          user_id: userId,
          agent_name: agentName,
          action: 'UPDATE_INVOICE_STATUS',
          entity_type: 'INVOICE',
          entity_id: invoice_id,
          details: { status, reason: input.reason },
        });

        return {
          success: true,
          action: input.action,
          affectedId: invoice_id,
          message: `Invoice ${updated.invoice_number} status updated to ${status}.`,
          data: updated,
        };
      }

      case 'UPDATE_PRODUCT_STOCK': {
        const { product_id, stock_quantity } = input.payload;
        const updated = db.updateProduct(product_id, { stock_quantity: Number(stock_quantity) });
        if (!updated) {
          throw new Error(`Product ${product_id} not found.`);
        }

        return {
          success: true,
          action: input.action,
          affectedId: product_id,
          message: `Product ${updated.name} stock level updated to ${stock_quantity}.`,
          data: updated,
        };
      }

      default:
        throw new Error(`Unsupported database mutation action: ${input.action}`);
    }
  },
};
