import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export interface EmailDispatchResult {
  success: boolean;
  provider?: string;
  messageId?: string;
  error?: string;
}

export class EmailService {
  private static instance: EmailService;

  private constructor() {}

  public static getInstance(): EmailService {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  public async sendEmail(options: SendEmailOptions): Promise<EmailDispatchResult> {
    const { to, subject, html, text } = options;

    // 1. Try Resend if API key is provided
    if (config.resendApiKey && config.resendApiKey.startsWith('re_')) {
      try {
        const fromAddress = config.resendFromEmail || 'NEXUS AI <onboarding@resend.dev>';
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [to],
            subject,
            html,
            text: text || html.replace(/<[^>]*>?/gm, ''),
          }),
        });

        if (resp.ok) {
          const data = (await resp.json()) as any;
          return {
            success: true,
            provider: 'RESEND',
            messageId: data.id,
          };
        } else {
          const errData = await resp.text();
          console.warn('[EMAIL] Resend API error response:', errData);
        }
      } catch (err: any) {
        console.warn('[EMAIL] Failed sending via Resend API:', err.message);
      }
    }

    // 2. Try SMTP if configured (e.g. Gmail App Password, Brevo, Outlook, etc.)
    if (config.smtpHost && config.smtpUser && config.smtpPass) {
      try {
        const transporter = nodemailer.createTransport({
          host: config.smtpHost,
          port: config.smtpPort || 587,
          secure: config.smtpSecure || config.smtpPort === 465,
          auth: {
            user: config.smtpUser,
            pass: config.smtpPass,
          },
        });

        const info = await transporter.sendMail({
          from: config.smtpFrom || `"NEXUS AI" <${config.smtpUser}>`,
          to,
          subject,
          text: text || html.replace(/<[^>]*>?/gm, ''),
          html,
        });

        return {
          success: true,
          provider: 'SMTP',
          messageId: info.messageId,
        };
      } catch (err: any) {
        console.warn('[EMAIL] Failed sending via SMTP:', err.message);
        return {
          success: false,
          error: `SMTP dispatch failed: ${err.message}`,
        };
      }
    }

    // 3. Neither is configured
    return {
      success: false,
      error:
        'No live email provider is configured. Please provide RESEND_API_KEY or SMTP credentials (SMTP_HOST, SMTP_USER, SMTP_PASS) in backend/.env to send emails to users.',
    };
  }
}

export const emailService = EmailService.getInstance();
