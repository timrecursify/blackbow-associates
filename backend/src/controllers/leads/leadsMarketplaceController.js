/**
 * Leads Marketplace Controller
 *
 * Handles browsing, filtering, and viewing leads in the marketplace
 *
 * Endpoints:
 * - GET /api/leads - Get all available leads with filters
 * - GET /api/leads/:id - Get single lead details
 */

import { prisma } from '../../config/database.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import { VENDOR_TYPE_PURCHASE_LIMIT, calculateDynamicTags, hasDelayedAccess, getDelayedAccessCutoffDate } from './leadsHelpers.js';

/**
 * Get all available leads (with filters)
 * GET /api/leads
 */
export const getLeads = asyncHandler(async (req, res) => {
  const user = req.user;
  const {
    status = 'AVAILABLE',
    location,
    servicesNeeded,
    minBudget,
    maxBudget,
    favoritesOnly,
    page = 1,
    limit = 20
  } = req.query;

  const where = { status };

  // Apply filters
  if (location) {
    where.OR = [
      { location: { contains: location, mode: 'insensitive' } },
      { city: { contains: location, mode: 'insensitive' } },
      { state: { contains: location, mode: 'insensitive' } }
    ];
  }

  if (servicesNeeded) {
    where.servicesNeeded = { has: servicesNeeded };
  }

  if (minBudget) {
    where.budgetMin = { gte: parseFloat(minBudget) };
  }

  if (maxBudget) {
    where.budgetMax = { lte: parseFloat(maxBudget) };
  }

  // Filter for favorites only
  if (favoritesOnly === 'true') {
    where.favoritedBy = {
      some: {
        userId: user.id
      }
    };
  }

  // Apply delayed access filter for Photographers and Videographers
  if (user.vendorType && hasDelayedAccess(user.vendorType)) {
    const cutoffDate = getDelayedAccessCutoffDate();
    where.createdAt = { lte: cutoffDate };
  }

  // Get user's purchased lead IDs first (for filtering)
  const userPurchases = await prisma.purchase.findMany({
    where: { userId: user.id },
    select: {
      leadId: true,
      purchasedAt: true
    }
  });
  const purchasedLeadIds = new Set(userPurchases.map(p => p.leadId));

  // Fetch ALL matching leads (no pagination yet - we'll paginate after filtering)
  const [allMatchingLeads, total, userFavorites] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' }
      // No skip/take - fetch all to filter properly
    }),
    prisma.lead.count({ where }),
    // Get all user's favorited lead IDs for quick lookup
    prisma.userLeadFavorite.findMany({
      where: { userId: user.id },
      select: { leadId: true }
    })
  ]);

  // Filter out purchased leads FIRST
  let filteredLeads = allMatchingLeads.filter(lead => !purchasedLeadIds.has(lead.id));

  // Filter out leads that have reached vendor type purchase limit
  const userVendorType = user.vendorType;

  if (userVendorType && filteredLeads.length > 0) {
    const leadIds = filteredLeads.map(l => l.id);
    const vendorPurchaseCounts = await prisma.purchase.groupBy({
      by: ['leadId'],
      where: {
        leadId: { in: leadIds },
        user: {
          vendorType: userVendorType
        }
      },
      _count: true
    });

    // Create map: leadId -> purchase count
    const purchaseCountMap = new Map();
    vendorPurchaseCounts.forEach(item => {
      purchaseCountMap.set(item.leadId, item._count);
    });

    // Filter leads: exclude if purchase count >= limit
    filteredLeads = filteredLeads.filter(lead => {
      const count = purchaseCountMap.get(lead.id) || 0;
      return count < VENDOR_TYPE_PURCHASE_LIMIT;
    });
  }

  // Calculate total filtered count (for pagination)
  const totalFiltered = filteredLeads.length;

  // Now paginate the filtered results
  const paginationSkip = (parseInt(page) - 1) * parseInt(limit);
  const paginatedLeads = filteredLeads.slice(paginationSkip, paginationSkip + parseInt(limit));

  const favoritedLeadIds = new Set(userFavorites.map(f => f.leadId));
  const purchasedLeadsMap = new Map(userPurchases.map(p => [p.leadId, p.purchasedAt]));

  // Return only masked info for available leads
  res.json({
    success: true,
    leads: paginatedLeads.map(lead => {
      const purchasedAt = purchasedLeadsMap.get(lead.id);
      const dynamicTags = calculateDynamicTags(lead, purchasedAt);

      return {
        id: lead.id,
        pipedriveDealId: lead.pipedriveDealId,
        weddingDate: lead.weddingDate,
        location: lead.location,
        city: lead.city,
        state: lead.state,
        isFavorited: favoritedLeadIds.has(lead.id),
        servicesNeeded: lead.servicesNeeded,
        price: parseFloat(lead.price),
        status: lead.status,
        description: lead.description, // Package description
        ethnicReligious: lead.ethnicReligious,
        tags: dynamicTags,
        createdAt: lead.createdAt,
        active: lead.active,
        purchasedAt: purchasedAt || null // Include purchase date for purchased leads
      };
    }),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total: totalFiltered,
      totalPages: Math.ceil(totalFiltered / limit)
    }
  });
});

/**
 * Get single lead
 * GET /api/leads/:id
 */
export const getLead = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const lead = await prisma.lead.findUnique({
    where: { id }
  });

  if (!lead) {
    throw new AppError('Lead not found', 404, 'NOT_FOUND');
  }

  // Check if user has purchased this lead
  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_leadId: {
        userId: user.id,
        leadId: id
      }
    }
  });

  // If purchased, return full info. Otherwise, masked info only.
  res.json({
    success: true,
    lead: {
      id: lead.id,
      weddingDate: lead.weddingDate,
      location: lead.location,
      city: lead.city,
      state: lead.state,
      budgetMin: lead.budgetMin ? parseFloat(lead.budgetMin) : null,
      budgetMax: lead.budgetMax ? parseFloat(lead.budgetMax) : null,
      servicesNeeded: lead.servicesNeeded,
      price: parseFloat(lead.price),
      status: lead.status,
      ...(purchase ? { fullInfo: lead.fullInfo } : { maskedInfo: lead.maskedInfo }),
      purchased: !!purchase,
      purchasedAt: purchase?.purchasedAt,
      createdAt: lead.createdAt
    }
  });
});
