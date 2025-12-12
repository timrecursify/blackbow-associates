import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger.js';

const prisma = new PrismaClient();

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

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

/**
 * Get last sync status
 * GET /api/pipedrive/sync-status
 * TODO: Repurpose this for webhook statistics
 */
export const getSyncStatus = asyncHandler(async (req, res) => {
  // TODO: Replace with webhook statistics
  res.json({
    success: true,
    status: {
      message: 'Webhook-based sync is now active. Legacy polling removed.'
    }
  });
});

export default {
  getImportStatus,
  getSyncStatus
};
