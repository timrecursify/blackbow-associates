/**
 * Analytics Overview Controller
 *
 * Provides KPI overview and data export endpoints
 *
 * Endpoints:
 * - GET /api/admin/analytics/overview - KPI summary
 * - GET /api/admin/analytics/export - Export data to CSV
 */

import prisma from '../../config/database.js';
import cacheService from '../../services/cacheService.js';
import logger from '../../utils/logger.js';
import { parseDateRange, getAdminUserIds } from './analyticsHelpers.js';

/**
 * Get KPI overview
 * GET /api/admin/analytics/overview
 */
export const getOverview = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req);
    const cacheKey = cacheService.generateKey('analytics:overview', { start, end });

    // Check cache
    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // Get admin user IDs to exclude from analytics
    const adminUserIds = await getAdminUserIds();

    // Total revenue (all DEPOSIT transactions) - EXCLUDE ADMIN
    const revenueResult = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        createdAt: { gte: start, lte: end },
        userId: { notIn: adminUserIds }
      },
      _sum: { amount: true }
    });

    // Total purchases (all PURCHASE transactions) - EXCLUDE ADMIN
    const purchasesResult = await prisma.transaction.aggregate({
      where: {
        type: 'PURCHASE',
        createdAt: { gte: start, lte: end },
        userId: { notIn: adminUserIds }
      },
      _sum: { amount: true }
    });

    // Active users (onboardingCompleted = true) - EXCLUDE ADMIN
    const activeUsers = await prisma.user.count({
      where: {
        onboardingCompleted: true,
        isAdmin: false
      }
    });

    // Total users - EXCLUDE ADMIN
    const totalUsers = await prisma.user.count({
      where: { isAdmin: false }
    });

    // Available leads
    const availableLeads = await prisma.lead.count({
      where: { status: 'AVAILABLE', active: true }
    });

    // Total leads
    const totalLeads = await prisma.lead.count();

    // Conversion rate (purchases / available leads) - EXCLUDE ADMIN PURCHASES
    const totalPurchases = await prisma.purchase.count({
      where: { userId: { notIn: adminUserIds } }
    });
    const conversionRate = totalLeads > 0 ? (totalPurchases / totalLeads) * 100 : 0;

    // Booking rate (from feedback) - EXCLUDE ADMIN FEEDBACK
    const totalFeedback = await prisma.leadFeedback.count({
      where: { userId: { notIn: adminUserIds } }
    });
    const bookedFeedback = await prisma.leadFeedback.count({
      where: {
        booked: true,
        userId: { notIn: adminUserIds }
      }
    });
    const bookingRate = totalFeedback > 0 ? (bookedFeedback / totalFeedback) * 100 : 0;

    // Average order value (total revenue / number of deposits) - EXCLUDE ADMIN
    const depositCount = await prisma.transaction.count({
      where: {
        type: 'DEPOSIT',
        createdAt: { gte: start, lte: end },
        userId: { notIn: adminUserIds }
      }
    });
    const avgOrderValue = depositCount > 0 ? parseFloat(revenueResult._sum.amount || 0) / depositCount : 0;

    // Net profit (revenue - purchases) - EXCLUDE ADMIN
    const totalRevenue = parseFloat(revenueResult._sum.amount || 0);
    const totalPurchaseAmount = parseFloat(purchasesResult._sum.amount || 0);
    const netProfit = totalRevenue - totalPurchaseAmount;

    // Total balance in system (deposit leftovers) - EXCLUDE ADMIN BALANCES
    const balanceResult = await prisma.user.aggregate({
      where: { isAdmin: false },
      _sum: { balance: true }
    });
    const totalBalance = parseFloat(balanceResult._sum.balance || 0);

    // Total deposits overall (all time) - EXCLUDE ADMIN
    const totalDepositsResult = await prisma.transaction.aggregate({
      where: {
        type: 'DEPOSIT',
        userId: { notIn: adminUserIds }
      },
      _sum: { amount: true },
      _count: { id: true }
    });
    const totalDeposits = parseFloat(totalDepositsResult._sum.amount || 0);
    const totalDepositsCount = totalDepositsResult._count.id;

    const data = {
      revenue: {
        total: totalRevenue,
        count: depositCount,
        avgOrderValue: Math.round(avgOrderValue * 100) / 100
      },
      purchases: {
        total: totalPurchaseAmount,
        count: totalPurchases
      },
      netProfit: Math.round(netProfit * 100) / 100,
      users: {
        total: totalUsers,
        active: activeUsers,
        activePercentage: totalUsers > 0 ? Math.round((activeUsers / totalUsers) * 100) : 0
      },
      leads: {
        total: totalLeads,
        available: availableLeads,
        availablePercentage: totalLeads > 0 ? Math.round((availableLeads / totalLeads) * 100) : 0
      },
      conversionRate: Math.round(conversionRate * 100) / 100,
      bookingRate: Math.round(bookingRate * 100) / 100,
      totalBalance: Math.round(totalBalance * 100) / 100,
      totalDeposits: Math.round(totalDeposits * 100) / 100,
      totalDepositsCount,
      dateRange: { start, end }
    };

    // Cache for 5 minutes
    cacheService.set(cacheKey, data, 300);

    res.json(data);
  } catch (error) {
    logger.error('Failed to get analytics overview', { error: error.message });
    next(error);
  }
};

