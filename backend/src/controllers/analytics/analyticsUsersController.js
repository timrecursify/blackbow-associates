/**
 * Analytics Users Controller
 *
 * Provides user analytics and engagement metrics
 *
 * Endpoints:
 * - GET /api/admin/analytics/users - User growth and breakdown
 * - GET /api/admin/analytics/user-engagement - User engagement metrics
 */

import prisma from '../../config/database.js';
import cacheService from '../../services/cacheService.js';
import logger from '../../utils/logger.js';
import { parseDateRange, getAdminUserIds } from './analyticsHelpers.js';

/**
 * Get user analytics
 * GET /api/admin/analytics/users
 */
export const getUserAnalytics = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req);
    const cacheKey = cacheService.generateKey('analytics:users', { start, end });

    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get admin user IDs to exclude from analytics
    const adminUserIds = await getAdminUserIds();

    // User growth over time - EXCLUDE ADMIN
    const users = await prisma.user.findMany({
      where: {
        createdAt: { gte: start, lte: end },
        isAdmin: false
      },
      select: { createdAt: true, vendorType: true, balance: true },
      orderBy: { createdAt: 'asc' }
    });

    const growthByDay = {};
    users.forEach(user => {
      const date = new Date(user.createdAt).toISOString().split('T')[0];
      growthByDay[date] = (growthByDay[date] || 0) + 1;
    });

    const growth = Object.keys(growthByDay).sort().map(date => ({
      date,
      count: growthByDay[date]
    }));

    // Vendor type breakdown (filter out null/empty vendor types)
    const vendorTypeGroups = await prisma.user.groupBy({
      by: ['vendorType'],
      _count: { id: true }
    });

    const vendorTypes = vendorTypeGroups
      .filter(group => group.vendorType && group.vendorType !== null) // Filter out nulls in JS
      .map(group => ({
        vendorType: group.vendorType,
        count: group._count.id
      }));

    // Balance distribution
    const balanceRanges = [
      { label: '$0', min: 0, max: 0 },
      { label: '$1-$50', min: 0.01, max: 50 },
      { label: '$51-$200', min: 51, max: 200 },
      { label: '$201-$500', min: 201, max: 500 },
      { label: '$500+', min: 501, max: 999999 }
    ];

    const balanceDistribution = await Promise.all(
      balanceRanges.map(async range => {
        const count = await prisma.user.count({
          where: {
            balance: { gte: range.min, lte: range.max },
            isAdmin: false
          }
        });
        return { label: range.label, count };
      })
    );

    // Average balance per user - EXCLUDE ADMIN
    const balanceResult = await prisma.user.aggregate({
      where: { isAdmin: false },
      _avg: { balance: true }
    });

    const data = {
      growth,
      vendorTypes,
      balanceDistribution,
      avgBalance: Math.round(parseFloat(balanceResult._avg.balance || 0) * 100) / 100
    };

    cacheService.set(cacheKey, data, 300);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get user analytics', { error: error.message });
    next(error);
  }
};

/**
 * Get user engagement analytics
 * GET /api/admin/analytics/user-engagement
 */
