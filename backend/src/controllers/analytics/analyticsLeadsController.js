/**
 * Analytics Leads Controller
 *
 * Provides lead performance analytics
 *
 * Endpoints:
 * - GET /api/admin/analytics/leads - Lead performance metrics
 */

import prisma from '../../config/database.js';
import cacheService from '../../services/cacheService.js';
import logger from '../../utils/logger.js';
import { parseDateRange, getAdminUserIds } from './analyticsHelpers.js';

/**
 * Get lead analytics
 * GET /api/admin/analytics/leads
 */
export const getLeadAnalytics = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req);
    const cacheKey = cacheService.generateKey('analytics:leads', { start, end });

    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get admin user IDs to exclude from analytics
    const adminUserIds = await getAdminUserIds();

    // Purchases by location (top 10) - EXCLUDE ADMIN PURCHASES
    const purchasesByLocation = await prisma.purchase.groupBy({
      by: ['leadId'],
      where: {
        purchasedAt: { gte: start, lte: end },
        userId: { notIn: adminUserIds }
      },
      _count: { id: true }
    });

    const leadIds = purchasesByLocation.map(p => p.leadId);
    const leads = await prisma.lead.findMany({
      where: { id: { in: leadIds } },
      select: { id: true, location: true, state: true }
    });

    const locationMap = {};
    purchasesByLocation.forEach(p => {
      const lead = leads.find(l => l.id === p.leadId);
      const location = lead?.state || lead?.location || 'Unknown';
      locationMap[location] = (locationMap[location] || 0) + p._count.id;
    });

    const topLocations = Object.entries(locationMap)
      .map(([location, count]) => ({ location, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Purchase frequency by vendor type
    const purchasesWithVendor = await prisma.purchase.findMany({
      where: { purchasedAt: { gte: start, lte: end } },
      include: { user: { select: { vendorType: true } } }
    });

    const vendorPurchases = {};
    purchasesWithVendor.forEach(p => {
      const vendor = p.user.vendorType;
      vendorPurchases[vendor] = (vendorPurchases[vendor] || 0) + 1;
    });

    const purchasesByVendorType = Object.entries(vendorPurchases)
      .map(([vendorType, count]) => ({ vendorType, count }))
      .sort((a, b) => b.count - a.count);

    // Lead status breakdown
    const statusBreakdown = await prisma.lead.groupBy({
      by: ['status'],
      _count: { id: true }
    });

    const leadsByStatus = statusBreakdown.map(group => ({
      status: group.status,
      count: group._count.id
    }));

    // Average purchases per lead - EXCLUDE ADMIN PURCHASES
    const totalLeadsWithPurchases = await prisma.lead.count({
      where: {
        purchases: {
          some: {
            userId: { notIn: adminUserIds }
          }
        }
      }
    });
    const totalPurchases = await prisma.purchase.count({
      where: { userId: { notIn: adminUserIds } }
    });
    const avgPurchasesPerLead = totalLeadsWithPurchases > 0
      ? Math.round((totalPurchases / totalLeadsWithPurchases) * 100) / 100
      : 0;

    const data = {
      topLocations,
      purchasesByVendorType,
      leadsByStatus,
      avgPurchasesPerLead
    };

    cacheService.set(cacheKey, data, 300);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get lead analytics', { error: error.message });
    next(error);
  }
};
