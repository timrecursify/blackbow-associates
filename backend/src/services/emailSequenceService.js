/**
 * Email Sequence Service
 * Handles onboarding email sequences for new users
 */

import prisma from '../config/database.js';
import EmailService from './emailService.js';
import logger from '../utils/logger.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Sequence configuration
const SEQUENCE_CONFIG = {
  onboarding: {
    totalSteps: 10,
    // Days after enrollment for each email (0-indexed)
    // Email 1: Day 4, then weekly (Day 11, 18, 25, 32, 39, 46, 53, 60, 67)
    scheduleDays: [4, 11, 18, 25, 32, 39, 46, 53, 60, 67],
    // Hours to send each email (EST, converted to UTC+5 offset)
    // Varying times: morning (9am), late morning (11am), afternoon (2pm), evening (6pm)
    sendHoursEST: [9, 11, 14, 10, 18, 9, 14, 11, 18, 10],
    // Credit amount for step 4
    creditAmount: 60,
    creditStep: 4
  }
};

/**
 * Get next weekday date from a given date
 * Skips Saturdays (6) and Sundays (0)
 */
const getNextWeekday = (date) => {
  const result = new Date(date);
  const day = result.getDay();
  if (day === 6) result.setDate(result.getDate() + 2); // Saturday -> Monday
  if (day === 0) result.setDate(result.getDate() + 1); // Sunday -> Monday
  return result;
};

/**
 * Calculate the next email send time for a user
 * @param {Date} enrolledAt - When user was enrolled
 * @param {number} step - Current step (0-indexed, next email to send)
 * @param {string} sequenceName - Name of the sequence
 */
const calculateNextEmailTime = (enrolledAt, step, sequenceName = 'onboarding') => {
  const config = SEQUENCE_CONFIG[sequenceName];
  if (!config || step >= config.totalSteps) return null;

  const daysToAdd = config.scheduleDays[step];
  const sendHourEST = config.sendHoursEST[step];

  // Calculate date
  const nextDate = new Date(enrolledAt);
  nextDate.setDate(nextDate.getDate() + daysToAdd);

  // Set time (convert EST to UTC: EST = UTC-5)
  nextDate.setUTCHours(sendHourEST + 5, 0, 0, 0);

  // Ensure it's a weekday
  return getNextWeekday(nextDate);
};

/**
 * Read and process an email template
 * @param {string} sequenceName - Sequence name
 * @param {number} step - Step number (1-indexed for filename)
 */
const readSequenceTemplate = (sequenceName, step) => {
  const templatePath = path.join(__dirname, '../../templates/sequence', `${sequenceName}-${String(step).padStart(2, '0')}.html`);

  if (!fs.existsSync(templatePath)) {
    throw new Error(`Template not found: ${templatePath}`);
  }

  return fs.readFileSync(templatePath, 'utf-8');
};

/**
 * Get email subject for a specific step
 * @param {number} step - Step number (1-indexed)
 */
const getEmailSubject = (step) => {
  const subjects = {
    1: 'Welcome to Black Bow Associates!',
    2: 'How the Lead Marketplace Works',
    3: 'Best Practices for Contacting Leads',
    4: "You've Got $60 Free Credit!",
    5: 'No Competition - Our Exclusive Lead Guarantee',
    6: 'Crafting the Perfect Outreach Message',
    7: 'Never Miss a Lead in Your Area',
    8: 'Turn More Leads Into Clients',
    9: 'Why Our Leads Are Golden',
    10: 'Your Black Bow Journey - Final Tips'
  };
  return subjects[step] || `Black Bow Associates - Email ${step}`;
};

/**
 * Enroll a user in the onboarding sequence
 * @param {string} userId - User ID to enroll
 * @param {string} sequenceName - Sequence name (default: 'onboarding')
 */
export const enrollUser = async (userId, sequenceName = 'onboarding') => {
  try {
    // Check if user is admin - don't enroll admins
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isAdmin: true }
    });

    if (user?.isAdmin) {
      logger.info('Skipping admin enrollment', { userId, sequenceName });
      return null;
    }

    // Check if user already enrolled
    const existing = await prisma.emailSequenceEnrollment.findUnique({
      where: {
        userId_sequenceName: { userId, sequenceName }
      }
    });

    if (existing) {
      logger.info('User already enrolled in sequence', { userId, sequenceName });
      return existing;
    }

    const enrolledAt = new Date();
    const nextEmailAt = calculateNextEmailTime(enrolledAt, 0, sequenceName);

    const enrollment = await prisma.emailSequenceEnrollment.create({
      data: {
        userId,
        sequenceName,
        currentStep: 0,
        enrolledAt,
        nextEmailAt,
        status: 'ACTIVE'
      }
    });

    logger.info('User enrolled in email sequence', { userId, sequenceName, nextEmailAt });
    return enrollment;
  } catch (error) {
    logger.error('Error enrolling user in sequence', { userId, error: error.message });
    throw error;
  }
};

