/**
 * Analytics Revenue Controller
 *
 * Provides revenue analytics and growth metrics
 *
 * Endpoints:
 * - GET /api/admin/analytics/revenue - Revenue over time
 * - GET /api/admin/analytics/revenue-growth - Revenue growth (MoM/YoY)
 */

import prisma from '../../config/database.js';
import cacheService from '../../services/cacheService.js';
import logger from '../../utils/logger.js';
import { parseDateRange, getAdminUserIds } from './analyticsHelpers.js';

/**
 * Get revenue analytics over time
 * GET /api/admin/analytics/revenue
 */
export const getRevenueAnalytics = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req);
    const { groupBy = 'day' } = req.query;
    const cacheKey = cacheService.generateKey('analytics:revenue', { start, end, groupBy });

    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get admin user IDs to exclude from analytics
    const adminUserIds = await getAdminUserIds();

    // Get all transactions in date range - EXCLUDE ADMIN
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        type: { in: ['DEPOSIT', 'PURCHASE', 'REFUND', 'ADJUSTMENT', 'FEEDBACK_REWARD'] },
        userId: { notIn: adminUserIds }
      },
      select: {
        amount: true,
        type: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by time period
    const grouped = {};
    transactions.forEach(tx => {
      const date = new Date(tx.createdAt);
      let key;

      if (groupBy === 'month') {
        key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      } else if (groupBy === 'week') {
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().split('T')[0];
      } else {
        key = date.toISOString().split('T')[0];
      }

      if (!grouped[key]) {
        grouped[key] = { deposits: 0, purchases: 0, refunds: 0, adjustments: 0, rewards: 0 };
      }

      const amount = parseFloat(tx.amount);
      if (tx.type === 'DEPOSIT') grouped[key].deposits += amount;
      else if (tx.type === 'PURCHASE') grouped[key].purchases += amount;
      else if (tx.type === 'REFUND') grouped[key].refunds += amount;
      else if (tx.type === 'ADJUSTMENT') grouped[key].adjustments += amount;
      else if (tx.type === 'FEEDBACK_REWARD') grouped[key].rewards += amount;
    });

    // Convert to array and calculate net
    const data = Object.keys(grouped).sort().map(date => ({
      date,
      deposits: Math.round(grouped[date].deposits * 100) / 100,
      purchases: Math.round(grouped[date].purchases * 100) / 100,
      refunds: Math.round(grouped[date].refunds * 100) / 100,
      adjustments: Math.round(grouped[date].adjustments * 100) / 100,
      rewards: Math.round(grouped[date].rewards * 100) / 100,
      net: Math.round((grouped[date].deposits - grouped[date].purchases + grouped[date].refunds) * 100) / 100
    }));

    cacheService.set(cacheKey, data, 300);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get revenue analytics', { error: error.message });
    next(error);
  }
};

/**
 * Get revenue growth analytics
 * GET /api/admin/analytics/revenue-growth
 */
export const getRevenueGrowth = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req);
    const cacheKey = cacheService.generateKey('analytics:revenue-growth', { start, end });

    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get admin user IDs to exclude from analytics
    const adminUserIds = await getAdminUserIds();

    // Get monthly revenue for MoM and YoY comparison - EXCLUDE ADMIN
    const transactions = await prisma.transaction.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        type: { in: ['DEPOSIT', 'PURCHASE', 'REFUND'] },
        userId: { notIn: adminUserIds }
      },
      select: {
        amount: true,
        type: true,
        createdAt: true
      },
      orderBy: { createdAt: 'asc' }
    });

    // Group by month
    const monthlyData = {};
    transactions.forEach(tx => {
      const date = new Date(tx.createdAt);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;

      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { deposits: 0, purchases: 0, refunds: 0 };
      }

      const amount = parseFloat(tx.amount);
      if (tx.type === 'DEPOSIT') monthlyData[monthKey].deposits += amount;
      else if (tx.type === 'PURCHASE') monthlyData[monthKey].purchases += amount;
      else if (tx.type === 'REFUND') monthlyData[monthKey].refunds += amount;
    });

    const sortedMonths = Object.keys(monthlyData).sort();
    const growthData = sortedMonths.map((month, index) => {
      const monthRevenue = monthlyData[month].deposits - monthlyData[month].purchases + monthlyData[month].refunds;
      const prevMonthRevenue = index > 0
        ? monthlyData[sortedMonths[index - 1]].deposits - monthlyData[sortedMonths[index - 1]].purchases + monthlyData[sortedMonths[index - 1]].refunds
        : null;

      const momGrowth = prevMonthRevenue !== null && prevMonthRevenue > 0
        ? ((monthRevenue - prevMonthRevenue) / prevMonthRevenue) * 100
        : null;

      return {
        month,
        revenue: Math.round(monthRevenue * 100) / 100,
        momGrowth: momGrowth !== null ? Math.round(momGrowth * 100) / 100 : null
      };
    });

    // Calculate average revenue per user (ARPU) - EXCLUDE ADMIN
    const totalRevenue = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        createdAt: { gte: start, lte: end },
        userId: { notIn: adminUserIds }
      },
      _sum: { amount: true }
    });

    const activeUsers = await prisma.user.count({
      where: {
        onboardingCompleted: true,
        createdAt: { lte: end },
        isAdmin: false
      }
    });

    const arpu = activeUsers > 0
      ? Math.round((parseFloat(totalRevenue._sum.amount || 0) / activeUsers) * 100) / 100
      : 0;

    // Calculate refund rate - EXCLUDE ADMIN
    const refunds = await prisma.transaction.aggregate({
      where: {
        type: 'REFUND',
        createdAt: { gte: start, lte: end },
        userId: { notIn: adminUserIds }
      },
      _sum: { amount: true },
      _count: { id: true }
    });

    const deposits = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        createdAt: { gte: start, lte: end },
        userId: { notIn: adminUserIds }
      },
      _count: { id: true }
    });

    const refundRate = deposits._count.id > 0
      ? Math.round((refunds._count.id / deposits._count.id) * 100 * 100) / 100
      : 0;

    // Revenue by vendor type - EXCLUDE ADMIN
    const purchasesWithVendor = await prisma.purchase.findMany({
      where: {
        purchasedAt: { gte: start, lte: end },
        userId: { notIn: adminUserIds }
      },
      include: {
        user: { select: { vendorType: true } },
        lead: { select: { price: true } }
      }
    });

    const revenueByVendorType = {};
    purchasesWithVendor.forEach(p => {
      const vendorType = p.user.vendorType || 'Unknown';
      if (!revenueByVendorType[vendorType]) {
        revenueByVendorType[vendorType] = 0;
      }
      revenueByVendorType[vendorType] += parseFloat(p.lead.price);
    });

    const revenueByVendorTypeData = Object.entries(revenueByVendorType)
      .map(([vendorType, revenue]) => ({
        vendorType,
        revenue: Math.round(revenue * 100) / 100
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const data = {
      growth: growthData,
      arpu,
      refundRate,
      revenueByVendorType: revenueByVendorTypeData,
      totalRevenue: Math.round(parseFloat(totalRevenue._sum.amount || 0) * 100) / 100
    };

    cacheService.set(cacheKey, data, 300);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get revenue growth analytics', { error: error.message });
    next(error);
  }
};
