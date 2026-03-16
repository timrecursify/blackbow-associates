import prisma from '../config/database.js';
import { transformDealToLead } from './pipedrive.service.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import axios from 'axios';

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

const INCOMPLETE_LEADS_TELEGRAM_ALERTS_ENABLED =
  (process.env.INCOMPLETE_LEADS_TELEGRAM_ALERTS_ENABLED ?? 'true').toLowerCase() === 'true';

const INCOMPLETE_LEADS_NOTIFY_COOLDOWN_MINUTES = Number.parseInt(
  process.env.INCOMPLETE_LEADS_NOTIFY_COOLDOWN_MINUTES || '1440',
  10
);
const NOTIFY_COOLDOWN_MS = Number.isFinite(INCOMPLETE_LEADS_NOTIFY_COOLDOWN_MINUTES)
  ? INCOMPLETE_LEADS_NOTIFY_COOLDOWN_MINUTES * 60 * 1000
  : 24 * 60 * 60 * 1000;

// Terms that indicate incomplete/generic location data
const INVALID_LOCATION_TERMS = [
  'other destinations',
  'other destination',
  'location tbd',
  'south florida',
  'metro',
  'destinations'
];

/**
 * Check if location string is missing or too generic to be useful.
 */
const needsLocationSync = (location) => {
  if (!location) return true;
  const lower = location.toLowerCase().trim();
  return INVALID_LOCATION_TERMS.some(term => lower.includes(term));
};

const getLocationMissingLabel = (location) => {
  if (!location) return 'location';
  const normalized = String(location).trim();
  if (!normalized || normalized.toLowerCase() === 'location tbd') return 'location';
  return needsLocationSync(normalized) ? 'location (generic)' : null;
};

/**
 * Sync incomplete leads from Pipedrive
 * Checks for leads missing location or other critical data
 * Only processes leads created more than 10 minutes ago (to allow pixel to populate)
 */
