/**
 * Analytics Controller
 *
 * Provides comprehensive analytics endpoints for admin dashboard.
 *
 * Endpoints:
 * - GET /api/admin/analytics/overview - KPI summary
 * - GET /api/admin/analytics/revenue - Revenue over time
 * - GET /api/admin/analytics/users - User growth and breakdown
 * - GET /api/admin/analytics/leads - Lead performance
 * - GET /api/admin/analytics/feedback - Feedback analytics
 * - GET /api/admin/analytics/export - Export data to CSV
 */

import prisma from '../config/database.js';
import cacheService from '../services/cacheService.js';
import logger from '../utils/logger.js';

/**
 * Parse date range from query parameters
 */
const parseDateRange = (req) => {
  const { startDate, endDate } = req.query;

  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days

  return { start, end };
};

/**
 * Get admin user IDs (cached for performance)
 * This ensures admin data is excluded from all analytics calculations
 */
let adminUserIdsCache = null;
let adminUserIdsCacheTime = null;
const ADMIN_IDS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

const getAdminUserIds = async () => {
  const now = Date.now();
  if (adminUserIdsCache && adminUserIdsCacheTime && (now - adminUserIdsCacheTime) < ADMIN_IDS_CACHE_TTL) {
    return adminUserIdsCache;
  }

  const adminUsers = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true }
  });

  adminUserIdsCache = adminUsers.map(u => u.id);
  adminUserIdsCacheTime = now;
  return adminUserIdsCache;
};

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

/**
 * Get feedback analytics
 * GET /api/admin/analytics/feedback
 */
export const getFeedbackAnalytics = async (req, res, next) => {
  try {
    const { start, end } = parseDateRange(req);
    const cacheKey = cacheService.generateKey('analytics:feedback', { start, end });

    const cached = cacheService.get(cacheKey);
    if (cached) {
      return res.json(cached);
    }

    // All feedback in date range with full details
    // Note: Using include instead of select to handle potential null relations gracefully
    const feedback = await prisma.leadFeedback.findMany({
      where: { 
        createdAt: { gte: start, lte: end }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            businessName: true,
            vendorType: true
          }
        },
        lead: {
          select: {
            id: true,
            location: true,
            weddingDate: true,
            price: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Filter out any feedback with null relations (orphaned records)
    const validFeedback = feedback.filter(f => f.user && f.lead);

    // Map to expected format for consistency
    const feedbackData = validFeedback.map(f => ({
      id: f.id,
      booked: f.booked,
      leadResponsive: f.leadResponsive,
      timeToBook: f.timeToBook,
      amountCharged: f.amountCharged,
      createdAt: f.createdAt,
      user: f.user,
      lead: f.lead
    }));

    // Booking rate over time
    const bookingByDay = {};
    feedbackData.forEach(f => {
      const date = new Date(f.createdAt).toISOString().split('T')[0];
      if (!bookingByDay[date]) {
        bookingByDay[date] = { total: 0, booked: 0 };
      }
      bookingByDay[date].total += 1;
      if (f.booked) bookingByDay[date].booked += 1;
    });

    const bookingTrend = Object.keys(bookingByDay).sort().map(date => ({
      date,
      total: bookingByDay[date].total,
      booked: bookingByDay[date].booked,
      rate: bookingByDay[date].total > 0
        ? Math.round((bookingByDay[date].booked / bookingByDay[date].total) * 100)
        : 0
    }));

    // Responsiveness breakdown
    const responsiveness = { responsive: 0, ghosted: 0, partial: 0 };
    feedbackData.forEach(f => {
      if (f.leadResponsive && f.leadResponsive in responsiveness) {
        responsiveness[f.leadResponsive] += 1;
      }
    });

    const responsivenessData = Object.entries(responsiveness).map(([type, count]) => ({
      type,
      count
    }));

    // Time to book distribution
    const timeToBook = { 'within-week': 0, '1-2-weeks': 0, '2-4-weeks': 0, 'over-month': 0 };
    feedbackData.filter(f => f.booked && f.timeToBook).forEach(f => {
      if (f.timeToBook && f.timeToBook in timeToBook) {
        timeToBook[f.timeToBook] += 1;
      }
    });

    const timeToBookData = Object.entries(timeToBook).map(([period, count]) => ({
      period,
      count
    }));

    // Average revenue per booked lead
    const bookedWithRevenue = feedbackData.filter(f => 
      f.booked && 
      f.amountCharged !== null && 
      f.amountCharged !== undefined &&
      f.amountCharged !== ''
    );
    
    const totalRevenue = bookedWithRevenue.reduce((sum, f) => {
      try {
        const amount = parseFloat(f.amountCharged);
        return sum + (isNaN(amount) ? 0 : amount);
      } catch (error) {
        logger.warn('Failed to parse amountCharged', { feedbackId: f.id, amountCharged: f.amountCharged });
        return sum;
      }
    }, 0);
    
    const avgRevenue = bookedWithRevenue.length > 0
      ? Math.round((totalRevenue / bookedWithRevenue.length) * 100) / 100
      : 0;

    const data = {
      bookingTrend,
      responsiveness: responsivenessData,
      timeToBook: timeToBookData,
      avgRevenuePerBookedLead: avgRevenue,
      totalFeedback: feedbackData.length,
      totalBooked: feedbackData.filter(f => f.booked).length,
      bookingRate: feedbackData.length > 0
        ? Math.round((feedbackData.filter(f => f.booked).length / feedbackData.length) * 100)
        : 0,
      reports: feedbackData // Full feedback reports list for admin review
    };

    cacheService.set(cacheKey, data, 300);
    res.json(data);
  } catch (error) {
    logger.error('Failed to get feedback analytics', { 
      error: error.message, 
      stack: error.stack,
      name: error.name
    });
    res.status(500).json({ 
      error: 'Failed to fetch feedback analytics', 
      message: error.message 
    });
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
