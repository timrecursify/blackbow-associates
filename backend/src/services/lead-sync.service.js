import prisma from '../config/database.js';
import { transformDealToLead } from './pipedrive.service.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import axios from 'axios';

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

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
 * Check if location needs to be re-synced
 */
const needsLocationSync = (location, state) => {
  if (!location || !state) return true;
  const lower = location.toLowerCase().trim();
  return INVALID_LOCATION_TERMS.some(term => lower.includes(term));
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
    const thirtyDaysAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);

    // Find leads that are missing critical data OR have generic locations
    const incompleteLeads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: thirtyDaysAgo, // Check leads from last 30 days
          lte: tenMinutesAgo  // Created more than 10 minutes ago
        },
        OR: [
          { location: null },
          { location: 'Location TBD' },
          { location: { contains: 'Other Destinations', mode: 'insensitive' } },
          { location: { contains: 'Other Destination', mode: 'insensitive' } },
          { city: null },
          { state: null },
          { weddingDate: null },
          { servicesNeeded: { equals: [] } }
        ]
      },
      take: 500 // Process up to 100 per run
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

        // Check if data is still incomplete
        const isStillIncomplete = needsLocationSync(freshLeadData.location, freshLeadData.state) ||
          !freshLeadData.weddingDate ||
          !freshLeadData.servicesNeeded || 
          freshLeadData.servicesNeeded.length === 0;

        if (isStillIncomplete) {
          stillIncomplete++;
          stillIncompleteList.push({
            leadId: lead.id,
            dealId: lead.pipedriveDealId,
            personName: freshLeadData.personName || lead.personName,
            location: freshLeadData.location || 'null',
            missingFields: []
          });

          const lastItem = stillIncompleteList[stillIncompleteList.length - 1];
          if (needsLocationSync(freshLeadData.location, freshLeadData.state)) lastItem.missingFields.push('location');
          if (!freshLeadData.weddingDate) lastItem.missingFields.push('weddingDate');
          if (!freshLeadData.servicesNeeded || freshLeadData.servicesNeeded.length === 0) lastItem.missingFields.push('services');
        }

        // Update lead in database (always update to get latest data)
        await prisma.lead.update({
          where: { id: lead.id },
          data: {
            location: freshLeadData.location,
            city: freshLeadData.city,
            state: freshLeadData.state,
            weddingDate: freshLeadData.weddingDate,
            description: freshLeadData.description,
            servicesNeeded: freshLeadData.servicesNeeded,
            maskedInfo: freshLeadData.maskedInfo,
            fullInfo: freshLeadData.fullInfo,
            incompleteNotifiedAt: null, // Reset notification so we can re-check
            updatedAt: new Date()
          }
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

    // Send Telegram notification if there are still incomplete leads
    if (stillIncomplete > 0) {
      const incompleteDetails = stillIncompleteList
        .slice(0, 10)
        .map(l => `• ${l.personName} (Deal #${l.dealId}): Missing ${l.missingFields.join(', ')}`)
        .join('\n');

      const message = `⚠️ *Incomplete Leads After Sync*\n\n${stillIncomplete} leads still missing data after re-sync:\n\n${incompleteDetails}${stillIncomplete > 10 ? '\n... and ' + (stillIncomplete - 10) + ' more' : ''}`;

      await notifyTelegram(message, 'warn');

      // Mark these leads as notified
      const leadIdsToMark = stillIncompleteList.map(l => l.leadId);
      await prisma.lead.updateMany({
        where: { id: { in: leadIdsToMark } },
        data: { incompleteNotifiedAt: new Date() }
      });
    }

    // Send success notification if leads were updated
    if (updated > 0) {
      await notifyTelegram(
        `✅ *Lead Sync Complete*\n\n${updated} leads updated with fresh location data from Pipedrive`,
        'success'
      );
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
