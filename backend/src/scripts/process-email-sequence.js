#!/usr/bin/env node

/**
 * Cron job to process email sequence (onboarding emails)
 * Should run multiple times per day to catch scheduled emails
 * Recommended: Every hour from 8am-7pm EST
 */

import 'dotenv/config';
import { processSequenceEmails } from '../services/emailSequenceService.js';
import logger from '../utils/logger.js';

async function runProcessor() {
  try {
    logger.info('Starting email sequence processor');
    const result = await processSequenceEmails();
    logger.info('Email sequence processor completed', result);
    process.exit(0);
  } catch (error) {
    logger.error('Email sequence processor failed', {
      error: error.message,
      stack: error.stack
    });
    process.exit(1);
  }
}

runProcessor();
