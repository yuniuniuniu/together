import { Router } from 'express';
import { authenticate, type AuthRequest } from '../middleware/auth.js';
import { listNotifications, markNotificationAsRead, markAllNotificationsAsRead } from '../services/notificationService.js';

const router = Router();

// All routes require authentication
router.use(authenticate);

// GET /api/notifications - List notifications
router.get('/', async (req: AuthRequest, res, next) => {
  try {
    const notifications = await listNotifications(req.user!.id);

    res.json({
      success: true,
      data: notifications,
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/read-all - Mark all as read (must be before /:id/read)
router.put('/read-all', async (req: AuthRequest, res, next) => {
  try {
    const count = await markAllNotificationsAsRead(req.user!.id);

    res.json({
      success: true,
      data: { count },
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/notifications/:id/read - Mark as read
router.put('/:id/read', async (req: AuthRequest, res, next) => {
  try {
    const notificationId = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
    const notification = await markNotificationAsRead(notificationId, req.user!.id);

    res.json({
      success: true,
      data: notification,
    });
  } catch (error) {
    next(error);
  }
});

export default router;
