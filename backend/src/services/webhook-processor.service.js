import prisma from '../config/database.js';
import { transformDealToLead } from './pipedrive.service.js';
import logger from '../utils/logger.js';

// Retry configuration
const RETRY_DELAYS = [60, 300, 900, 3600, 14400]; // seconds: 1min, 5min, 15min, 1hr, 4hr
const MAX_RETRIES = 5;
const TWO_MONTHS_IN_MS = 60 * 24 * 60 * 60 * 1000; // 60 days in milliseconds

/**
 * Process a single webhook event by ID
 * @param {string} eventId - The webhook event ID
 * @returns {Object} Processing result { status, leadId, error }
 */
export const processWebhookEvent = async (eventId) => {
  try {
    // Fetch the webhook event from database
    const event = await prisma.webhookEvent.findUnique({
      where: { id: eventId }
    });

    if (!event) {
      logger.error('Webhook event not found', { eventId });
      return { status: 'FAILED', error: 'Event not found' };
    }

    // Skip if already processed successfully
    if (event.status === 'SUCCESS') {
      logger.info('Webhook event already processed', { eventId });
      return { status: 'SUCCESS', leadId: null };
    }

    // Update status to PROCESSING
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: { status: 'PROCESSING' }
    });

    // Extract deal from payload
    const deal = extractDealFromPayload(event.payload, event.eventType);

    if (!deal) {
      const error = 'No deal data found in webhook payload';
      logger.error('Invalid webhook payload', { eventId, eventType: event.eventType });

      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'FAILED',
          error,
          processedAt: new Date()
        }
      });

      return { status: 'FAILED', error };
    }

    // Check deal age (skip if older than 2 months)
    const dealTooOld = isDealTooOld(deal);
    if (dealTooOld) {
      const reason = 'Deal is older than 2 months';
      logger.info('Skipping old deal', {
        eventId,
        dealId: deal.id,
        addTime: deal.add_time
      });

      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'SUCCESS',
          processedAt: new Date(),
          error: reason
        }
      });

      return { status: 'SUCCESS', leadId: null, skipped: true, reason };
    }

    // Transform deal to lead
    const leadData = await transformDealToLead(deal);

    // Filter: Skip leads without valid location data
    const hasValidLocation = leadData.location && 
                             leadData.location !== 'Location TBD' && 
                             leadData.location.trim() !== '';
    
    if (!hasValidLocation) {
      const reason = 'Lead has no valid location data - skipping until Pipedrive is updated';
      logger.info('Skipping incomplete lead', {
        eventId,
        dealId: deal.id,
        personName: leadData.personName,
        location: leadData.location
      });

      await prisma.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'PENDING_DATA',
          processedAt: new Date(),
          error: reason
        }
      });

      return { status: 'PENDING_DATA', leadId: null, skipped: true, reason };
    }

    // Upsert lead in database (within transaction)
    const lead = await prisma.$transaction(async (tx) => {
      // Upsert the lead
      const upsertedLead = await tx.lead.upsert({
        where: { pipedriveDealId: deal.id },
        create: leadData,
        update: {
          // Update all fields except id and timestamps
          weddingDate: leadData.weddingDate,
          city: leadData.city,
          state: leadData.state,
          location: leadData.location,
          description: leadData.description,
          ethnicReligious: leadData.ethnicReligious,
          firstName: leadData.firstName,
          lastName: leadData.lastName,
          personName: leadData.personName,
          email: leadData.email,
          phone: leadData.phone,
          source: leadData.source,
          gclid: leadData.gclid,
          fbclid: leadData.fbclid,
          utmTerm: leadData.utmTerm,
          spUtmCampaign: leadData.spUtmCampaign,
          utmContent: leadData.utmContent,
          utmMedium: leadData.utmMedium,
          eventId: leadData.eventId,
          sessionId: leadData.sessionId,
          pixelId: leadData.pixelId,
          projectId: leadData.projectId,
          conversionPageUrl: leadData.conversionPageUrl,
          servicesNeeded: leadData.servicesNeeded,
          budgetMax: leadData.budgetMax,
          maskedInfo: leadData.maskedInfo,
          fullInfo: leadData.fullInfo
        }
      });

      // Update webhook event status to SUCCESS
      await tx.webhookEvent.update({
        where: { id: eventId },
        data: {
          status: 'SUCCESS',
          processedAt: new Date(),
          error: null
        }
      });

      return upsertedLead;
    });

    logger.info('Webhook event processed successfully', {
      eventId,
      dealId: deal.id,
      leadId: lead.id,
      eventType: event.eventType
    });

    return { status: 'SUCCESS', leadId: lead.id };

  } catch (error) {
    logger.error('Error processing webhook event', {
      eventId,
      error: error.message,
      stack: error.stack
    });

    // Update event status to FAILED (will be picked up for retry)
    await prisma.webhookEvent.update({
      where: { id: eventId },
      data: {
        status: 'FAILED',
        error: error.message
      }
    }).catch(err => {
      logger.error('Failed to update webhook event status', {
        eventId,
        error: err.message
      });
    });

    return { status: 'FAILED', error: error.message };
  }
};

