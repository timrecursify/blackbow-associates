import cron from 'node-cron';
import { prisma } from '../config/database.js';
import logger from '../utils/logger.js';

let isRunning = false;

export const cleanupNotificationsJob = async () => {
  if (isRunning) {
    logger.warn('Notifications cleanup job already running, skipping this execution');
    return;
  }

  try {
    isRunning = true;
    const startTime = Date.now();

    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days

    const result = await prisma.notification.deleteMany({
      where: {
        OR: [
          { createdAt: { lt: cutoff } },
          { dismissedAt: { lt: cutoff } }
        ]
      }
    });

    const duration = Date.now() - startTime;
    logger.info('Notifications cleanup job completed', {
      deleted: result.count,
      cutoff: cutoff.toISOString(),
      duration: `${duration}ms`
    });
  } catch (error) {
    logger.error('Notifications cleanup job failed', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    isRunning = false;
  }
};

export const initNotificationsCleanupScheduler = () => {
  const cronPattern = '17 2 * * *'; // Daily at 02:17

  if (!cron.validate(cronPattern)) {
    logger.error('Invalid cron pattern for notifications cleanup job', { cronPattern });
    throw new Error('Invalid cron pattern');
  }

  logger.info('Initializing notifications cleanup scheduler', {
    schedule: 'Daily at 02:17',
    timezone: 'America/New_York'
  });

  return cron.schedule(cronPattern, cleanupNotificationsJob, {
    scheduled: true,
    timezone: 'America/New_York'
  });
};

export default {
  cleanupNotificationsJob,
  initNotificationsCleanupScheduler
};


