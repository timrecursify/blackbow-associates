import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { fetchEligibleDeals, transformDealToLead } from '../services/pipedrive.service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// Track sync status
let isSyncing = false;
let lastSyncTime = null;
let lastSyncResults = null;

/**
 * Main scheduled sync function
 * Fetches eligible deals from Pipedrive and imports them to the database
 */
export const scheduledSync = async () => {
  // Prevent concurrent syncs
  if (isSyncing) {
    logger.warn('Sync already in progress, skipping this run');
    return { success: false, message: 'Sync already in progress' };
  }

  isSyncing = true;
  const startTime = Date.now();
  const timestamp = new Date().toISOString();

  logger.info('========================================');
  logger.info('Starting scheduled Pipedrive sync', { timestamp });
  logger.info('========================================');

  const results = {
    timestamp,
    total: 0,
    imported: 0,
    updated: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  try {
    // 1. Fetch eligible deals
    logger.info('Step 1: Fetching eligible deals from Pipedrive...');
    const eligibleDeals = await fetchEligibleDeals();

    results.total = eligibleDeals.length;
    logger.info(`Found ${eligibleDeals.length} eligible deals to process`);

    if (eligibleDeals.length === 0) {
      logger.info('No eligible deals found, sync completed');
      lastSyncTime = timestamp;
      lastSyncResults = results;
      isSyncing = false;
      return {
        success: true,
        message: 'Sync completed successfully (no eligible deals)',
        results
      };
    }

    // 2. Process each deal
    logger.info('Step 2: Processing deals...');
    for (const deal of eligibleDeals) {
      try {
        // Transform deal to lead
        const leadData = await transformDealToLead(deal);

        // Check if lead already exists by pipedriveDealId
        const existing = await prisma.lead.findUnique({
          where: { pipedriveDealId: deal.id }
        });

        if (existing) {
          // Update existing lead
          await prisma.lead.update({
            where: { id: existing.id },
            data: leadData
          });
          results.updated++;
          logger.info(`Updated lead for deal #${deal.id} (${deal.title})`);
        } else {
          // Create new lead
          await prisma.lead.create({
            data: leadData
          });
          results.imported++;
          logger.info(`Imported new lead for deal #${deal.id} (${deal.title})`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          dealId: deal.id,
          dealTitle: deal.title,
          error: error.message
        });
        logger.error(`Failed to process deal #${deal.id}:`, {
          error: error.message,
          stack: error.stack
        });
      }
    }

    // 3. Calculate duration
    const duration = Date.now() - startTime;

    // 4. Log summary
    logger.info('========================================');
    logger.info('Pipedrive sync completed successfully', {
      duration: `${(duration / 1000).toFixed(2)}s`,
      total: results.total,
      imported: results.imported,
      updated: results.updated,
      failed: results.failed,
      skipped: results.skipped
    });
    logger.info('========================================');

    // Store results
    lastSyncTime = timestamp;
    lastSyncResults = results;

    // Send Telegram notification if there were failures
    if (results.failed > 0) {
      const message = `⚠️ Pipedrive Sync Completed with Errors\n\n` +
        `✅ Imported: ${results.imported}\n` +
        `🔄 Updated: ${results.updated}\n` +
        `❌ Failed: ${results.failed}\n` +
        `⏱ Duration: ${(duration / 1000).toFixed(2)}s\n\n` +
        `Check logs for details.`;

      try {
        // Import telegram service dynamically to avoid circular dependency
        const telegramService = await import('../services/telegram.service.js');
        if (telegramService && telegramService.sendAlert) {
          await telegramService.sendAlert(message);
        }
      } catch (telegramError) {
        logger.error('Failed to send Telegram notification:', telegramError.message);
      }
    }

    isSyncing = false;
    return {
      success: true,
      message: 'Sync completed successfully',
      results
    };
  } catch (error) {
    const duration = Date.now() - startTime;

    logger.error('========================================');
    logger.error('Pipedrive sync failed', {
      error: error.message,
      stack: error.stack,
      duration: `${(duration / 1000).toFixed(2)}s`
    });
    logger.error('========================================');

    // Send Telegram alert on critical failure
    const message = `🚨 Pipedrive Sync Failed\n\n` +
      `❌ Error: ${error.message}\n` +
      `⏱ Duration: ${(duration / 1000).toFixed(2)}s\n\n` +
      `Check logs immediately!`;

    try {
      // Import telegram service dynamically
      const telegramService = await import('../services/telegram.service.js');
      if (telegramService && telegramService.sendAlert) {
        await telegramService.sendAlert(message);
      }
    } catch (telegramError) {
      logger.error('Failed to send Telegram notification:', telegramError.message);
    }

    isSyncing = false;
    throw error;
  }
};

/**
 * Get last sync status
 */
export const getLastSyncStatus = () => {
  return {
    isSyncing,
    lastSyncTime,
    lastSyncResults
  };
};

/**
 * Initialize cron scheduler
 * Runs 4 times daily: 8am, 11am, 2pm, 5pm EST
 */
export const initCronScheduler = () => {
  // Cron schedule: 0 8,11,14,17 * * *
  // Runs at 8:00, 11:00, 14:00 (2pm), 17:00 (5pm) EST
  const cronSchedule = '0 8,11,14,17 * * *';

  logger.info('Initializing Pipedrive sync cron scheduler', {
    schedule: cronSchedule,
    timezone: 'America/New_York',
    runs: '4 times daily at 8am, 11am, 2pm, 5pm EST'
  });

  cron.schedule(
    cronSchedule,
    async () => {
      try {
        await scheduledSync();
      } catch (error) {
        logger.error('Cron job failed:', error);
      }
    },
    {
      scheduled: true,
      timezone: 'America/New_York'
    }
  );

  logger.info('Pipedrive sync cron scheduler initialized successfully');
};

export default {
  scheduledSync,
  getLastSyncStatus,
  initCronScheduler
};
