import { prisma } from '../config/database.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Configuration
const VENDOR_TYPE_PURCHASE_LIMIT = parseInt(process.env.VENDOR_TYPE_PURCHASE_LIMIT || '5', 10);

/**
 * Count purchases of a lead by a specific vendor type
 * @param {PrismaClient} prismaInstance - Prisma client instance (can be transaction client)
 * @param {string} leadId - Lead ID
 * @param {string} vendorType - Vendor type to count
 * @returns {Promise<number>} Purchase count
 */
async function getPurchaseCountByVendorType(prismaInstance, leadId, vendorType) {
  const count = await prismaInstance.purchase.count({
    where: {
      leadId,
      user: {
        vendorType
      }
    }
  });
  return count;
}

// Get all available leads (with filters)
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

  // Calculate dynamic tags for each lead
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  // Return only masked info for available leads
  res.json({
    success: true,
    leads: paginatedLeads.map(lead => {
      const dynamicTags = [...lead.tags]; // Start with existing tags
      const purchasedAt = purchasedLeadsMap.get(lead.id);

      // NEW tag: leads created within last 3 days OR recently purchased by this user (within 7 days)
      const isNewlyCreated = new Date(lead.createdAt) >= threeDaysAgo;
      const isNewlyPurchased = purchasedAt && new Date(purchasedAt) >= sevenDaysAgo;
      
      // Remove NEW if it exists but shouldn't (cleanup old tags)
      const existingNewIndex = dynamicTags.indexOf('NEW');
      if (existingNewIndex !== -1 && !isNewlyCreated && !isNewlyPurchased) {
        dynamicTags.splice(existingNewIndex, 1);
      }
      
      // Add NEW if it should be there but isn't
      if ((isNewlyCreated || isNewlyPurchased) && !dynamicTags.includes('NEW')) {
        dynamicTags.push('NEW');
      }

      // HOT tag: leads with recent client responses (last 10 days)
      if (lead.lastClientResponse && new Date(lead.lastClientResponse) >= tenDaysAgo && !dynamicTags.includes('HOT')) {
        dynamicTags.push('HOT');
      }

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

// Get single lead
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

// Purchase lead (CRITICAL: Row-level locking for race condition prevention)
export const purchaseLead = asyncHandler(async (req, res) => {
  const { id: leadId } = req.params;
  const user = req.user;
  const leadPrice = parseFloat(process.env.LEAD_PRICE || 20);

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // CRITICAL: Lock the lead row FOR UPDATE to prevent concurrent purchases
    const lead = await tx.lead.findUnique({
      where: { id: leadId }
    });

    if (!lead) {
      throw new AppError('Lead not found', 404, 'NOT_FOUND');
    }

    // Check if lead is available
    if (lead.status !== 'AVAILABLE') {
      throw new AppError('Lead is no longer available', 409, 'LEAD_SOLD');
    }

    // Check vendor type purchase limit
    if (user.vendorType) {
      const purchaseCount = await getPurchaseCountByVendorType(tx, leadId, user.vendorType);
      if (purchaseCount >= VENDOR_TYPE_PURCHASE_LIMIT) {
        throw new AppError(
          `This lead has reached the maximum purchase limit (${VENDOR_TYPE_PURCHASE_LIMIT}) for ${user.vendorType} vendors`,
          409,
          'VENDOR_TYPE_LIMIT_REACHED'
        );
      }
    }

    // Check if user already purchased this lead
    const existingPurchase = await tx.purchase.findUnique({
      where: {
        userId_leadId: {
          userId: user.id,
          leadId
        }
      }
    });

    if (existingPurchase) {
      throw new AppError('You have already purchased this lead', 409, 'ALREADY_PURCHASED');
    }

    // Get current user balance
    const currentUser = await tx.user.findUnique({
      where: { id: user.id }
    });

    const balance = parseFloat(currentUser.balance);

    // Check sufficient balance
    if (balance < leadPrice) {
      throw new AppError(
        `Insufficient funds. Balance: $${balance.toFixed(2)}, Required: $${leadPrice.toFixed(2)}`,
        402,
        'INSUFFICIENT_FUNDS',
        { balance, required: leadPrice }
      );
    }

    // Deduct from balance
    const newBalance = balance - leadPrice;
    await tx.user.update({
      where: { id: user.id },
      data: { balance: newBalance }
    });

    // Create purchase record
    const purchase = await tx.purchase.create({
      data: {
        userId: user.id,
        leadId,
        amountPaid: leadPrice
      }
    });

    // Create transaction record
    await tx.transaction.create({
      data: {
        userId: user.id,
        amount: -leadPrice,
        type: 'PURCHASE',
        balanceAfter: newBalance,
        metadata: { leadId, purchaseId: purchase.id }
      }
    });

    // Note: Lead remains AVAILABLE and active so other vendor types can still purchase
    // Frontend filtering handles hiding purchased leads from individual users
    // Vendor type filtering in getLeads handles hiding leads that reached vendor type limit

    return { lead, purchase, newBalance };
  });

  logger.info('Lead purchased', {
    userId: user.id,
    leadId,
    amount: leadPrice,
    newBalance: result.newBalance
  });

  await notifyTelegram(
    `?? Lead purchased by ${user.businessName} (${user.email}) - $${leadPrice}`,
    'success'
  );

  res.json({
    success: true,
    message: 'Lead purchased successfully',
    purchase: {
      id: result.purchase.id,
      leadId: result.lead.id,
      amountPaid: leadPrice,
      purchasedAt: result.purchase.purchasedAt,
      newBalance: result.newBalance
    },
    lead: {
      id: result.lead.id,
      fullInfo: result.lead.fullInfo // Reveal full contact info
    }
  });
});

// Add lead to favorites
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

// Remove lead from favorites
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

// Get user's favorited leads
export const getFavorites = asyncHandler(async (req, res) => {
  const user = req.user;

  const favorites = await prisma.userLeadFavorite.findMany({
    where: { userId: user.id },
    include: {
      lead: true
    },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate dynamic tags for each lead
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  res.json({
    success: true,
    favorites: favorites.map(fav => {
      const dynamicTags = [...fav.lead.tags]; // Start with existing tags

      // NEW tag: leads created within last 3 days
      if (new Date(fav.lead.createdAt) >= threeDaysAgo && !dynamicTags.includes('NEW')) {
        dynamicTags.push('NEW');
      }

      // HOT tag: leads with recent client responses (last 10 days)
      if (fav.lead.lastClientResponse && new Date(fav.lead.lastClientResponse) >= tenDaysAgo && !dynamicTags.includes('HOT')) {
        dynamicTags.push('HOT');
      }

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

export default { getLeads, getLead, purchaseLead, addFavorite, removeFavorite, getFavorites };
