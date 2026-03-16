#!/usr/bin/env node

/**
 * Script to send test sequence emails to a specific address
 * Usage: node src/scripts/send-test-sequence.js email@example.com "Business Name"
 */

import 'dotenv/config';
import { sendTestSequence } from '../services/emailSequenceService.js';
import logger from '../utils/logger.js';

async function runTest() {
  const email = process.argv[2];
  const businessName = process.argv[3] || 'Test User';

  if (!email) {
    console.error('Usage: node src/scripts/send-test-sequence.js email@example.com "Business Name"');
    process.exit(1);
  }

  try {
    logger.info(`Sending test sequence to ${email}`);
    console.log(`Sending 10 test emails to ${email}...`);
    console.log('This will take about 30 seconds.\n');

    const results = await sendTestSequence(email, businessName, 3000);

    console.log('\nResults:');
    results.forEach(r => {
      const status = r.status === 'sent' ? '✓' : '✗';
      console.log(`  ${status} Email ${r.step}: ${r.status}${r.error ? ` - ${r.error}` : ''}`);
    });

    const sent = results.filter(r => r.status === 'sent').length;
    console.log(`\nCompleted: ${sent}/10 emails sent successfully`);

    process.exit(0);
  } catch (error) {
    logger.error('Test sequence failed', { error: error.message });
    console.error('Error:', error.message);
    process.exit(1);
  }
}

runTest();
