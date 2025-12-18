import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';

const MAX_PAGE = 1000;
const MAX_LIMIT = 100;

export class NotificationService {
  /**
   * Create a notification for a user.
   * Keep this side-effect safe: it should never throw in a way that breaks core flows.
   */
  static async create({
    userId,
    type,
    title,
    body,
    linkUrl = null,
    metadata = null
  }) {
    if (!userId || typeof userId !== 'string') {
      throw new Error('NotificationService.create: userId is required');
    }
    if (!type || typeof type !== 'string') {
      throw new Error('NotificationService.create: type is required');
    }
    if (!title || typeof title !== 'string') {
      throw new Error('NotificationService.create: title is required');
    }
    if (!body || typeof body !== 'string') {
      throw new Error('NotificationService.create: body is required');
    }

    try {
      return await prisma.notification.create({
        data: {
          userId,
          type,
          title: title.slice(0, 120),
          body: body.slice(0, 500),
          linkUrl,
          metadata
        }
      });
    } catch (error) {
      // Notifications must never break primary user actions
      logger.error('Failed to create notification', {
        userId,
        type,
        error: error?.message
      });
      return null;
    }
  }

  static async listForUser({ userId, page = 1, limit = 20, unreadOnly = false }) {
    const pageNum = Math.max(1, Math.min(MAX_PAGE, parseInt(page) || 1));
    const limitNum = Math.max(1, Math.min(MAX_LIMIT, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    const where = {
      userId,
      dismissedAt: null,
      ...(unreadOnly ? { readAt: null } : {})
    };

    const [items, total] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum
      }),
      prisma.notification.count({ where })
    ]);

    return {
      notifications: items,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum)
      }
    };
  }

  static async unreadCount({ userId }) {
    return prisma.notification.count({
      where: {
        userId,
        dismissedAt: null,
        readAt: null
      }
    });
  }

  static async markRead({ userId, notificationId }) {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });
    if (!existing) return null;
    if (existing.readAt) return existing;

    return prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date() }
    });
  }

  static async markAllRead({ userId }) {
    const result = await prisma.notification.updateMany({
      where: { userId, dismissedAt: null, readAt: null },
      data: { readAt: new Date() }
    });
    return result.count;
  }

  static async dismiss({ userId, notificationId }) {
    const existing = await prisma.notification.findFirst({
      where: { id: notificationId, userId }
    });
    if (!existing) return null;
    if (existing.dismissedAt) return existing;

    return prisma.notification.update({
      where: { id: notificationId },
      data: { dismissedAt: new Date() }
    });
  }
}


