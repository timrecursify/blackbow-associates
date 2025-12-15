import prisma from '../config/database.js';
import { transformDealToLead } from './pipedrive.service.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import axios from 'axios';

const PIPEDRIVE_API_TOKEN = process.env.PIPEDRIVE_API_TOKEN;

/**
 * Sync incomplete leads from Pipedrive
 * Checks for leads missing location or other critical data
 * Only processes leads created more than 10 minutes ago (to allow pixel to populate)
 */
export const syncIncompleteLeads = async () => {
  try {
    logger.info('Starting incomplete leads sync job');

    // Find leads that are missing critical data
    // Only check leads created more than 10 minutes ago (to allow pixel time to populate)
    const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const incompleteLeads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: oneDayAgo, // Only check leads from last 24 hours
          lte: tenMinutesAgo // Created more than 10 minutes ago
        },
        OR: [
          { location: null },
          { location: 'Location TBD' },
          { city: null },
          { state: null },
          { weddingDate: null },
          { servicesNeeded: { equals: [] } }
        ]
      },
      take: 50 // Limit to 50 per run to avoid overload
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

        // Transform deal to lead with fresh data
        const freshLeadData = await transformDealToLead(deal);

        // Check if data is still incomplete
        const isStillIncomplete = 
          !freshLeadData.location || 
          freshLeadData.location === 'Location TBD' ||
          !freshLeadData.city ||
          !freshLeadData.state ||
          !freshLeadData.weddingDate ||
          !freshLeadData.servicesNeeded || 
          freshLeadData.servicesNeeded.length === 0;

        if (isStillIncomplete) {
          stillIncomplete++;
          stillIncompleteList.push({
            dealId: lead.pipedriveDealId,
            personName: freshLeadData.personName || lead.personName,
            location: freshLeadData.location || 'null',
            missingFields: []
          });

          if (!freshLeadData.location || freshLeadData.location === 'Location TBD') {
            stillIncompleteList[stillIncompleteList.length - 1].missingFields.push('location');
          }
          if (!freshLeadData.city) {
            stillIncompleteList[stillIncompleteList.length - 1].missingFields.push('city');
          }
          if (!freshLeadData.state) {
            stillIncompleteList[stillIncompleteList.length - 1].missingFields.push('state');
          }
          if (!freshLeadData.weddingDate) {
            stillIncompleteList[stillIncompleteList.length - 1].missingFields.push('weddingDate');
          }
          if (!freshLeadData.servicesNeeded || freshLeadData.servicesNeeded.length === 0) {
            stillIncompleteList[stillIncompleteList.length - 1].missingFields.push('services');
          }
        }

        // Update lead in database
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
            updatedAt: new Date()
          }
        });

        synced++;
        if (!isStillIncomplete) {
          updated++;
          logger.info('Lead synced and completed', {
            leadId: lead.id,
            dealId: lead.pipedriveDealId,
            personName: freshLeadData.personName
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
        .slice(0, 10) // Limit to first 10 for notification
        .map(l => `• ${l.personName} (Deal #${l.dealId}): Missing ${l.missingFields.join(', ')}`)
        .join('\n');

      const message = `⚠️ *Incomplete Leads After Sync*\n\n${stillIncomplete} leads still missing data after re-sync:\n\n${incompleteDetails}${stillIncomplete > 10 ? '\n... and ' + (stillIncomplete - 10) + ' more' : ''}`;

      await notifyTelegram(message, 'warn');
    }

    // Send success notification if leads were updated
    if (updated > 0) {
      await notifyTelegram(
        `✅ *Lead Sync Complete*\n\n${updated} leads updated with fresh data from Pipedrive`,
        'success'
      );
    }

    logger.info('Incomplete leads sync completed', {
      synced,
      updated,
      stillIncomplete
    });

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

export default {
  syncIncompleteLeads
};
