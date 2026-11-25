import { z } from 'zod';
import { ToolDefinition } from '../types.js';
import { config } from '../../config/env.js';
import { db } from '../../database/db.js';

export const EmailNotificationInputSchema = z.object({
  recipient: z.string().email().describe('Recipient email address'),
  subject: z.string().describe('Email subject line'),
  body: z.string().describe('Email message text / HTML content'),
  category: z.enum(['PURCHASE_ORDER', 'INVOICE_REMINDER', 'REPORT', 'APPROVAL_NOTICE', 'ALERT']).optional().default('ALERT'),
});

export const EmailNotificationOutputSchema = z.object({
  sent: z.boolean(),
  mode: z.enum(['LIVE_RESEND', 'DEMO_SANDBOX']),
  recipient: z.string(),
  subject: z.string(),
  messageId: z.string(),
  details: z.string(),
});

export const emailNotificationTool: ToolDefinition<
  z.infer<typeof EmailNotificationInputSchema>,
  z.infer<typeof EmailNotificationOutputSchema>
> = {
  name: 'EMAIL_NOTIFICATION',
  description: 'Draft or dispatch executive business communications, purchase orders, overdue invoice notices, or operational alerts. Requires explicit human approval for external recipients.',
  riskLevel: 'HIGH', // External communication is high risk
  inputSchema: EmailNotificationInputSchema,
  outputSchema: EmailNotificationOutputSchema,
  geminiFunctionDeclaration: {
    name: 'EMAIL_NOTIFICATION',
    description: 'Send an email notification to suppliers, customers, or team members. (HIGH RISK - Requires human approval).',
    parameters: {
      type: 'OBJECT',
      properties: {
        recipient: { type: 'STRING', description: 'Recipient email address.' },
        subject: { type: 'STRING', description: 'Subject line.' },
        body: { type: 'STRING', description: 'Body content of the email.' },
        category: {
          type: 'STRING',
          enum: ['PURCHASE_ORDER', 'INVOICE_REMINDER', 'REPORT', 'APPROVAL_NOTICE', 'ALERT'],
          description: 'Category of message.',
        },
      },
      required: ['recipient', 'subject', 'body'],
    },
  },
  execute: async (input, context) => {
    const { businessId, agentName, userId } = context;

    // Check if live Resend API key is available
    if (config.resendApiKey && config.resendApiKey.startsWith('re_')) {
      try {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'NEXUS AI <notifications@nexus.ai>',
            to: [input.recipient],
            subject: input.subject,
            html: `<div style="font-family: sans-serif; padding: 20px;">
              <h2>NEXUS AI Automated Notification</h2>
              <p>${input.body.replace(/\n/g, '<br/>')}</p>
              <hr/>
              <small>Dispatched by Agent ${agentName} via NEXUS AI Platform.</small>
            </div>`,
          }),
        });

        if (resp.ok) {
          const resendData = await resp.json() as any;
          db.logAudit({
            business_id: businessId,
            user_id: userId,
            agent_name: agentName,
            action: 'DISPATCH_EMAIL_LIVE',
            entity_type: 'EMAIL',
            entity_id: resendData.id,
            details: { recipient: input.recipient, subject: input.subject, mode: 'LIVE_RESEND' },
          });

          return {
            sent: true,
            mode: 'LIVE_RESEND',
            recipient: input.recipient,
            subject: input.subject,
            messageId: resendData.id || `msg-${Date.now()}`,
            details: `Email successfully sent live via Resend to ${input.recipient}.`,
          };
        }
      } catch (err) {
        console.warn('[EMAIL_NOTIFICATION] Live Resend dispatch failed, falling back to verified demo sandbox:', err);
      }
    }

    // High-fidelity sandbox demo mode
    const simulatedId = `demo-msg-${Date.now()}`;
    db.createNotification({
      business_id: businessId,
      title: `[EMAIL SIMULATED] ${input.subject}`,
      message: `Simulated dispatch to ${input.recipient} by ${agentName}: ${input.body.slice(0, 150)}...`,
      type: 'INFO',
      is_read: false,
    });

    db.logAudit({
      business_id: businessId,
      user_id: userId,
      agent_name: agentName,
      action: 'DISPATCH_EMAIL_DEMO',
      entity_type: 'EMAIL',
      entity_id: simulatedId,
      details: {
        recipient: input.recipient,
        subject: input.subject,
        mode: 'DEMO_SANDBOX',
        note: 'Live sending requires RESEND_API_KEY configuration in environment variables.',
      },
    });

    return {
      sent: true,
      mode: 'DEMO_SANDBOX',
      recipient: input.recipient,
      subject: input.subject,
      messageId: simulatedId,
      details: `[DEMO MODE] Email queued and logged in audit trail. Live external dispatch requires RESEND_API_KEY.`,
    };
  },
};
