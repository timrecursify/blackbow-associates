import { asyncHandler } from '../middleware/errorHandler.js';
import { NotificationService } from '../services/notification.service.js';

/**
 * GET /api/notifications
 */
export const listNotifications = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { page = 1, limit = 20, unreadOnly = 'false' } = req.query;

  const data = await NotificationService.listForUser({
    userId,
    page,
    limit,
    unreadOnly: unreadOnly === 'true'
  });

  res.json({ success: true, ...data });
});

/**
 * GET /api/notifications/unread-count
 */
export const getUnreadCount = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const count = await NotificationService.unreadCount({ userId });
  res.json({ success: true, unreadCount: count });
});

/**
 * POST /api/notifications/:id/read
 */
export const markNotificationRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const updated = await NotificationService.markRead({ userId, notificationId: id });
  res.json({ success: true, notification: updated });
});

/**
 * POST /api/notifications/read-all
 */
export const markAllRead = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const count = await NotificationService.markAllRead({ userId });
  res.json({ success: true, updatedCount: count });
});

/**
 * POST /api/notifications/:id/dismiss
 */
export const dismissNotification = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { id } = req.params;
  const updated = await NotificationService.dismiss({ userId, notificationId: id });
  res.json({ success: true, notification: updated });
});


