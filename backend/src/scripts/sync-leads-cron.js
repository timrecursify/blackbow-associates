#!/usr/bin/env node

/**
 * Cron job to sync incomplete leads from Pipedrive
 * Runs hourly to check for leads missing location/data
 */

import { syncIncompleteLeads } from '../services/lead-sync.service.js';
import logger from '../utils/logger.js';

async function runSync() {
  try {
    logger.info('Starting scheduled lead sync job');
    const result = await syncIncompleteLeads();
    logger.info('Scheduled lead sync completed', result);
    process.exit(0);
  } catch (error) {
    logger.error('Scheduled lead sync failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

runSync();
