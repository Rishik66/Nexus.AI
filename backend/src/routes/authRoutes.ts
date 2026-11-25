import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import { z } from 'zod';
import { db } from '../database/db.js';
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