/**
 * Export analytics data to CSV
 * GET /api/admin/analytics/export
 */
export const exportAnalytics = async (req, res, next) => {
  try {
    const { type = 'users', startDate, endDate } = req.query;
    const { start, end } = parseDateRange(req);

    let csvData = '';
    let filename = '';

    switch (type) {
      case 'users':
        const users = await prisma.user.findMany({
          where: { createdAt: { gte: start, lte: end } },
          select: {
            email: true,
            businessName: true,
            vendorType: true,
            balance: true,
            isAdmin: true,
            createdAt: true,
            _count: { select: { purchases: true, transactions: true } }
          }
        });
        csvData = 'Email,Business Name,Vendor Type,Balance,Admin,Purchases,Transactions,Created At\n';
        users.forEach(u => {
          csvData += `${u.email},${u.businessName},${u.vendorType},${u.balance},${u.isAdmin},${u._count.purchases},${u._count.transactions},${u.createdAt.toISOString()}\n`;
        });
        filename = `users_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`;
        break;

      case 'transactions':
        // Get admin user IDs to exclude from export
        const adminUserIdsTxExport = await getAdminUserIds();

        const transactions = await prisma.transaction.findMany({
          where: {
            createdAt: { gte: start, lte: end },
            userId: { notIn: adminUserIdsTxExport }
          },
          include: { user: { select: { email: true, businessName: true } } },
          orderBy: { createdAt: 'desc' }
        });
        csvData = 'Date,User Email,Business Name,Type,Amount,Balance After,Description\n';
        transactions.forEach(t => {
          csvData += `${t.createdAt.toISOString()},${t.user.email},${t.user.businessName},${t.type},${t.amount},${t.balanceAfter},"${t.description || ''}"\n`;
        });
        filename = `transactions_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`;
        break;

      case 'leads':
        const leads = await prisma.lead.findMany({
          where: { createdAt: { gte: start, lte: end } },
          select: {
            id: true,
            location: true,
            weddingDate: true,
            status: true,
            price: true,
            servicesNeeded: true,
            createdAt: true,
            _count: { select: { purchases: true } }
          }
        });
        csvData = 'Lead ID,Location,Wedding Date,Status,Price,Services,Purchases,Created At\n';
        leads.forEach(l => {
          csvData += `${l.id},${l.location || ''},${l.weddingDate ? l.weddingDate.toISOString().split('T')[0] : ''},${l.status},${l.price},${l.servicesNeeded.join(';')},${l._count.purchases},${l.createdAt.toISOString()}\n`;
        });
        filename = `leads_${start.toISOString().split('T')[0]}_${end.toISOString().split('T')[0]}.csv`;
        break;

      default:
        return res.status(400).json({ error: 'Invalid export type' });
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvData);

    logger.info('Analytics data exported', {
      type,
      dateRange: { start, end },
      adminId: req.user?.id
    });
  } catch (error) {
    logger.error('Failed to export analytics', { error: error.message });
    next(error);
  }
};
