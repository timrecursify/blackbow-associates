/**
 * Analytics Routes
 *
 * All routes require admin authentication.
 *
 * Query Parameters:
 * - startDate: ISO date string (default: 30 days ago)
 * - endDate: ISO date string (default: today)
 * - groupBy: 'day' | 'week' | 'month' (for time-series data)
 */

import express from 'express';
import { requireAuth, requireAdmin } from '../middleware/auth.js';
import { auditLog } from '../middleware/auditLogger.js';
import { analyticsLimiter } from '../middleware/rateLimiter.js';
import { getOverview, exportAnalytics } from '../controllers/analytics/analyticsOverviewController.js';
import { getRevenueAnalytics, getRevenueGrowth } from '../controllers/analytics/analyticsRevenueController.js';
import { getUserAnalytics, getUserEngagement } from '../controllers/analytics/analyticsUsersController.js';
import { getLeadAnalytics } from '../controllers/analytics/analyticsLeadsController.js';
import { getFeedbackAnalytics } from '../controllers/analytics/analyticsFeedbackController.js';

const router = express.Router();

// All routes require admin authentication, rate limiting, and audit logging
router.use(requireAuth, requireAdmin, analyticsLimiter, auditLog);

/**
 * GET /api/admin/analytics/overview
 *
 * Get high-level KPIs for dashboard overview.
 *
 * Returns:
 * - revenue (total, count, avgOrderValue)
 * - purchases (total, count)
 * - netProfit
 * - users (total, active, activePercentage)
 * - leads (total, available, availablePercentage)
 * - conversionRate
 * - bookingRate
 * - totalBalance
 */
router.get('/overview', getOverview);

/**
 * GET /api/admin/analytics/revenue
 *
 * Get revenue data over time.
 *
 * Query: groupBy=day|week|month
 *
 * Returns array of:
 * - date
 * - deposits
 * - purchases
 * - refunds
 * - adjustments
 * - rewards
 * - net
 */
router.get('/revenue', getRevenueAnalytics);

/**
 * GET /api/admin/analytics/users
 *
 * Get user growth and breakdown analytics.
 *
 * Returns:
 * - growth: [{date, count}]
 * - vendorTypes: [{vendorType, count}]
 * - balanceDistribution: [{label, count}]
 * - avgBalance
 */
router.get('/users', getUserAnalytics);

/**
 * GET /api/admin/analytics/leads
 *
 * Get lead performance analytics.
 *
 * Returns:
 * - topLocations: [{location, count}]
 * - purchasesByVendorType: [{vendorType, count}]
 * - leadsByStatus: [{status, count}]
 * - avgPurchasesPerLead
 */
router.get('/leads', getLeadAnalytics);

/**
 * GET /api/admin/analytics/feedback
 *
 * Get feedback and quality analytics.
 *
 * Returns:
 * - bookingTrend: [{date, total, booked, rate}]
 * - responsiveness: [{type, count}]
 * - timeToBook: [{period, count}]
 * - avgRevenuePerBookedLead
 * - totalFeedback
 * - totalBooked
 * - bookingRate
 */
router.get('/feedback', getFeedbackAnalytics);

/**
 * GET /api/admin/analytics/export
 *
 * Export analytics data to CSV.
 *
 * Query: type=users|transactions|leads
 *
 * Returns: CSV file download
 */
router.get('/export', exportAnalytics);

/**
 * GET /api/admin/analytics/revenue-growth
 *
 * Get revenue growth metrics including MoM growth, ARPU, refund rate, and revenue by vendor type.
 *
 * Returns:
 * - growth: [{month, revenue, momGrowth}]
 * - arpu: Average Revenue Per User
 * - refundRate: Percentage of transactions refunded
 * - revenueByVendorType: [{vendorType, revenue}]
 * - totalRevenue
 */
router.get('/revenue-growth', getRevenueGrowth);

/**
 * GET /api/admin/analytics/user-engagement
 *
 * Get user engagement metrics including retention, churn, purchase frequency, and active users.
 *
 * Returns:
 * - retentionRate: % of users who made multiple purchases
 * - avgPurchasesPerUser: Average purchases per user
 * - avgTimeToFirstPurchase: Average days from signup to first purchase
 * - churnRate: % of users who haven't purchased in last 30 days
 * - activeUsersTrend: [{date, count}]
 * - topVendors: Top 10 vendors by purchase count
 * - totalUsers
 * - activeUsers
 */
router.get('/user-engagement', getUserEngagement);

export default router;
