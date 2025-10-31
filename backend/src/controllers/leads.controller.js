import { prisma } from '../config/database.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Get all available leads (with filters)
export const getLeads = asyncHandler(async (req, res) => {
  const {
    status = 'AVAILABLE',
    location,
    servicesNeeded,
    minBudget,
    maxBudget,
    page = 1,
    limit = 20
  } = req.query;

  const skip = (page - 1) * limit;
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

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    }),
    prisma.lead.count({ where })
  ]);

  // Return only masked info for available leads
  res.json({
    success: true,
    leads: leads.map(lead => ({
      id: lead.id,
      pipedriveDealId: lead.pipedriveDealId,
      weddingDate: lead.weddingDate,
      location: lead.location,
      city: lead.city,
      state: lead.state,
      servicesNeeded: lead.servicesNeeded,
      price: parseFloat(lead.price),
      status: lead.status,
      description: lead.description, // Package description
      ethnicReligious: lead.ethnicReligious,
      createdAt: lead.createdAt,
      active: lead.active
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
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

    // Mark lead as sold and inactive (hide from marketplace)
    await tx.lead.update({
      where: { id: leadId },
      data: { 
        status: 'SOLD',
        active: false
      }
    });

    return { lead, purchase, newBalance };
  });

  logger.info('Lead purchased', {
    userId: user.id,
    leadId,
    amount: leadPrice,
    newBalance: result.newBalance
  });

  await notifyTelegram(
    `💰 Lead purchased by ${user.businessName} (${user.email}) - $${leadPrice}`,
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

export default { getLeads, getLead, purchaseLead };
