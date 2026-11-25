import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../database/db.js';
import { config } from '../config/env.js';
import { generateToken, authenticateJWT, AuthRequest } from '../middleware/auth.js';

export const authRoutes = Router();

const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  role: z.enum(['ADMIN', 'MANAGER', 'EMPLOYEE']).optional().default('ADMIN'),
});

const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

const ResetPasswordSchema = z.object({
  email: z.string().email(),
  otp: z.string().length(6),
  new_password: z.string().min(6),
});

authRoutes.post('/register', async (req: Request, res: Response) => {
  const { email, password, full_name, role } = RegisterSchema.parse(req.body);

  const existing = db.getUserByEmail(email);
  if (existing) {
    return res.status(400).json({ error: 'User with this email already exists.' });
  }

  const salt = await bcrypt.genSalt(10);
  const passwordHash = await bcrypt.hash(password, salt);

  const newUser = db.createUser({
    email,
    password_hash: passwordHash,
    full_name,
    role,
  });

  const token = generateToken(newUser);
  res.status(201).json({
    token,
    user: {
      id: newUser.id,
      email: newUser.email,
      full_name: newUser.full_name,
      role: newUser.role,
    },
  });
});

authRoutes.post('/login', async (req: Request, res: Response) => {
  const { email, password } = LoginSchema.parse(req.body);

  const user = db.getUserByEmail(email);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const token = generateToken(user);
  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      full_name: user.full_name,
      role: user.role,
    },
  });
});

authRoutes.post('/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = ForgotPasswordSchema.parse(req.body);

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'No user account found with this email address.' });
    }

    // Generate 6-digit numeric OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    db.saveOtp(email, otp, 15);

    // Dispatch live email via Resend if API key is configured
    let emailDispatched = false;
    if (config.resendApiKey && config.resendApiKey.startsWith('re_')) {
      try {
        const resp = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${config.resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'NEXUS AI <auth@nexus.ai>',
            to: [email],
            subject: 'Your NEXUS AI Password Reset Code',
            html: `
              <div style="font-family: Arial, sans-serif; padding: 24px; background: #0b1120; color: #f8fafc; border-radius: 12px;">
                <h2 style="color: #38bdf8;">NEXUS AI Password Reset</h2>
                <p>Hello ${user.full_name},</p>
                <p>You requested a one-time verification code to reset your account password.</p>
                <div style="margin: 24px 0; padding: 16px; background: #1e293b; border-radius: 8px; text-align: center;">
                  <span style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #38bdf8; font-family: monospace;">${otp}</span>
                </div>
                <p style="color: #94a3b8; font-size: 13px;">This code expires in 15 minutes. If you did not request this, you can safely ignore this email.</p>
              </div>
            `,
          }),
        });
        emailDispatched = resp.ok;
      } catch (err) {
        console.warn('[AUTH] Live email dispatch failed:', err);
      }
    }

    db.createNotification({
      business_id: db.getDemoBusiness()?.id || '',
      title: 'Password Reset OTP Dispatched',
      message: `OTP verification code dispatched to ${email}`,
      type: 'SECURITY',
      is_read: false,
    });

    res.json({
      success: true,
      message: emailDispatched
        ? 'A 6-digit verification code has been dispatched to your email.'
        : 'A 6-digit verification code has been generated.',
      // In development or when email gateway is pending, provide devOtp for instant testing
      devOtp: !emailDispatched ? otp : undefined,
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to process password reset request.' });
  }
});

authRoutes.post('/reset-password', async (req: Request, res: Response) => {
  try {
    const { email, otp, new_password } = ResetPasswordSchema.parse(req.body);

    const isValid = db.verifyOtp(email, otp);
    if (!isValid) {
      return res.status(400).json({ error: 'Invalid or expired verification code. Please request a new one.' });
    }

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(404).json({ error: 'User account not found.' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(new_password, salt);

    db.updateUser(user.id, { password_hash: passwordHash });
    db.clearOtp(email);

    db.logAudit({
      business_id: db.getDemoBusiness()?.id || '',
      user_id: user.id,
      action: 'PASSWORD_RESET',
      entity_type: 'USER',
      entity_id: user.id,
      details: { email },
    });

    res.json({
      success: true,
      message: 'Password has been successfully updated. You can now log in with your new password.',
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Failed to reset password.' });
  }
});

authRoutes.get('/me', authenticateJWT, (req: AuthRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated.' });
  }
  res.json({
    user: {
      id: req.user.id,
      email: req.user.email,
      full_name: req.user.full_name,
      role: req.user.role,
    },
  });
});