export const getUserEngagement = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req);
    const cacheKey = cacheService.generateKey('analytics:user-engagement', { start, end });

    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get admin user IDs to exclude from analytics
    const adminUserIds = await getAdminUserIds();

    // Calculate user retention (users who made a purchase after their first purchase) - EXCLUDE ADMIN
    const allUsers = await prisma.user.findMany({
      where: {
        createdAt: { lte: end },
        isAdmin: false
      },
      include: {
        purchases: {
          select: { purchasedAt: true },
          orderBy: { purchasedAt: 'asc' }
        }
      }
    });

    const usersWithPurchases = allUsers.filter(u => u.purchases.length > 0);
    const usersWithMultiplePurchases = usersWithPurchases.filter(u => u.purchases.length > 1);
    const retentionRate = usersWithPurchases.length > 0
      ? Math.round((usersWithMultiplePurchases.length / usersWithPurchases.length) * 100 * 100) / 100
      : 0;

    // Average purchases per user
    const totalPurchases = await prisma.purchase.count({
      where: { purchasedAt: { gte: start, lte: end } }
    });
    const totalUsers = await prisma.user.count({
      where: { createdAt: { lte: end } }
    });
    const avgPurchasesPerUser = totalUsers > 0
      ? Math.round((totalPurchases / totalUsers) * 100) / 100
      : 0;

    // Time to first purchase
    const usersWithFirstPurchase = await prisma.user.findMany({
      where: {
        purchases: { some: {} }
      },
      include: {
        purchases: {
          select: { purchasedAt: true },
          orderBy: { purchasedAt: 'asc' },
          take: 1
        }
      }
    });

    const timeToFirstPurchase = usersWithFirstPurchase
      .map(user => {
        if (user.purchases.length === 0) return null;
        const firstPurchaseDate = new Date(user.purchases[0].purchasedAt);
        const signupDate = new Date(user.createdAt);
        return Math.floor((firstPurchaseDate - signupDate) / (1000 * 60 * 60 * 24)); // days
      })
      .filter(days => days !== null);

    const avgTimeToFirstPurchase = timeToFirstPurchase.length > 0
      ? Math.round(timeToFirstPurchase.reduce((sum, days) => sum + days, 0) / timeToFirstPurchase.length)
      : 0;

    // Churn rate (users who haven't purchased in last 30 days)
    const thirtyDaysAgo = new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000);
    const activeUsers = await prisma.user.count({
      where: {
        purchases: {
          some: {
            purchasedAt: { gte: thirtyDaysAgo }
          }
        }
      }
    });

    const churnRate = totalUsers > 0
      ? Math.round(((totalUsers - activeUsers) / totalUsers) * 100 * 100) / 100
      : 0;

    // Active users trend
    const activeUsersByDay = {};
    const purchases = await prisma.purchase.findMany({
      where: { purchasedAt: { gte: start, lte: end } },
      select: {
        userId: true,
        purchasedAt: true
      },
      orderBy: { purchasedAt: 'asc' }
    });

    purchases.forEach(purchase => {
      const date = new Date(purchase.purchasedAt).toISOString().split('T')[0];
      if (!activeUsersByDay[date]) {
        activeUsersByDay[date] = new Set();
      }
      activeUsersByDay[date].add(purchase.userId);
    });

    const activeUsersTrend = Object.keys(activeUsersByDay).sort().map(date => ({
      date,
      count: activeUsersByDay[date].size
    }));

    // Top performing vendors by purchase count - EXCLUDE ADMIN
    const purchasesByVendor = await prisma.purchase.groupBy({
      by: ['userId'],
      where: {
        purchasedAt: { gte: start, lte: end },
        userId: { notIn: adminUserIds }
      },
      _count: { id: true }
    });

    const vendorIds = purchasesByVendor.map(p => p.userId);
    const vendors = await prisma.user.findMany({
      where: { id: { in: vendorIds } },
      select: { id: true, email: true, businessName: true, vendorType: true }
    });

    const topVendors = purchasesByVendor
      .map(p => {
        const vendor = vendors.find(v => v.id === p.userId);
        return {
          userId: p.userId,
          email: vendor?.email || 'Unknown',
          businessName: vendor?.businessName || null,
          vendorType: vendor?.vendorType || null,
          purchaseCount: p._count.id
        };
      })
      .sort((a, b) => b.purchaseCount - a.purchaseCount)
      .slice(0, 10);

    const data = {
      retentionRate,
      avgPurchasesPerUser,
      avgTimeToFirstPurchase,
      churnRate,
      activeUsersTrend,
      topVendors,
      totalUsers,
      activeUsers
    };

    cacheService.set(cacheKey, data, 300);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get user engagement analytics', { error: error.message });
    next(error);
  }
};