/**
 * Exit a user from the sequence (e.g., when they purchase a lead)
 * @param {string} userId - User ID
 * @param {string} reason - Reason for exit
 */
export const exitUserFromSequence = async (userId, reason = 'purchased_lead') => {
  try {
    const enrollment = await prisma.emailSequenceEnrollment.findFirst({
      where: {
        userId,
        status: 'ACTIVE'
      }
    });

    if (!enrollment) return null;

    const updated = await prisma.emailSequenceEnrollment.update({
      where: { id: enrollment.id },
      data: {
        status: 'EXITED',
        exitReason: reason,
        completedAt: new Date()
      }
    });

    logger.info('User exited from email sequence', { userId, reason });
    return updated;
  } catch (error) {
    logger.error('Error exiting user from sequence', { userId, error: error.message });
    throw error;
  }
};

/**
 * Send an email for a specific sequence step
 * @param {Object} enrollment - The enrollment record
 * @param {Object} user - User data
 */
const sendSequenceEmail = async (enrollment, user) => {
  const step = enrollment.currentStep + 1; // Convert 0-indexed to 1-indexed
  const sequenceName = enrollment.sequenceName;

  try {
    // Read template
    const template = readSequenceTemplate(sequenceName, step);

    // Replace variables
    const html = template.replace(/\{\{businessName\}\}/g, user.businessName || 'there');

    // Get subject
    const subject = getEmailSubject(step);

    // Send email
    await EmailService.sendEmail(user.email, subject, html);

    logger.info('Sequence email sent', {
      userId: user.id,
      email: user.email,
      step,
      sequenceName
    });

    return true;
  } catch (error) {
    logger.error('Failed to send sequence email', {
      userId: user.id,
      step,
      error: error.message
    });
    throw error;
  }
};

/**
 * Apply the $60 credit to a user's account
 * @param {string} userId - User ID
 */
const applySequenceCredit = async (userId) => {
  const creditAmount = SEQUENCE_CONFIG.onboarding.creditAmount;

  try {
    // Check if user has ever purchased a lead
    const purchaseCount = await prisma.purchase.count({
      where: { userId }
    });

    if (purchaseCount > 0) {
      logger.info('Skipping credit - user has purchases', { userId });
      return false;
    }

    // Apply credit via transaction
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { balance: true }
    });

    const currentBalance = parseFloat(user.balance) || 0;
    const newBalance = currentBalance + creditAmount;

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance }
      }),
      prisma.transaction.create({
        data: {
          userId,
          amount: creditAmount,
          type: 'ADJUSTMENT',
          description: 'Welcome credit - Try 3 free leads!',
          balanceAfter: newBalance,
          metadata: { source: 'onboarding_sequence', step: 4 }
        }
      })
    ]);

    logger.info('Applied sequence credit', { userId, amount: creditAmount, newBalance });
    return true;
  } catch (error) {
    logger.error('Error applying sequence credit', { userId, error: error.message });
    throw error;
  }
};

/**
 * Process a single enrollment - send email and update status
 * @param {Object} enrollment - Enrollment record with user data
 */
const processEnrollment = async (enrollment) => {
  const config = SEQUENCE_CONFIG[enrollment.sequenceName];
  const nextStep = enrollment.currentStep + 1;

  try {
    // Check if user has purchased a lead (should exit sequence)
    const purchaseCount = await prisma.purchase.count({
      where: { userId: enrollment.userId }
    });

    if (purchaseCount > 0 && nextStep > 1) {
      // User purchased a lead, exit them (but allow first email)
      await exitUserFromSequence(enrollment.userId, 'purchased_lead');
      return { status: 'exited', reason: 'purchased_lead' };
    }

    // Send the email
    await sendSequenceEmail(enrollment, enrollment.user);

    // Check if this is the credit step
    if (nextStep === config.creditStep && !enrollment.creditApplied) {
      const creditApplied = await applySequenceCredit(enrollment.userId);
      if (creditApplied) {
        await prisma.emailSequenceEnrollment.update({
          where: { id: enrollment.id },
          data: { creditApplied: true }
        });
      }
    }

    // Check if sequence is complete
    if (nextStep >= config.totalSteps) {
      await prisma.emailSequenceEnrollment.update({
        where: { id: enrollment.id },
        data: {
          currentStep: nextStep,
          lastEmailSentAt: new Date(),
          nextEmailAt: null,
          status: 'COMPLETED',
          completedAt: new Date()
        }
      });
      return { status: 'completed', step: nextStep };
    }

    // Calculate next email time
    const nextEmailAt = calculateNextEmailTime(
      enrollment.enrolledAt,
      nextStep,
      enrollment.sequenceName
    );

    // Update enrollment
    await prisma.emailSequenceEnrollment.update({
      where: { id: enrollment.id },
      data: {
        currentStep: nextStep,
        lastEmailSentAt: new Date(),
        nextEmailAt
      }
    });

    return { status: 'sent', step: nextStep, nextEmailAt };
  } catch (error) {
    logger.error('Error processing enrollment', {
      enrollmentId: enrollment.id,
      error: error.message
    });
    return { status: 'error', error: error.message };
  }
};

