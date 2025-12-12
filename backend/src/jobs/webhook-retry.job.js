import cron from 'node-cron';
import { retryFailedWebhooks } from '../services/webhook-processor.service.js';
import logger from '../utils/logger.js';

// Lock flag to prevent overlapping runs
let isRunning = false;

/**
 * Retry failed webhooks job
 * Processes webhook events in RETRYING status that are due for retry
 */
export const retryJob = async () => {
  // Prevent overlapping runs
  if (isRunning) {
    logger.warn('Webhook retry job already running, skipping this execution');
    return;
  }

  try {
    isRunning = true;
    logger.info('Webhook retry job started');

    const startTime = Date.now();
    const results = await retryFailedWebhooks();
    const duration = Date.now() - startTime;

    logger.info('Webhook retry job completed', {
      duration: `${duration}ms`,
      ...results
    });

    // Log warning if there are dead letter events
    if (results.deadLetters > 0) {
      logger.warn('Webhook events moved to dead letter queue', {
        count: results.deadLetters,
        message: 'Manual intervention may be required'
      });
    }

  } catch (error) {
    logger.error('Webhook retry job failed', {
      error: error.message,
      stack: error.stack
    });
  } finally {
    isRunning = false;
  }
};

/**
 * Initialize webhook retry scheduler
 * Runs every 5 minutes to process failed webhooks
 */
export const initRetryScheduler = () => {
  // Validate cron pattern before scheduling
  const cronPattern = '*/5 * * * *'; // Every 5 minutes

  if (!cron.validate(cronPattern)) {
    logger.error('Invalid cron pattern for webhook retry job', { cronPattern });
    throw new Error('Invalid cron pattern');
  }

  logger.info('Initializing webhook retry scheduler', {
    schedule: 'Every 5 minutes',
    timezone: 'America/New_York'
  });

  const task = cron.schedule(cronPattern, retryJob, {
    scheduled: true,
    timezone: 'America/New_York'
  });

  logger.info('Webhook retry scheduler initialized successfully');

  return task;
};

export default {
  retryJob,
  initRetryScheduler
};
