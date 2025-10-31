import { PrismaClient } from '@prisma/client';
import { fetchDealsByStages, transformDealToLead } from '../services/pipedrive.service.js';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Import deals from Pipedrive
 * POST /api/pipedrive/import
 */
export const importDeals = asyncHandler(async (req, res) => {
  const { stageIds, sinceDate } = req.body;

  // Default to SB stages (76, 77) and Aug 1, 2025
  const stages = stageIds || [76, 77];
  const since = sinceDate || '2025-08-01';

  logger.info(`Starting import from Pipedrive stages ${stages.join(', ')} since ${since}`);

  try {
    // Fetch deals from Pipedrive
    const deals = await fetchDealsByStages(stages, since);
    
    logger.info(`Found ${deals.length} deals to import`);

    const results = {
      total: deals.length,
      imported: 0,
      updated: 0,
      failed: 0,
      errors: []
    };

    // Process each deal
    for (const deal of deals) {
      try {
        // Transform deal to lead
        const leadData = await transformDealToLead(deal);
        
        // Check if lead already exists
        const existing = await prisma.lead.findUnique({
          where: { pipedriveDealId: deal.id }
        });

        if (existing) {
          // Update existing lead
          await prisma.lead.update({
            where: { id: existing.id },
            data: leadData
          });
          results.updated++;
          logger.info(`Updated lead for deal #${deal.id}`);
        } else {
          // Create new lead
          await prisma.lead.create({
            data: leadData
          });
          results.imported++;
          logger.info(`Imported new lead for deal #${deal.id}`);
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          dealId: deal.id,
          dealTitle: deal.title,
          error: error.message
        });
        logger.error(`Failed to import deal #${deal.id}:`, error);
      }
    }

    logger.info(`Import completed: ${results.imported} imported, ${results.updated} updated, ${results.failed} failed`);

    res.json({
      success: true,
      message: `Import completed successfully`,
      results
    });
  } catch (error) {
    logger.error('Error importing deals:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to import deals from Pipedrive',
      error: error.message
    });
  }
});

/**
 * Get import status
 * GET /api/pipedrive/status
 */
export const getImportStatus = asyncHandler(async (req, res) => {
  const totalLeads = await prisma.lead.count();
  const activeLeads = await prisma.lead.count({ where: { active: true } });
  const availableLeads = await prisma.lead.count({ where: { status: 'AVAILABLE' } });
  const soldLeads = await prisma.lead.count({ where: { status: 'SOLD' } });

  res.json({
    success: true,
    status: {
      totalLeads,
      activeLeads,
      availableLeads,
      soldLeads
    }
  });
});

export default {
  importDeals,
  getImportStatus
};
