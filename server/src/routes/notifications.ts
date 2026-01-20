import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { listNotifications, markNotificationAsRead } from '../services/notificationService.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - List notifications
router.get('/', (req: AuthRequest, res) => {
  const notifications = listNotifications(req.user!.id);

  res.json({
    success: true,
    data: notifications,
  });
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', (req: AuthRequest, res, next) => {
  try {
    const notification = markNotificationAsRead(req.params.id, req.user!.id);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
