import { prisma } from '../config/database.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Get webhook statistics for dashboard
export const getWebhookStats = asyncHandler(async (req, res) => {
  const { period = 'today' } = req.query;

  // Calculate date range based on period
  let startDate;
  const now = new Date();

  switch (period) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    default:
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  // Get aggregate counts
  const [total, success, failed, retrying, deadLetter, lastWebhook] = await Promise.all([
    prisma.webhookEvent.count({
      where: { createdAt: { gte: startDate } }
    }),
    prisma.webhookEvent.count({
      where: {
        createdAt: { gte: startDate },
        status: 'SUCCESS'
      }
    }),
    prisma.webhookEvent.count({
      where: {
        createdAt: { gte: startDate },
        status: 'FAILED'
      }
    }),
    prisma.webhookEvent.count({
      where: {
        createdAt: { gte: startDate },
        status: 'RETRYING'
      }
    }),
    prisma.webhookEvent.count({
      where: {
        createdAt: { gte: startDate },
        status: 'DEAD_LETTER'
      }
    }),
    prisma.webhookEvent.findFirst({
      where: { createdAt: { gte: startDate } },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    })
  ]);

  // Calculate success rate
  const successRate = total > 0 ? ((success / total) * 100).toFixed(2) : 0;

  res.json({
    success: true,
    stats: {
      period,
      total,
      success,
      failed,
      retrying,
      deadLetter,
      successRate: parseFloat(successRate),
      lastWebhook: lastWebhook?.createdAt || null
    }
  });
});

// Get paginated webhook events with filters
export const getWebhookEvents = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 50,
    status,
    startDate,
    endDate
  } = req.query;

  // SECURITY: Validate and sanitize pagination parameters
  const pageNum = Math.max(1, Math.min(1000, parseInt(page) || 1));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  // Build where clause
  const where = {};

  // SECURITY: Validate status enum
  if (status && ['PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'RETRYING', 'DEAD_LETTER'].includes(status)) {
    where.status = status;
  }

  // SECURITY: Validate date inputs
  if (startDate || endDate) {
    where.createdAt = {};
    if (startDate) {
      const parsedStartDate = new Date(startDate);
      if (!isNaN(parsedStartDate.getTime())) {
        where.createdAt.gte = parsedStartDate;
      }
    }
    if (endDate) {
      const parsedEndDate = new Date(endDate);
      if (!isNaN(parsedEndDate.getTime())) {
        where.createdAt.lte = parsedEndDate;
      }
    }
  }

  const [events, total] = await Promise.all([
    prisma.webhookEvent.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: skip,
      take: limitNum,
      select: {
        id: true,
        source: true,
        eventType: true,
        dealId: true,
        status: true,
        processedAt: true,
        error: true,
        retryCount: true,
        nextRetryAt: true,
        createdAt: true,
        updatedAt: true,
        payload: true
      }
    }),
    prisma.webhookEvent.count({ where })
  ]);

  res.json({
    success: true,
    events,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

// Get all failed webhooks
export const getFailedWebhooks = asyncHandler(async (req, res) => {
  const failed = await prisma.webhookEvent.findMany({
    where: {
      status: {
        in: ['FAILED', 'RETRYING', 'DEAD_LETTER']
      }
    },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      source: true,
      eventType: true,
      dealId: true,
      status: true,
      error: true,
      retryCount: true,
      nextRetryAt: true,
      createdAt: true,
      payload: true
    }
  });

  res.json({
    success: true,
    failed
  });
});

// Retry a specific webhook by ID
export const retryWebhook = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { resetRetryCount = false } = req.body;

  // Find the webhook event
  const event = await prisma.webhookEvent.findUnique({
    where: { id }
  });

  if (!event) {
    throw new AppError('Webhook event not found', 404, 'NOT_FOUND');
  }

  // Update webhook status
  const updateData = {
    status: resetRetryCount ? 'PENDING' : 'RETRYING',
    error: null,
    nextRetryAt: new Date()
  };

  if (resetRetryCount) {
    updateData.retryCount = 0;
  }

  const updatedEvent = await prisma.webhookEvent.update({
    where: { id },
    data: updateData
  });

  logger.info('Webhook retry triggered by admin', {
    webhookId: id,
    source: event.source,
    eventType: event.eventType,
    resetRetryCount,
    adminId: req.user.id
  });

  await notifyTelegram(
    `🔄 Webhook retry triggered: ${event.source} - ${event.eventType} (ID: ${id})`,
    'info'
  );

  res.json({
    success: true,
    result: {
      id: updatedEvent.id,
      status: updatedEvent.status,
      retryCount: updatedEvent.retryCount
    }
  });
});

// Retry all failed webhooks
export const retryAllFailed = asyncHandler(async (req, res) => {
  const { resetRetryCount = false } = req.body;

  // Find all failed/dead letter webhooks
  const failedEvents = await prisma.webhookEvent.findMany({
    where: {
      status: {
        in: ['FAILED', 'DEAD_LETTER']
      }
    },
    select: { id: true }
  });

  if (failedEvents.length === 0) {
    return res.json({
      success: true,
      queued: 0,
      message: 'No failed webhooks to retry'
    });
  }

  // Update all failed webhooks to retry status
  const updateData = {
    status: 'RETRYING',
    error: null,
    nextRetryAt: new Date()
  };

  if (resetRetryCount) {
    updateData.retryCount = 0;
  }

  await prisma.webhookEvent.updateMany({
    where: {
      status: {
        in: ['FAILED', 'DEAD_LETTER']
      }
    },
    data: updateData
  });

  logger.info('Bulk webhook retry triggered by admin', {
    count: failedEvents.length,
    resetRetryCount,
    adminId: req.user.id
  });

  await notifyTelegram(
    `🔄 Bulk webhook retry: ${failedEvents.length} webhooks queued for retry`,
    'info'
  );

  res.json({
    success: true,
    queued: failedEvents.length,
    message: `${failedEvents.length} webhooks queued for retry`
  });
});

export default {
  getWebhookStats,
  getWebhookEvents,
  getFailedWebhooks,
  retryWebhook,
  retryAllFailed
};
