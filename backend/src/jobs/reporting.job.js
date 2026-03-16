/**
 * Reporting System Cron Jobs
 * Handles scheduled tasks for employee reporting
 */

import cron from "node-cron";
import ReportingService from "../services/reportingService.js";
import { logger } from "../utils/logger.js";

/**
 * Initialize reporting cron jobs
 */
export function initReportingScheduler() {
  // Send daily clock-in codes at 9 AM Eastern (Mon-Fri)
  // Note: Server runs in UTC, so 9 AM ET = 14:00 UTC (EST) or 13:00 UTC (EDT)
  // Using America/New_York timezone for automatic DST handling
  cron.schedule(
    "0 9 * * 1-5",
    async () => {
      logger.info("Running daily clock-in code job");
      try {
        const results = await ReportingService.sendDailyClockInCodes();
        logger.info("Daily clock-in codes sent", { results });
      } catch (error) {
        logger.error("Failed to send daily clock-in codes", { error: error.message });
      }
    },
    {
      timezone: "America/New_York"
    }
  );

  // Check for reminders every minute
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        const results = await ReportingService.checkAndSendReminders();
        if (results.length > 0) {
          logger.info("Reminders sent", { results });
        }
      } catch (error) {
        logger.error("Failed to check reminders", { error: error.message });
      }
    },
    {
      timezone: "America/New_York"
    }
  );

  logger.info("Reporting scheduler initialized", {
    clockInSchedule: "9:00 AM ET, Mon-Fri",
    reminderSchedule: "Every minute"
  });
}
