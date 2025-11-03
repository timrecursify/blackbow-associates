/**
 * Leads Favorites Controller
 *
 * Handles user favorites for leads
 *
 * Endpoints:
 * - POST /api/leads/:leadId/favorite - Add lead to favorites
 * - DELETE /api/leads/:leadId/favorite - Remove lead from favorites
 * - GET /api/leads/favorites - Get user's favorited leads
 */

import { prisma } from '../../config/database.js';
import { logger } from '../../utils/logger.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import { calculateDynamicTags } from './leadsHelpers.js';

/**
 * Add lead to favorites
 * POST /api/leads/:leadId/favorite
 */
export const addFavorite = asyncHandler(async (req, res) => {
  const user = req.user;
  const { leadId } = req.params;

  // Check if lead exists
  const lead = await prisma.lead.findUnique({
    where: { id: leadId }
  });

  if (!lead) {
    throw new AppError('Lead not found', 404, 'NOT_FOUND');
  }

  // Check if already favorited
  const existing = await prisma.userLeadFavorite.findUnique({
    where: {
      userId_leadId: {
        userId: user.id,
        leadId
      }
    }
  });

  if (existing) {
    return res.json({
      success: true,
      message: 'Lead already in favorites'
    });
  }

  // Add to favorites
  await prisma.userLeadFavorite.create({
    data: {
      userId: user.id,
      leadId
    }
  });

  logger.info('Lead added to favorites', { userId: user.id, leadId });

  res.json({
    success: true,
    message: 'Lead added to favorites'
  });
});

/**
 * Remove lead from favorites
 * DELETE /api/leads/:leadId/favorite
 */
export const removeFavorite = asyncHandler(async (req, res) => {
  const user = req.user;
  const { leadId } = req.params;

  await prisma.userLeadFavorite.deleteMany({
    where: {
      userId: user.id,
      leadId
    }
  });

  logger.info('Lead removed from favorites', { userId: user.id, leadId });

  res.json({
    success: true,
    message: 'Lead removed from favorites'
  });
});

/**
 * Get user's favorited leads
 * GET /api/leads/favorites
 */
export const getFavorites = asyncHandler(async (req, res) => {
  const user = req.user;

  const favorites = await prisma.userLeadFavorite.findMany({
    where: { userId: user.id },
    include: {
      lead: true
    },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    favorites: favorites.map(fav => {
      const dynamicTags = calculateDynamicTags(fav.lead, null);

      return {
        id: fav.lead.id,
        pipedriveDealId: fav.lead.pipedriveDealId,
        weddingDate: fav.lead.weddingDate,
        location: fav.lead.location,
        city: fav.lead.city,
        state: fav.lead.state,
        description: fav.lead.description,
        servicesNeeded: fav.lead.servicesNeeded,
        ethnicReligious: fav.lead.ethnicReligious,
        budgetMin: fav.lead.budgetMin ? parseFloat(fav.lead.budgetMin) : null,
        budgetMax: fav.lead.budgetMax ? parseFloat(fav.lead.budgetMax) : null,
        price: parseFloat(fav.lead.price),
        status: fav.lead.status,
        tags: dynamicTags,
        createdAt: fav.lead.createdAt,
        favoritedAt: fav.createdAt
      };
    })
  });
});
