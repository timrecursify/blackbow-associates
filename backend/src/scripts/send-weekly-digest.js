#!/usr/bin/env node

/**
 * Cron job to send weekly digest emails
 * Should run once per week, typically Monday morning (e.g., 8 AM)
 */

import 'dotenv/config';
import { sendWeeklyDigests } from '../services/leadNotificationService.js';
import logger from '../utils/logger.js';

async function runDigest() {
  try {
    logger.info('Starting weekly digest job');
    const result = await sendWeeklyDigests();
    logger.info('Weekly digest completed', result);
    process.exit(0);
  } catch (error) {
    logger.error('Weekly digest failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

runDigest();
