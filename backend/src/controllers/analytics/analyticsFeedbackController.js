/**
 * Analytics Feedback Controller
 *
 * Provides feedback and booking analytics
 *
 * Endpoints:
 * - GET /api/admin/analytics/feedback - Feedback analytics and booking metrics
 */

import prisma from '../../config/database.js';
import cacheService from '../../services/cacheService.js';
import logger from '../../utils/logger.js';
import { parseDateRange } from './analyticsHelpers.js';

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
