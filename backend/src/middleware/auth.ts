import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config/env.js';
import { db } from '../database/db.js';
import { User, UserRole } from '../database/types.js';

export interface AuthRequest extends Request {
  user?: User;
  businessId?: string;
}

export function generateToken(user: User): string {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // If in demo mode and no header provided, attach default demo admin for ease of testing
    if (config.demoMode) {
      const demoUser = db.getUserByEmail('admin@nexus.ai');
      if (demoUser) {
        req.user = demoUser;
        const biz = db.getDemoBusiness();
        if (biz) req.businessId = biz.id;
        return next();
      }
    }
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as { id: string; email: string; role: UserRole };
    const user = db.getUserById(payload.id);
    if (!user) {
      return res.status(401).json({ error: 'User not found or session expired.' });
    }
    req.user = user;
    const biz = db.getDemoBusiness();
    if (biz) req.businessId = biz.id;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token.' });
  }
}

export function requireRole(allowedRoles: UserRole[]) {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized.' });
    }
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access denied. Role ${req.user.role} is not permitted for this operation. Required: ${allowedRoles.join(', ')}`,
      });
    }
    next();
  };
}
