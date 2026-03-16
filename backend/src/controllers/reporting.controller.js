/**
 * Reporting Controller
 * Handles HTTP requests for employee reporting system
 */

import ReportingService from "../services/reportingService.js";
import { logger } from "../utils/logger.js";

/**
 * Clock in with code
 * POST /api/reporting/clock-in
 */
export async function clockIn(req, res) {
  try {
    const { code } = req.body;

    if (!code || typeof code !== "string") {
      return res.status(400).json({ error: "Code is required" });
    }

    const result = await ReportingService.clockIn(code.trim());

    // Set session token in httpOnly cookie
    res.cookie("reporting_session", result.sessionToken, {
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
      path: "/"
    });

    res.json({
      success: true,
      sessionToken: result.sessionToken,
      workdayId: result.workdayId,
      clockInTime: result.clockInTime,
      employeeName: result.employeeName
    });
  } catch (error) {
    logger.warn("Clock-in failed", { error: error.message });
    res.status(400).json({ error: error.message });
  }
}

/**
 * Get workday status
 * GET /api/reporting/status
 */
export async function getStatus(req, res) {
  try {
    const sessionToken = getSessionToken(req);

    if (!sessionToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const status = await ReportingService.getStatus(sessionToken);
    res.json(status);
  } catch (error) {
    logger.warn("Get status failed", { error: error.message });

    if (error.message === "Invalid session") {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    res.status(400).json({ error: error.message });
  }
}

/**
 * Save report bullets (auto-save)
 * POST /api/reporting/reports/:slotNumber/save
 */
export async function saveReport(req, res) {
  try {
    const sessionToken = getSessionToken(req);

    if (!sessionToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const slotNumber = parseInt(req.params.slotNumber, 10);

    if (isNaN(slotNumber) || slotNumber < 1 || slotNumber > 3) {
      return res.status(400).json({ error: "Invalid slot number" });
    }

    const { bullets } = req.body;

    if (!Array.isArray(bullets)) {
      return res.status(400).json({ error: "Bullets must be an array" });
    }

    const result = await ReportingService.saveReport(sessionToken, slotNumber, bullets);
    res.json(result);
  } catch (error) {
    logger.warn("Save report failed", { error: error.message });

    if (error.message === "Invalid session") {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    res.status(400).json({ error: error.message });
  }
}

/**
 * Submit slot report
 * POST /api/reporting/reports/:slotNumber/submit
 */
export async function submitReport(req, res) {
  try {
    const sessionToken = getSessionToken(req);

    if (!sessionToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const slotNumber = parseInt(req.params.slotNumber, 10);

    if (isNaN(slotNumber) || slotNumber < 1 || slotNumber > 3) {
      return res.status(400).json({ error: "Invalid slot number" });
    }

    const { bullets } = req.body;

    if (!Array.isArray(bullets)) {
      return res.status(400).json({ error: "Bullets must be an array" });
    }

    const result = await ReportingService.submitReport(sessionToken, slotNumber, bullets);
    res.json(result);
  } catch (error) {
    logger.warn("Submit report failed", { error: error.message });

    if (error.message === "Invalid session") {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    res.status(400).json({ error: error.message });
  }
}

/**
 * End workday and generate summary
 * POST /api/reporting/end-day
 */
export async function endDay(req, res) {
  try {
    const sessionToken = getSessionToken(req);

    if (!sessionToken) {
      return res.status(401).json({ error: "Not authenticated" });
    }

    const result = await ReportingService.endDay(sessionToken);

    // Clear session cookie
    res.clearCookie("reporting_session");

    res.json(result);
  } catch (error) {
    logger.warn("End day failed", { error: error.message });

    if (error.message === "Invalid session") {
      return res.status(401).json({ error: "Invalid or expired session" });
    }

    res.status(400).json({ error: error.message });
  }
}

/**
 * Internal: Send daily clock-in codes
 * POST /api/reporting/internal/send-clock-in-codes
 */
export async function sendClockInCodes(req, res) {
  try {
    // Verify internal secret
    const secret = req.headers["x-internal-secret"];
    if (secret !== process.env.REPORTING_INTERNAL_SECRET) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const results = await ReportingService.sendDailyClockInCodes();
    res.json({ success: true, results });
  } catch (error) {
    logger.error("Send clock-in codes failed", { error: error.message });
    res.status(500).json({ error: error.message });
  }
}

/**
 * Internal: Check and send reminders
 * POST /api/reporting/internal/send-reminders
 */
export async function sendReminders(req, res) {
  try {
    // Verify internal secret
    const secret = req.headers["x-internal-secret"];
    if (secret !== process.env.REPORTING_INTERNAL_SECRET) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const results = await ReportingService.checkAndSendReminders();
    res.json({ success: true, results });
  } catch (error) {
    logger.error("Send reminders failed", { error: error.message });
    res.status(500).json({ error: error.message });
  }
}

/**
 * Manual trigger: Send clock-in code to specific employee (for testing)
 * POST /api/reporting/internal/trigger-clock-in
 */
export async function triggerClockIn(req, res) {
  try {
    // Verify internal secret
    const secret = req.headers["x-internal-secret"];
    if (secret !== process.env.REPORTING_INTERNAL_SECRET) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const results = await ReportingService.sendDailyClockInCodes();
    res.json({ success: true, results });
  } catch (error) {
    logger.error("Trigger clock-in failed", { error: error.message });
    res.status(500).json({ error: error.message });
  }
}

/**
 * Helper: Get session token from cookie or header
 */
function getSessionToken(req) {
  // Check cookie first
  if (req.cookies && req.cookies.reporting_session) {
    return req.cookies.reporting_session;
  }

  // Fall back to header
  const header = req.headers["x-session-token"];
  if (header) {
    return header;
  }

  return null;
}
