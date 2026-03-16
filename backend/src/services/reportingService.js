/**
 * Reporting Service
 * Handles employee clock-in codes, report management, and AI summaries
 */

import crypto from "crypto";
import { prisma } from "../config/database.js";
import { logger } from "../utils/logger.js";
import EmailService from "./emailService.js";

// Time constants
const SLOT_DURATION_MS = 2 * 60 * 60 * 1000; // 2 hours in milliseconds
const TOTAL_SLOTS = 3;

class ReportingService {
  /**
   * Generate a cryptographically random 6-character alphanumeric code
   */
  static generateCode() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // Excluding confusing chars (0,O,1,I)
    let code = "";
    const bytes = crypto.randomBytes(6);
    for (let i = 0; i < 6; i++) {
      code += chars[bytes[i] % chars.length];
    }
    return code;
  }

  /**
   * Generate session token for authenticated reporting access
   */
  static generateSessionToken() {
    return crypto.randomUUID();
  }

  /**
   * Get midnight Eastern Time for code expiration
   */
  static getMidnightET() {
    const now = new Date();
    // Create date at midnight ET (next day)
    const midnight = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
    midnight.setHours(23, 59, 59, 999);
    return midnight;
  }

  /**
   * Get today's date at midnight ET (for unique constraint)
   */
  static getTodayDate() {
    // Get current time in ET
    const now = new Date();
    const etFormatter = new Intl.DateTimeFormat("en-US", {
      timeZone: "America/New_York",
      year: "numeric",
      month: "2-digit",
      day: "2-digit"
    });
    const parts = etFormatter.formatToParts(now);
    const year = parseInt(parts.find(p => p.type === "year").value);
    const month = parseInt(parts.find(p => p.type === "month").value) - 1;
    const day = parseInt(parts.find(p => p.type === "day").value);

    // Create UTC date at midnight for this ET date
    return new Date(Date.UTC(year, month, day, 5, 0, 0, 0)); // 5 AM UTC = midnight ET
  }

  /**
   * Generate and send daily clock-in codes to all active employees
   */
  static async sendDailyClockInCodes() {
    const employees = await prisma.reportingEmployee.findMany({
      where: { active: true }
    });

    const today = this.getTodayDate();
    const expiresAt = this.getMidnightET();
    const results = [];

    for (const employee of employees) {
      try {
        // Check if code already exists for today
        let existing = await prisma.reportingClockInCode.findUnique({
          where: {
            employeeId_date: {
              employeeId: employee.id,
              date: today
            }
          }
        });

        let code;

        if (existing) {
          // Code exists - check if email was sent
          if (existing.emailSentAt) {
            logger.info("Clock-in code already sent for today", { employeeId: employee.id });
            results.push({ employee: employee.email, status: "already_sent" });
            continue;
          }
          // Email not sent - resend with existing code
          code = existing.code;
          logger.info("Resending clock-in email (previous send failed)", { employeeId: employee.id });
        } else {
          // Generate unique code
          let isUnique = false;
          let attempts = 0;
          while (!isUnique && attempts < 10) {
            code = this.generateCode();
            const existingCode = await prisma.reportingClockInCode.findUnique({
              where: { code }
            });
            isUnique = !existingCode;
            attempts++;
          }

          if (!isUnique) {
            throw new Error("Could not generate unique code after 10 attempts");
          }

          // Save code to database
          existing = await prisma.reportingClockInCode.create({
            data: {
              code,
              employeeId: employee.id,
              date: today,
              expiresAt
            }
          });
        }

        // Send email
        await this.sendClockInEmail(employee.email, employee.name, code, today);

        // Mark email as sent
        await prisma.reportingClockInCode.update({
          where: { id: existing.id },
          data: { emailSentAt: new Date() }
        });

        logger.info("Clock-in code sent", { employeeId: employee.id, email: employee.email });
        results.push({ employee: employee.email, status: "sent", code });
      } catch (error) {
        logger.error("Failed to send clock-in code", {
          employeeId: employee.id,
          error: error.message
        });
        results.push({ employee: employee.email, status: "error", error: error.message });
      }
    }

    return results;
  }

  /**
   * Send clock-in email with code
   */
  static async sendClockInEmail(email, name, code, date) {
    const dateStr = date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; margin-bottom: 8px;">Good Morning, ${name}!</h1>
    <p style="color: #666; margin-bottom: 24px;">${dateStr}</p>

    <p style="color: #333; font-size: 16px;">Your reporting code for today is:</p>

    <div style="background-color: #f8f9fa; border: 2px dashed #dee2e6; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
      <span style="font-family: 'Courier New', monospace; font-size: 32px; font-weight: bold; letter-spacing: 4px; color: #1a1a1a;">${code}</span>
    </div>

    <a href="https://reporting.blackbowassociates.com" style="display: block; background-color: #1a1a1a; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; text-align: center; font-weight: 500; margin: 24px 0;">
      Start Reporting &rarr;
    </a>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin-top: 24px;">
      <p style="color: #333; font-size: 14px; margin: 0 0 12px 0;"><strong>How it works:</strong></p>
      <ul style="color: #555; font-size: 14px; margin: 0; padding-left: 20px; line-height: 1.8;">
        <li>Enter your code to clock in when you start working</li>
        <li>Log your tasks throughout the day as new time slots unlock</li>
        <li>You'll receive reminders as each slot opens</li>
        <li>Click <strong>Clock Out</strong> when you're done for the day</li>
      </ul>
    </div>

    <p style="color: #999; font-size: 14px; margin-top: 24px;">This code expires at midnight Eastern.</p>
  </div>
</body>
</html>`;

    return EmailService.sendEmail(email, `Your Blackbow Reporting Code for ${dateStr}`, html);
  }

  /**
   * Validate clock-in code and create workday session
   */
  static async clockIn(code) {
    const codeRecord = await prisma.reportingClockInCode.findUnique({
      where: { code: code.toUpperCase() },
      include: { employee: true }
    });

    if (!codeRecord) {
      throw new Error("Invalid code");
    }

    if (new Date() > codeRecord.expiresAt) {
      throw new Error("Code expired");
    }

    // If code was already used, check if workday is still active
    if (codeRecord.usedAt) {
      const existingWorkday = await prisma.reportingWorkday.findUnique({
        where: {
          employeeId_date: {
            employeeId: codeRecord.employeeId,
            date: codeRecord.date
          }
        },
        include: { employee: true }
      });

      if (existingWorkday && !existingWorkday.completed) {
        // Workday still active - generate new session token and return
        const sessionToken = this.generateSessionToken();
        await prisma.reportingWorkday.update({
          where: { id: existingWorkday.id },
          data: { sessionToken }
        });

        logger.info("Employee re-authenticated with existing code", {
          employeeId: codeRecord.employeeId,
          workdayId: existingWorkday.id
        });

        return {
          sessionToken,
          workdayId: existingWorkday.id,
          clockInTime: existingWorkday.clockInTime,
          employeeName: existingWorkday.employee.name
        };
      }

      // Workday completed - code is truly used up
      throw new Error("Day already completed");
    }

    const now = new Date();
    const sessionToken = this.generateSessionToken();

    // Create or update workday
    const workday = await prisma.reportingWorkday.upsert({
      where: {
        employeeId_date: {
          employeeId: codeRecord.employeeId,
          date: codeRecord.date
        }
      },
      create: {
        employeeId: codeRecord.employeeId,
        date: codeRecord.date,
        clockInTime: now,
        sessionToken
      },
      update: {
        clockInTime: now,
        sessionToken
      },
      include: { employee: true }
    });

    // Mark code as used
    await prisma.reportingClockInCode.update({
      where: { id: codeRecord.id },
      data: { usedAt: now }
    });

    // Create empty report slots
    for (let slot = 1; slot <= TOTAL_SLOTS; slot++) {
      await prisma.reportingSlotReport.upsert({
        where: {
          workdayId_slotNumber: {
            workdayId: workday.id,
            slotNumber: slot
          }
        },
        create: {
          workdayId: workday.id,
          slotNumber: slot,
          bullets: []
        },
        update: {}
      });
    }

    logger.info("Employee clocked in", {
      employeeId: codeRecord.employeeId,
      workdayId: workday.id
    });

    return {
      sessionToken,
      workdayId: workday.id,
      clockInTime: workday.clockInTime,
      employeeName: workday.employee.name
    };
  }

  /**
   * Get workday status by session token
   */
  static async getStatus(sessionToken) {
    const workday = await prisma.reportingWorkday.findUnique({
      where: { sessionToken },
      include: {
        employee: true,
        reports: {
          orderBy: { slotNumber: "asc" }
        }
      }
    });

    if (!workday) {
      throw new Error("Invalid session");
    }

    // Calculate which slots are unlocked
    const clockInTime = new Date(workday.clockInTime);
    const now = new Date();
    const elapsedMs = now - clockInTime;

    const slotsUnlocked = [];
    for (let slot = 1; slot <= TOTAL_SLOTS; slot++) {
      const unlockTime = (slot - 1) * SLOT_DURATION_MS;
      if (elapsedMs >= unlockTime) {
        slotsUnlocked.push(slot);
      }
    }

    // Calculate time until next unlock
    let nextUnlockIn = null;
    const nextSlot = slotsUnlocked.length + 1;
    if (nextSlot <= TOTAL_SLOTS) {
      const nextUnlockMs = nextSlot * SLOT_DURATION_MS - elapsedMs;
      nextUnlockIn = Math.max(0, Math.ceil(nextUnlockMs / 1000)); // seconds
    }

    return {
      workday: {
        id: workday.id,
        date: workday.date,
        clockInTime: workday.clockInTime,
        clockOutTime: workday.clockOutTime,
        completed: workday.completed
      },
      employee: {
        name: workday.employee.name
      },
      reports: workday.reports.map(r => ({
        slotNumber: r.slotNumber,
        bullets: r.bullets,
        submitted: r.submitted,
        submittedAt: r.submittedAt,
        isLate: r.isLate
      })),
      slotsUnlocked,
      nextUnlockIn
    };
  }

  /**
   * Save report bullets (auto-save)
   */
  static async saveReport(sessionToken, slotNumber, bullets) {
    const workday = await prisma.reportingWorkday.findUnique({
      where: { sessionToken }
    });

    if (!workday) {
      throw new Error("Invalid session");
    }

    if (workday.completed) {
      throw new Error("Workday already completed");
    }

    // Check if slot is unlocked
    const clockInTime = new Date(workday.clockInTime);
    const now = new Date();
    const elapsedMs = now - clockInTime;
    const unlockTime = (slotNumber - 1) * SLOT_DURATION_MS;

    if (elapsedMs < unlockTime) {
      throw new Error("Slot not yet unlocked");
    }

    const report = await prisma.reportingSlotReport.upsert({
      where: {
        workdayId_slotNumber: {
          workdayId: workday.id,
          slotNumber
        }
      },
      create: {
        workdayId: workday.id,
        slotNumber,
        bullets: bullets || []
      },
      update: {
        bullets: bullets || []
      }
    });

    return { saved: true, updatedAt: report.updatedAt };
  }

  /**
   * Submit a slot report
   */
  static async submitReport(sessionToken, slotNumber, bullets) {
    const workday = await prisma.reportingWorkday.findUnique({
      where: { sessionToken }
    });

    if (!workday) {
      throw new Error("Invalid session");
    }

    if (workday.completed) {
      throw new Error("Workday already completed");
    }

    // Check if slot is unlocked
    const clockInTime = new Date(workday.clockInTime);
    const now = new Date();
    const elapsedMs = now - clockInTime;
    const unlockTime = (slotNumber - 1) * SLOT_DURATION_MS;

    if (elapsedMs < unlockTime) {
      throw new Error("Slot not yet unlocked");
    }

    // Check if late (more than 2 hours after unlock)
    const deadlineMs = slotNumber * SLOT_DURATION_MS;
    const isLate = elapsedMs > deadlineMs;

    const report = await prisma.reportingSlotReport.upsert({
      where: {
        workdayId_slotNumber: {
          workdayId: workday.id,
          slotNumber
        }
      },
      create: {
        workdayId: workday.id,
        slotNumber,
        bullets: bullets || [],
        submitted: true,
        submittedAt: now,
        isLate
      },
      update: {
        bullets: bullets || [],
        submitted: true,
        submittedAt: now,
        isLate
      }
    });

    logger.info("Report submitted", {
      workdayId: workday.id,
      slotNumber,
      isLate
    });

    return { submitted: true, isLate, submittedAt: report.submittedAt };
  }

  /**
   * End workday and trigger summary generation
   */
  static async endDay(sessionToken) {
    const workday = await prisma.reportingWorkday.findUnique({
      where: { sessionToken },
      include: {
        employee: true,
        reports: {
          orderBy: { slotNumber: "asc" }
        }
      }
    });

    if (!workday) {
      throw new Error("Invalid session");
    }

    if (workday.completed) {
      throw new Error("Workday already completed");
    }

    const now = new Date();

    // Mark workday as completed
    await prisma.reportingWorkday.update({
      where: { id: workday.id },
      data: {
        completed: true,
        clockOutTime: now
      }
    });

    // Helper to extract text from bullet (handles both string and object format)
    const getBulletText = (b) => {
      if (typeof b === 'string') return b;
      if (b && typeof b === 'object' && b.text) return b.text;
      return '';
    };

    // Helper to format bullet with time if available
    const formatBulletWithTime = (b) => {
      if (typeof b === 'string') return b;
      if (b && typeof b === 'object') {
        const text = b.text || '';
        const timeFrom = b.timeFrom || '';
        const timeTo = b.timeTo || '';
        if (timeFrom || timeTo) {
          return `[${timeFrom || '?'} - ${timeTo || '?'}] ${text}`;
        }
        return text;
      }
      return '';
    };

    // Aggregate all bullets
    const allBullets = workday.reports
      .map(r => {
        const bullets = Array.isArray(r.bullets) ? r.bullets : [];
        return bullets.filter(b => getBulletText(b).trim()).map(formatBulletWithTime);
      })
      .flat();

    const rawContent = workday.reports
      .map(r => {
        const bullets = Array.isArray(r.bullets) ? r.bullets : [];
        const formattedBullets = bullets
          .filter(b => getBulletText(b).trim())
          .map(b => `- ${formatBulletWithTime(b)}`);
        return `Slot ${r.slotNumber}:\n${formattedBullets.join("\n") || "- (empty)"}`;
      })
      .join("\n\n");

    // Generate AI summary (placeholder - will be replaced with GPT-4o)
    let aiSummary;
    try {
      aiSummary = await this.generateAISummary(workday.employee.name, workday.date, allBullets);
    } catch (error) {
      logger.error("AI summary generation failed", { error: error.message });
      aiSummary = "AI summary unavailable. Please review raw reports.";
    }

    // Save summary
    await prisma.reportingDailySummary.create({
      data: {
        workdayId: workday.id,
        rawContent,
        aiSummary
      }
    });

    // Send summary email (pass clockOutTime since workday object has old data)
    await this.sendSummaryEmail(workday.employee, workday, rawContent, aiSummary, now);

    logger.info("Workday ended", {
      workdayId: workday.id,
      employeeId: workday.employeeId
    });

    return { completed: true, clockOutTime: now };
  }

  /**
   * Generate AI summary using GPT-4o
   */
  static async generateAISummary(employeeName, date, bullets) {
    // Check for OpenAI API key
    if (!process.env.OPENAI_API_KEY) {
      logger.warn("OpenAI API key not configured, using fallback summary");
      return this.generateFallbackSummary(bullets);
    }

    try {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [
            {
              role: "system",
              content: `You summarize employee daily work reports for management. Write 2-4 direct sentences describing what was accomplished. Be specific about the work done. No filler words, no corporate jargon, no phrases like "conducted", "ensured", "verified functionality". Just state what was done.`
            },
            {
              role: "user",
              content: `Employee: ${employeeName}

Tasks with times:
${bullets.map(b => `- ${b}`).join("\n")}

Write a brief summary of what ${employeeName} worked on today.`
            }
          ],
          max_tokens: 300,
          temperature: 0.2
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message);
      }

      return data.choices[0].message.content;
    } catch (error) {
      logger.error("GPT-4o API call failed", { error: error.message });
      return this.generateFallbackSummary(bullets);
    }
  }

  /**
   * Fallback summary when AI is unavailable
   */
  static generateFallbackSummary(bullets) {
    if (bullets.length === 0) {
      return "No tasks reported for this day.";
    }
    return `Daily Summary (${bullets.length} tasks):\n\n${bullets.map(b => `- ${b}`).join("\n")}`;
  }

  /**
   * Send daily summary email to management
   */
  static async sendSummaryEmail(employee, workday, rawContent, aiSummary, clockOutTime) {
    const recipients = [
      "tim@preciouspicspro.com",
      "slava@preciouspicspro.com"
    ];

    // Use clockInTime for the date (more accurate than workday.date which can have timezone issues)
    const dateStr = workday.clockInTime.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "America/New_York"
    });

    const clockInStr = workday.clockInTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "America/New_York"
    });

    const clockOutStr = clockOutTime
      ? clockOutTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          timeZone: "America/New_York"
        })
      : "N/A";

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; margin-bottom: 8px;">Daily Report: ${employee.name}</h1>
    <p style="color: #666; margin-bottom: 24px;">${dateStr}</p>

    <div style="background-color: #f8f9fa; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
      <p style="margin: 0; color: #333;"><strong>Clock In:</strong> ${clockInStr} ET</p>
      <p style="margin: 8px 0 0 0; color: #333;"><strong>Clock Out:</strong> ${clockOutStr} ET</p>
    </div>

    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">

    <h2 style="color: #1a1a1a; font-size: 18px;">Summary</h2>
    <div style="background-color: #f0f7ff; border-left: 4px solid #0066cc; padding: 16px; margin-bottom: 24px; white-space: pre-wrap; line-height: 1.6;">${aiSummary}</div>

    <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;">

    <h2 style="color: #1a1a1a; font-size: 18px;">Raw Reports</h2>
    <pre style="background-color: #f8f9fa; padding: 16px; border-radius: 8px; font-family: 'Courier New', monospace; font-size: 14px; overflow-x: auto; white-space: pre-wrap;">${rawContent}</pre>
  </div>
</body>
</html>`;

    try {
      await EmailService.sendEmail(recipients, `Daily Report: ${employee.name} - ${dateStr}`, html);

      // Update email sent timestamp
      await prisma.reportingDailySummary.updateMany({
        where: { workdayId: workday.id },
        data: { emailSentAt: new Date() }
      });

      logger.info("Summary email sent", { workdayId: workday.id, recipients });
    } catch (error) {
      logger.error("Failed to send summary email", { error: error.message });
    }
  }

  /**
   * Check and send reminder emails for incomplete slots
   */
  static async checkAndSendReminders() {
    const activeWorkdays = await prisma.reportingWorkday.findMany({
      where: {
        completed: false,
        clockInTime: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Within last 24 hours
        }
      },
      include: {
        employee: true,
        reports: true
      }
    });

    const results = [];

    for (const workday of activeWorkdays) {
      const clockInTime = new Date(workday.clockInTime);
      const now = new Date();
      const elapsedMs = now - clockInTime;

      for (let slot = 1; slot <= TOTAL_SLOTS; slot++) {
        // Check if slot is unlocked and not submitted
        const unlockTime = (slot - 1) * SLOT_DURATION_MS;
        const reminderTime = slot * SLOT_DURATION_MS; // Send reminder at slot deadline

        if (elapsedMs >= reminderTime) {
          const report = workday.reports.find(r => r.slotNumber === slot);

          if (!report || !report.submitted) {
            // Check if reminder already sent
            const reminderSent = await prisma.reportingReminderSent.findUnique({
              where: {
                workdayId_slotNumber: {
                  workdayId: workday.id,
                  slotNumber: slot
                }
              }
            });

            if (!reminderSent) {
              // Send reminder
              await this.sendReminderEmail(workday.employee, slot, slot === TOTAL_SLOTS);

              // Mark reminder as sent
              await prisma.reportingReminderSent.create({
                data: {
                  workdayId: workday.id,
                  slotNumber: slot
                }
              });

              results.push({
                employee: workday.employee.email,
                slot,
                status: "reminder_sent"
              });
            }
          }
        }
      }
    }

    return results;
  }

  /**
   * Send slot reminder email
   */
  static async sendReminderEmail(employee, slotNumber, isFinal) {
    const subject = isFinal
      ? "Don't forget to end your day"
      : `Time to submit Slot ${slotNumber} report`;

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
  <div style="background-color: white; border-radius: 8px; padding: 32px; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
    <h1 style="color: #1a1a1a; margin-bottom: 16px;">Hi ${employee.name},</h1>

    ${isFinal ? `
    <p style="color: #333; font-size: 16px; line-height: 1.6;">Your workday is almost complete! Please submit any remaining reports and click "End Day" to generate your daily summary.</p>
    ` : `
    <p style="color: #333; font-size: 16px; line-height: 1.6;">It's been 2 hours since your last report submission. Please take a moment to log your work for <strong>Slot ${slotNumber}</strong>.</p>
    `}

    <a href="https://reporting.blackbowassociates.com" style="display: block; background-color: #1a1a1a; color: white; text-decoration: none; padding: 16px 32px; border-radius: 8px; text-align: center; font-weight: 500; margin: 24px 0;">
      ${isFinal ? "Complete Your Day &rarr;" : "Submit Report &rarr;"}
    </a>

    <p style="color: #999; font-size: 14px;">Your progress is being saved automatically.</p>
  </div>
</body>
</html>`;

    return EmailService.sendEmail(employee.email, subject, html);
  }
}

export default ReportingService;