/**
 * Process all pending sequence emails
 * This should be called by a cron job
 */
export const processSequenceEmails = async () => {
  const now = new Date();

  try {
    // Find all enrollments where nextEmailAt <= now
    const pendingEnrollments = await prisma.emailSequenceEnrollment.findMany({
      where: {
        status: 'ACTIVE',
        nextEmailAt: { lte: now }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            businessName: true,
            emailConfirmed: true,
            isAdmin: true
          }
        }
      },
      take: 100 // Process max 100 at a time
    });

    if (pendingEnrollments.length === 0) {
      logger.info('No pending sequence emails');
      return { processed: 0, sent: 0, errors: 0 };
    }

    logger.info(`Processing ${pendingEnrollments.length} pending sequence emails`);

    let sent = 0;
    let errors = 0;
    let exited = 0;

    for (const enrollment of pendingEnrollments) {
      // Skip if user is admin
      if (enrollment.user.isAdmin) {
        logger.info('Skipping admin user', { userId: enrollment.userId });
        // Exit admin from sequence
        await exitUserFromSequence(enrollment.userId, 'admin_excluded');
        exited++;
        continue;
      }

      // Skip if user email not confirmed
      if (!enrollment.user.emailConfirmed) {
        logger.info('Skipping unconfirmed email', { userId: enrollment.userId });
        continue;
      }

      const result = await processEnrollment(enrollment);

      if (result.status === 'sent' || result.status === 'completed') {
        sent++;
      } else if (result.status === 'exited') {
        exited++;
      } else if (result.status === 'error') {
        errors++;
      }

      // Small delay between emails to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    const summary = { processed: pendingEnrollments.length, sent, exited, errors };
    logger.info('Sequence email processing complete', summary);
    return summary;
  } catch (error) {
    logger.error('Error processing sequence emails', { error: error.message });
    throw error;
  }
};

/**
 * Enroll all existing eligible users who haven't purchased
 * One-time function to backfill existing users
 */
export const enrollExistingUsers = async () => {
  try {
    // Find users who:
    // 1. Have confirmed email
    // 2. Have never purchased a lead
    // 3. Are not already enrolled in onboarding sequence
    const eligibleUsers = await prisma.user.findMany({
      where: {
        emailConfirmed: true,
        isAdmin: false,
        isBlocked: false,
        purchases: { none: {} },
        emailSequences: {
          none: { sequenceName: 'onboarding' }
        }
      },
      select: { id: true, email: true, createdAt: true }
    });

    logger.info(`Found ${eligibleUsers.length} eligible users to enroll`);

    let enrolled = 0;
    for (const user of eligibleUsers) {
      try {
        // Enroll with their original registration date
        const enrolledAt = user.createdAt;
        const nextEmailAt = calculateNextEmailTime(enrolledAt, 0, 'onboarding');

        // If the first email should have already been sent, start from step 0 with immediate send
        const now = new Date();
        const shouldSendImmediately = nextEmailAt && nextEmailAt <= now;

        await prisma.emailSequenceEnrollment.create({
          data: {
            userId: user.id,
            sequenceName: 'onboarding',
            currentStep: 0,
            enrolledAt: now, // Use now for existing users so emails go out on schedule
            nextEmailAt: shouldSendImmediately ? now : nextEmailAt,
            status: 'ACTIVE'
          }
        });
        enrolled++;
      } catch (err) {
        logger.error('Error enrolling user', { userId: user.id, error: err.message });
      }
    }

    logger.info(`Enrolled ${enrolled} existing users in onboarding sequence`);
    return { eligible: eligibleUsers.length, enrolled };
  } catch (error) {
    logger.error('Error enrolling existing users', { error: error.message });
    throw error;
  }
};

/**
 * Send test emails to a specific address (for testing)
 * @param {string} email - Email address to send to
 * @param {string} businessName - Business name for personalization
 * @param {number} delayMs - Delay between emails in milliseconds
 */
export const sendTestSequence = async (email, businessName = 'Test User', delayMs = 3000) => {
  const results = [];

  for (let step = 1; step <= 10; step++) {
    try {
      const template = readSequenceTemplate('onboarding', step);
      const html = template.replace(/\{\{businessName\}\}/g, businessName);
      const subject = `[TEST ${step}/10] ${getEmailSubject(step)}`;

      await EmailService.sendEmail(email, subject, html);
      results.push({ step, status: 'sent' });
      logger.info(`Test email ${step}/10 sent to ${email}`);

      // Wait between emails
      if (step < 10) {
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    } catch (error) {
      results.push({ step, status: 'error', error: error.message });
      logger.error(`Failed to send test email ${step}`, { error: error.message });
    }
  }

  return results;
};

export default {
  enrollUser,
  exitUserFromSequence,
  processSequenceEmails,
  enrollExistingUsers,
  sendTestSequence
};
