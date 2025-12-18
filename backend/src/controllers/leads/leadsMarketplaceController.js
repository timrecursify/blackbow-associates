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
import {
  VENDOR_TYPE_PURCHASE_LIMIT,
  calculateDynamicTags,
  hasDelayedAccess,
  getDelayedAccessCutoffDate
} from './leadsHelpers.js';

const US_STATE_ABBRS = new Set([
  'AL','AK','AZ','AR','CA','CO','CT','DE','FL','GA','HI','ID','IL','IN','IA','KS','KY','LA','ME','MD','MA','MI','MN','MS','MO','MT','NE','NV','NH','NJ','NM','NY','NC','ND','OH','OK','OR','PA','RI','SC','SD','TN','TX','UT','VT','VA','WA','WV','WI','WY','DC','PR'
]);

const parseCsvQuery = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.flatMap(v => String(v).split(',')).map(v => v.trim()).filter(Boolean);
  }
  return String(value).split(',').map(v => v.trim()).filter(Boolean);
};

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
    states,
    minBudget,
    maxBudget,
    favoritesOnly,
    includeFacets,
    page = 1,
    limit = 20
  } = req.query;

  const where = { status };

  // Apply text/location search
  if (location) {
    where.OR = [
      { location: { contains: location, mode: 'insensitive' } },
      { city: { contains: location, mode: 'insensitive' } },
      { state: { contains: location, mode: 'insensitive' } }
    ];
  }

  // Apply services filter (supports single or CSV list)
  const servicesList = parseCsvQuery(servicesNeeded);
  if (servicesList.length === 1) {
    where.servicesNeeded = { has: servicesList[0] };
  } else if (servicesList.length > 1) {
    where.servicesNeeded = { hasSome: servicesList };
  }

  // Apply state filter (CSV list)
  const stateList = parseCsvQuery(states)
    .map(s => s.toUpperCase())
    .filter(s => US_STATE_ABBRS.has(s));

  if (stateList.length > 0) {
    where.state = { in: stateList };
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
  const [allMatchingLeads, userFavorites] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' }
    }),
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

    const purchaseCountMap = new Map();
    vendorPurchaseCounts.forEach(item => {
      purchaseCountMap.set(item.leadId, item._count);
    });

    filteredLeads = filteredLeads.filter(lead => {
      const count = purchaseCountMap.get(lead.id) || 0;
      return count < VENDOR_TYPE_PURCHASE_LIMIT;
    });
  }

  // Facets (computed on full filtered set)
  let facets = undefined;
  if (includeFacets === 'true') {
    const stateCounts = new Map();
    const serviceCounts = new Map();

    for (const lead of filteredLeads) {
      if (lead.state && US_STATE_ABBRS.has(String(lead.state).toUpperCase())) {
        const s = String(lead.state).toUpperCase();
        stateCounts.set(s, (stateCounts.get(s) || 0) + 1);
      }

      if (Array.isArray(lead.servicesNeeded)) {
        for (const svc of lead.servicesNeeded) {
          if (!svc) continue;
          const key = String(svc);
          serviceCounts.set(key, (serviceCounts.get(key) || 0) + 1);
        }
      }
    }

    facets = {
      states: Array.from(stateCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value)),
      services: Array.from(serviceCounts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))
    };
  }

  const totalFiltered = filteredLeads.length;

  // Now paginate the filtered results
  const paginationSkip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
  const paginatedLeads = filteredLeads.slice(paginationSkip, paginationSkip + parseInt(limit, 10));

  const favoritedLeadIds = new Set(userFavorites.map(f => f.leadId));
  const purchasedLeadsMap = new Map(userPurchases.map(p => [p.leadId, p.purchasedAt]));

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
        description: lead.description,
        ethnicReligious: lead.ethnicReligious,
        tags: dynamicTags,
        createdAt: lead.createdAt,
        active: lead.active,
        purchasedAt: purchasedAt || null
      };
    }),
    pagination: {
      page: parseInt(page, 10),
      limit: parseInt(limit, 10),
      total: totalFiltered,
      totalPages: Math.ceil(totalFiltered / parseInt(limit, 10))
    },
    ...(facets ? { facets } : {})
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

  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_leadId: {
        userId: user.id,
        leadId: id
      }
    }
  });

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
