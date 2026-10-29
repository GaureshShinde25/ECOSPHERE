import { Router } from 'express';
import { notificationController } from '../controllers/notificationController.js';
import { requireAuth } from '../middleware/authMiddleware.js';

const router = Router();

// Protected notification endpoints
router.get('/', requireAuth, notificationController.getNotifications);
router.get('/unread-count', requireAuth, notificationController.getUnreadCount);
router.put('/read-all', requireAuth, notificationController.markAllAsRead);
router.get('/:id', requireAuth, notificationController.getNotificationById);
router.put('/:id/read', requireAuth, notificationController.markAsRead);

export default router;
