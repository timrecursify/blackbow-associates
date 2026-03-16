#!/usr/bin/env node

/**
 * Cron job to send daily digest emails
 * Should run once per day, typically early morning (e.g., 8 AM)
 */

import 'dotenv/config';
import { sendDailyDigests } from '../services/leadNotificationService.js';
import logger from '../utils/logger.js';

async function runDigest() {
  try {
    logger.info('Starting daily digest job');
    const result = await sendDailyDigests();
    logger.info('Daily digest completed', result);
    process.exit(0);
  } catch (error) {
    logger.error('Daily digest failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

runDigest();
