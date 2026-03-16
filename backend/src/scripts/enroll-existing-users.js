#!/usr/bin/env node

/**
 * One-time script to enroll existing users in onboarding sequence
 * Only enrolls users who have confirmed email and never purchased a lead
 */

import 'dotenv/config';
import { enrollExistingUsers } from '../services/emailSequenceService.js';
import logger from '../utils/logger.js';

async function run() {
  try {
    logger.info('Starting enrollment of existing users');
    console.log('Enrolling existing users in onboarding sequence...\n');

    const result = await enrollExistingUsers();

    console.log(`Found ${result.eligible} eligible users`);
    console.log(`Enrolled ${result.enrolled} users`);
    console.log('\nDone!');

    process.exit(0);
  } catch (error) {
    logger.error('Enrollment failed', { error: error.message });
    console.error('Error:', error.message);
    process.exit(1);
  }
}

run();
