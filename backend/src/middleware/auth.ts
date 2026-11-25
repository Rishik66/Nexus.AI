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
    { id: user.id, email: user.email, role: user.role, business_id: user.business_id },
    config.jwtSecret,
    { expiresIn: '7d' }
  );
}

export function authenticateJWT(req: AuthRequest, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Authentication required. Missing Bearer token.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const payload = jwt.verify(token, config.jwtSecret) as {
      id: string;
      email: string;
      role: UserRole;
      business_id?: string;
    };
    let user = db.getUserById(payload.id);
    if (!user) {
      // Reconstruct user from cryptographically verified JWT payload (crucial for serverless containers)
      const namePart = (payload.email || 'User').split('@')[0];
      const displayName = namePart.charAt(0).toUpperCase() + namePart.slice(1);
      const bizId = payload.business_id || db.getDemoBusiness()?.id || 'default-biz';

      user = {
        id: payload.id,
        business_id: bizId,
        email: payload.email,
        full_name: displayName,
        role: payload.role || 'ADMIN',
        password_hash: '',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
      db.getStore().users.push(user);

      if (!db.getBusinessById(bizId)) {
        db.getStore().businesses.push({
          id: bizId,
          name: `${displayName}'s Enterprise`,
          type: 'TECHNOLOGY',
          currency: 'USD',
          is_demo: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });
      }
    }
    req.user = user;
    // Strictly isolate by user's assigned company tenant
    req.businessId = user.business_id || payload.business_id || db.getDemoBusiness()?.id;

    if (!req.businessId) {
      return res.status(403).json({ error: 'User is not associated with any organization.' });
    }

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
