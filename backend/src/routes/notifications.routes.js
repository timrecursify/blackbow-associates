import express from 'express';
import { requireAuth, attachUser } from '../middleware/auth.js';
import {
  listNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllRead,
  dismissNotification
} from '../controllers/notifications.controller.js';

const router = express.Router();

router.use(requireAuth, attachUser);

router.get('/', listNotifications);
router.get('/unread-count', getUnreadCount);
router.post('/read-all', markAllRead);
router.post('/:id/read', markNotificationRead);
router.post('/:id/dismiss', dismissNotification);

export default router;


