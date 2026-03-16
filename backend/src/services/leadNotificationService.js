/**
 * Lead Notification Service
 * Handles email notifications for new leads based on user preferences
 */

import prisma from '../config/database.js';
import EmailService from './emailService.js';
import logger from '../utils/logger.js';

/**
 * Send instant notifications to users matching lead state
 * @param {Object} lead - The lead object with state information
 */
export const sendInstantNotifications = async (lead) => {
  try {
    if (!lead.state) {
      logger.info('Lead has no state, skipping notifications', { leadId: lead.id });
      return { sent: 0, skipped: 'no_state' };
    }

    // Find users with INSTANT frequency who have this state enabled
    const preferences = await prisma.leadNotificationPreference.findMany({
      where: {
        enabled: true,
        frequency: 'INSTANT',
        states: { has: lead.state }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            businessName: true,
            balance: true
          }
        }
      }
    });

    if (preferences.length === 0) {
      logger.info('No users with instant notifications for state', {
        leadId: lead.id,
        state: lead.state
      });
      return { sent: 0, skipped: 'no_matching_users' };
    }

    let sent = 0;
    let failed = 0;

    for (const pref of preferences) {
      try {
        await EmailService.sendNewLeadNotification(
          pref.user.email,
          pref.user.businessName || 'User',
          lead,
          pref.user.balance
        );
        sent++;
        logger.info('Instant notification sent', {
          userId: pref.user.id,
          leadId: lead.id,
          state: lead.state
        });
      } catch (error) {
        failed++;
        logger.error('Failed to send instant notification', {
          userId: pref.user.id,
          leadId: lead.id,
          error: error.message
        });
      }
    }

    return { sent, failed };
  } catch (error) {
    logger.error('Error in sendInstantNotifications', {
      leadId: lead.id,
      error: error.message
    });
    throw error;
  }
};

/**
 * Queue a lead for digest notifications (DAILY/WEEKLY)
 * This records the lead in a queue table for later processing
 * @param {Object} lead - The lead object
 */
export const queueForDigest = async (lead) => {
  try {
    if (!lead.state) {
      return { queued: false, reason: 'no_state' };
    }

    // Find users with DAILY or WEEKLY frequency who have this state enabled
    const preferences = await prisma.leadNotificationPreference.findMany({
      where: {
        enabled: true,
        frequency: { in: ['DAILY', 'WEEKLY'] },
        states: { has: lead.state }
      },
      select: {
        id: true,
        userId: true,
        frequency: true
      }
    });

    if (preferences.length === 0) {
      return { queued: 0, reason: 'no_matching_users' };
    }

    // Queue leads for digest by creating digest queue entries
    const queuedCount = await prisma.leadDigestQueue.createMany({
      data: preferences.map(pref => ({
        preferenceId: pref.id,
        userId: pref.userId,
        leadId: lead.id,
        frequency: pref.frequency
      })),
      skipDuplicates: true
    });

    logger.info('Lead queued for digest', {
      leadId: lead.id,
      state: lead.state,
      queued: queuedCount.count
    });

    return { queued: queuedCount.count };
  } catch (error) {
    // If the table doesn't exist yet, just log and continue
    if (error.code === 'P2021') {
      logger.warn('LeadDigestQueue table does not exist, skipping digest queue');
      return { queued: 0, reason: 'table_not_exists' };
    }
    logger.error('Error queuing for digest', {
      leadId: lead.id,
      error: error.message
    });
    throw error;
  }
};

/**
 * Process a newly created lead and send/queue notifications
 * This is the main entry point called after lead creation
 * @param {Object} lead - The newly created lead
 */
export const processNewLead = async (lead) => {
  try {
    // Send instant notifications
    const instantResult = await sendInstantNotifications(lead);

    // Queue for daily/weekly digests
    // For simplicity, we'll just track that this lead was created
    // The digest cron jobs will find relevant leads directly

    logger.info('Lead notification processing complete', {
      leadId: lead.id,
      state: lead.state,
      instantSent: instantResult.sent
    });

    return {
      instant: instantResult
    };
  } catch (error) {
    logger.error('Error processing new lead notifications', {
      leadId: lead.id,
      error: error.message
    });
    // Don't throw - notification failure shouldn't break lead creation
    return { error: error.message };
  }
};

/**
 * Send daily digest emails to users with DAILY frequency
 * This should be called by a cron job once per day
 */
export const sendDailyDigests = async () => {
  try {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find users with DAILY notification preference
    const preferences = await prisma.leadNotificationPreference.findMany({
      where: {
        enabled: true,
        frequency: 'DAILY'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            businessName: true,
            balance: true
          }
        }
      }
    });

    if (preferences.length === 0) {
      logger.info('No users with daily digest preferences');
      return { sent: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const pref of preferences) {
      if (pref.states.length === 0) continue;

      // Find leads created yesterday matching user's states
      const leads = await prisma.lead.findMany({
        where: {
          status: 'AVAILABLE',
          state: { in: pref.states },
          createdAt: {
            gte: yesterday,
            lt: today
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 10
      });

      if (leads.length === 0) continue;

      // For now, send individual emails for each lead (could be combined into digest)
      for (const lead of leads) {
        try {
          await EmailService.sendNewLeadNotification(
            pref.user.email,
            pref.user.businessName || 'User',
            lead,
            pref.user.balance
          );
          sent++;
        } catch (error) {
          failed++;
          logger.error('Failed to send daily digest email', {
            userId: pref.user.id,
            leadId: lead.id,
            error: error.message
          });
        }
      }
    }

    logger.info('Daily digest completed', { sent, failed });
    return { sent, failed };
  } catch (error) {
    logger.error('Error sending daily digests', { error: error.message });
    throw error;
  }
};

/**
 * Send weekly digest emails to users with WEEKLY frequency
 * This should be called by a cron job once per week
 */
export const sendWeeklyDigests = async () => {
  try {
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find users with WEEKLY notification preference
    const preferences = await prisma.leadNotificationPreference.findMany({
      where: {
        enabled: true,
        frequency: 'WEEKLY'
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            businessName: true,
            balance: true
          }
        }
      }
    });

    if (preferences.length === 0) {
      logger.info('No users with weekly digest preferences');
      return { sent: 0 };
    }

    let sent = 0;
    let failed = 0;

    for (const pref of preferences) {
      if (pref.states.length === 0) continue;

      // Find leads created in the past week matching user's states
      const leads = await prisma.lead.findMany({
        where: {
          status: 'AVAILABLE',
          state: { in: pref.states },
          createdAt: {
            gte: weekAgo,
            lt: today
          }
        },
        orderBy: { createdAt: 'desc' },
        take: 20
      });

      if (leads.length === 0) continue;

      // For now, send individual emails for each lead (could be combined into digest)
      for (const lead of leads) {
        try {
          await EmailService.sendNewLeadNotification(
            pref.user.email,
            pref.user.businessName || 'User',
            lead,
            pref.user.balance
          );
          sent++;
        } catch (error) {
          failed++;
          logger.error('Failed to send weekly digest email', {
            userId: pref.user.id,
            leadId: lead.id,
            error: error.message
          });
        }
      }
    }

    logger.info('Weekly digest completed', { sent, failed });
    return { sent, failed };
  } catch (error) {
    logger.error('Error sending weekly digests', { error: error.message });
    throw error;
  }
};

export default {
  processNewLead,
  sendInstantNotifications,
  sendDailyDigests,
  sendWeeklyDigests
};
