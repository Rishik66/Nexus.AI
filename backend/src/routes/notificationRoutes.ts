import { Router, Response } from 'express';
import { db } from '../database/db.js';
import { authenticateJWT, AuthRequest } from '../middleware/auth.js';

export const notificationRoutes = Router();

notificationRoutes.get('/', authenticateJWT, (req: AuthRequest, res: Response) => {
  const businessId = req.businessId || db.getDemoBusiness()?.id || '';
  const notifications = db.getNotifications(businessId);
  const unreadCount = notifications.filter(n => !n.is_read).length;
  res.json({ notifications, unreadCount });
});

notificationRoutes.patch('/:id/read', authenticateJWT, (req: AuthRequest, res: Response) => {
  const success = db.markNotificationAsRead(req.params.id);
  res.json({ success });
});
