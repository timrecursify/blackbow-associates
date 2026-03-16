/**
 * Send daily clock-in codes to all active reporting employees
 *
 * MANUAL USE ONLY — not scheduled by any cron job.
 * The daily clock-in emails are sent automatically by the in-process
 * node-cron in src/jobs/reporting.job.js (runs inside blackbow-api PM2 process).
 * Active logs: /var/log/desaas/blackbow-combined-YYYY-MM-DD.log (Winston)
 *
 * This script exists as a fallback to manually trigger code generation:
 *   cd ~/projects/blackbow-associates/backend && node src/scripts/send-clock-in-codes.js
 *
 * Note: The old log at /var/log/desaas/blackbow-clock-in-codes.log is stale
 * (last entry Jan 29, 2026) from when this script was scheduled via system cron.
 */

import ReportingService from "../services/reportingService.js";
import { logger } from "../utils/logger.js";

async function main() {
  const startTime = new Date().toISOString();
  console.log(`[${startTime}] Starting daily clock-in code distribution`);
  logger.info("Starting daily clock-in code distribution");

  try {
    const results = await ReportingService.sendDailyClockInCodes();

    logger.info("Clock-in codes processed", { results });

    const sent = results.filter(r => r.status === "sent").length;
    const skipped = results.filter(r => r.status === "already_sent").length;
    const errors = results.filter(r => r.status === "error").length;

    const summary = `Clock-in codes: ${sent} sent, ${skipped} already sent, ${errors} errors`;
    console.log(`[${new Date().toISOString()}] ${summary}`);

    if (errors > 0) {
      const errorDetails = results.filter(r => r.status === "error");
      console.error("Errors:", JSON.stringify(errorDetails, null, 2));
    }

    results.forEach(r => {
      console.log(`  - ${r.employee}: ${r.status}${r.code ? ` (${r.code})` : ""}${r.error ? ` - ${r.error}` : ""}`);
    });

    process.exit(errors > 0 ? 1 : 0);
  } catch (error) {
    const errMsg = `[${new Date().toISOString()}] FATAL: ${error.message}`;
    console.error(errMsg);
    console.error(error.stack);
    logger.error("Failed to send clock-in codes", { error: error.message, stack: error.stack });
    process.exit(1);
  }
}

main();