/**
 * Retry failed webhook events
 * @returns {Object} Retry summary { processed, succeeded, failed, deadLetters }
 */
export const retryFailedWebhooks = async () => {
  try {
    logger.info('Starting webhook retry job');

    const now = new Date();

    // Find events that need retry
    const eventsToRetry = await prisma.webhookEvent.findMany({
      where: {
        status: 'RETRYING',
        nextRetryAt: {
          lte: now
        },
        retryCount: {
          lt: MAX_RETRIES
        }
      },
      orderBy: {
        nextRetryAt: 'asc'
      },
      take: 100 // Process max 100 events per run to avoid overload
    });

    if (eventsToRetry.length === 0) {
      logger.info('No webhook events to retry');
      return { processed: 0, succeeded: 0, failed: 0, deadLetters: 0 };
    }

    logger.info(`Found ${eventsToRetry.length} webhook events to retry`);

    const results = {
      processed: eventsToRetry.length,
      succeeded: 0,
      failed: 0,
      deadLetters: 0
    };

    // Process each event
    for (const event of eventsToRetry) {
      const result = await processWebhookEvent(event.id);

      if (result.status === 'SUCCESS') {
        results.succeeded++;
        logger.info('Webhook retry succeeded', { eventId: event.id });
      } else {
        // Increment retry count
        const newRetryCount = event.retryCount + 1;

        if (newRetryCount >= MAX_RETRIES) {
          // Move to dead letter queue
          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: {
              status: 'DEAD_LETTER',
              retryCount: newRetryCount,
              error: result.error || event.error
            }
          });
          results.deadLetters++;
          logger.warn('Webhook moved to dead letter queue', {
            eventId: event.id,
            retryCount: newRetryCount,
            error: result.error
          });
        } else {
          // Schedule next retry with exponential backoff
          const delaySeconds = RETRY_DELAYS[newRetryCount - 1] || RETRY_DELAYS[RETRY_DELAYS.length - 1];
          const nextRetryAt = new Date(Date.now() + (delaySeconds * 1000));

          await prisma.webhookEvent.update({
            where: { id: event.id },
            data: {
              status: 'RETRYING',
              retryCount: newRetryCount,
              nextRetryAt,
              error: result.error || event.error
            }
          });
          results.failed++;
          logger.info('Webhook retry scheduled', {
            eventId: event.id,
            retryCount: newRetryCount,
            nextRetryAt: nextRetryAt.toISOString(),
            delaySeconds
          });
        }
      }
    }

    logger.info('Webhook retry job completed', results);
    return results;

  } catch (error) {
    logger.error('Error in webhook retry job', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  }
};

/**
 * Extract deal data from webhook payload
 * @param {Object} payload - Webhook payload
 * @param {string} eventType - Event type (e.g., 'added.deal', 'updated.deal')
 * @returns {Object|null} Deal object or null
 */
const extractDealFromPayload = (payload, eventType) => {
  if (!payload) {
    return null;
  }

  // Pipedrive webhook structure:
  // v1: { current: {...}, previous: {...} }
  // v2: { data: {...}, previous: {...}, meta: {...} }
  // v2 format: data field
  if (payload.data) {
    return payload.data;
  }

  // v1 format: current field
  if (payload.current) {
    return payload.current;
  }

  // Fallback: payload might be the deal itself
  if (payload.id && payload.title) {
    return payload;
  }

  return null;
};

/**
 * Check if deal is older than 2 months
 * @param {Object} deal - Deal object with add_time
 * @returns {boolean} True if deal is too old
 */
const isDealTooOld = (deal) => {
  if (!deal || !deal.add_time) {
    return false; // If no add_time, don't skip
  }

  try {
    // Parse add_time (format: "YYYY-MM-DD HH:MM:SS" or ISO string)
    const addTime = new Date(deal.add_time.split(' ')[0]);
    const now = new Date();
    const ageInMs = now - addTime;

    return ageInMs > TWO_MONTHS_IN_MS;
  } catch (error) {
    logger.error('Error parsing deal add_time', {
      dealId: deal.id,
      addTime: deal.add_time,
      error: error.message
    });
    return false; // Don't skip if we can't parse the date
  }
};

export default {
  processWebhookEvent,
  retryFailedWebhooks
};