export const syncIncompleteLeads = async () => {
  try {
    logger.info('Starting incomplete leads sync job');

    // Only check leads created more than 10 minutes ago (to allow pixel time to populate)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000); // Check leads from last year
    const notifyCutoff = new Date(Date.now() - NOTIFY_COOLDOWN_MS);

    // Find leads that are missing critical data OR have generic locations
    const incompleteLeads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: oneYearAgo,    // Check leads from last year
          lte: tenMinutesAgo  // Created more than 10 minutes ago
        },
        OR: [
          { location: null },
          { location: 'Location TBD' },
          { location: { contains: 'Other Destinations', mode: 'insensitive' } },
          { location: { contains: 'Other Destination', mode: 'insensitive' } },
          { location: { contains: 'South Florida', mode: 'insensitive' } },
          { city: null },
          { state: null },
          { weddingDate: null }
        ]
      },
      take: 500 // Process up to 500 per run
    });

    if (incompleteLeads.length === 0) {
      logger.info('No incomplete leads found');
      return { synced: 0, updated: 0, stillIncomplete: 0 };
    }

    logger.info(`Found ${incompleteLeads.length} incomplete leads to sync`);

    let synced = 0;
    let updated = 0;
    let stillIncomplete = 0;
    const stillIncompleteList = [];

    for (const lead of incompleteLeads) {
      try {
        const previousNotifiedAt = lead.incompleteNotifiedAt;

        // Fetch fresh data from Pipedrive
        const dealUrl = `https://api.pipedrive.com/v1/deals/${lead.pipedriveDealId}?api_token=${PIPEDRIVE_API_TOKEN}`;
        const dealResponse = await axios.get(dealUrl, { timeout: 10000 });
        
        if (!dealResponse.data.success || !dealResponse.data.data) {
          logger.warn('Failed to fetch deal from Pipedrive', {
            dealId: lead.pipedriveDealId,
            error: dealResponse.data.error
          });
          continue;
        }

        const deal = dealResponse.data.data;

        // Transform deal to lead with fresh data (now includes visitor location fallback)
        const freshLeadData = await transformDealToLead(deal);

        // Check if data is still incomplete (services no longer required)
        // Accept state-only locations (e.g., "FL") when city is null but state exists
        const hasValidLocation = freshLeadData.state && 
          (freshLeadData.city || freshLeadData.location === freshLeadData.state);
        
        const isStillIncomplete =
          !hasValidLocation ||
          needsLocationSync(freshLeadData.location) ||
          !freshLeadData.weddingDate;

        if (isStillIncomplete) {
          stillIncomplete++;
          stillIncompleteList.push({
            leadId: lead.id,
            dealId: lead.pipedriveDealId,
            personName: freshLeadData.personName || lead.personName,
            location: freshLeadData.location || 'null',
            missingFields: [],
            previousNotifiedAt
          });

          const lastItem = stillIncompleteList[stillIncompleteList.length - 1];
          if (!freshLeadData.city) lastItem.missingFields.push('city');
          if (!freshLeadData.state) lastItem.missingFields.push('state');
          const locationLabel = getLocationMissingLabel(freshLeadData.location);
          if (locationLabel) lastItem.missingFields.push(locationLabel);
          if (!freshLeadData.weddingDate) lastItem.missingFields.push('weddingDate');
        }

        // Update lead in database (always update to get latest data)
        const updateData = {
          location: freshLeadData.location,
          city: freshLeadData.city,
          state: freshLeadData.state,
          weddingDate: freshLeadData.weddingDate,
          description: freshLeadData.description,
          servicesNeeded: freshLeadData.servicesNeeded,
          maskedInfo: freshLeadData.maskedInfo,
          fullInfo: freshLeadData.fullInfo,
          updatedAt: new Date()
        };

        // If a lead becomes complete, clear the notification timestamp so future regressions can alert again.
        // If it remains incomplete, keep the timestamp intact (cooldown-based notifications).
        if (!isStillIncomplete) {
          updateData.incompleteNotifiedAt = null;
        }

        await prisma.lead.update({
          where: { id: lead.id },
          data: updateData
        });

        synced++;
        if (!isStillIncomplete) {
          updated++;
          logger.info('Lead synced and completed', {
            leadId: lead.id,
            dealId: lead.pipedriveDealId,
            personName: freshLeadData.personName,
            newLocation: freshLeadData.location
          });
        }

      } catch (error) {
        logger.error('Error syncing lead', {
          leadId: lead.id,
          dealId: lead.pipedriveDealId,
          error: error.message,
          stack: error.stack
        });
      }
    }

    // Notify via Telegram only on a cooldown to avoid repeated alerts every cron run.
    if (stillIncomplete > 0 && INCOMPLETE_LEADS_TELEGRAM_ALERTS_ENABLED) {
      const leadsToNotifyNow = stillIncompleteList.filter(l => !l.previousNotifiedAt || l.previousNotifiedAt < notifyCutoff);

      if (leadsToNotifyNow.length > 0) {
        const incompleteDetails = leadsToNotifyNow
          .slice(0, 10)
          .map(l => `• ${l.personName} (Deal #${l.dealId}): Missing ${l.missingFields.join(', ')}`)
          .join('\n');

        const message = `⚠️ *Incomplete Leads After Sync*\n\n${stillIncomplete} leads are still missing data after re-sync.\n\nNotifying for ${leadsToNotifyNow.length} lead(s) (cooldown: ${INCOMPLETE_LEADS_NOTIFY_COOLDOWN_MINUTES} min):\n\n${incompleteDetails}${leadsToNotifyNow.length > 10 ? '\n... and ' + (leadsToNotifyNow.length - 10) + ' more' : ''}`;

        await notifyTelegram(message, 'warn');

        // Mark only the leads we notified (cooldown-based).
        const leadIdsToMark = leadsToNotifyNow.map(l => l.leadId);
        await prisma.lead.updateMany({
          where: { id: { in: leadIdsToMark } },
          data: { incompleteNotifiedAt: new Date() }
        });
      }
    }

    logger.info('Incomplete leads sync completed', { synced, updated, stillIncomplete });

    return { synced, updated, stillIncomplete };

  } catch (error) {
    logger.error('Error in incomplete leads sync job', {
      error: error.message,
      stack: error.stack
    });

    await notifyTelegram(
      `🚨 *Lead Sync Error*\n\nFailed to sync incomplete leads: ${error.message}`,
      'error'
    );

    throw error;
  }
};

export default { syncIncompleteLeads };
