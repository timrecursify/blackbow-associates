import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Get user profile with balance
export const getProfile = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      businessName: user.businessName,
      vendorType: user.vendorType,
      balance: parseFloat(user.balance),
      isAdmin: user.isAdmin,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt
    }
  });
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const { businessName, vendorType } = req.body;
  const user = req.user;

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      ...(businessName && { businessName }),
      ...(vendorType && { vendorType })
    }
  });

  logger.info('User profile updated', {
    userId: user.id,
    changes: { businessName, vendorType }
  });

  res.json({
    success: true,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      businessName: updatedUser.businessName,
      vendorType: updatedUser.vendorType,
      balance: parseFloat(updatedUser.balance)
    }
  });
});

// Get transaction history
export const getTransactions = asyncHandler(async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 50 } = req.query;

  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    }),
    prisma.transaction.count({ where: { userId: user.id } })
  ]);

  res.json({
    success: true,
    transactions: transactions.map(t => ({
      id: t.id,
      amount: parseFloat(t.amount),
      type: t.type,
      balanceAfter: parseFloat(t.balanceAfter),
      metadata: t.metadata,
      createdAt: t.createdAt
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Get purchased leads
export const getPurchasedLeads = asyncHandler(async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 20 } = req.query;

  const skip = (page - 1) * limit;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId: user.id },
      include: {
        lead: true
      },
      orderBy: { purchasedAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    }),
    prisma.purchase.count({ where: { userId: user.id } })
  ]);

  res.json({
    success: true,
    leads: purchases.map(p => ({
      id: p.lead.id,
      weddingDate: p.lead.weddingDate,
      location: p.lead.location,
      city: p.lead.city,
      state: p.lead.state,
      budgetMin: p.lead.budgetMin ? parseFloat(p.lead.budgetMin) : null,
      budgetMax: p.lead.budgetMax ? parseFloat(p.lead.budgetMax) : null,
      servicesNeeded: p.lead.servicesNeeded,
      fullInfo: p.lead.fullInfo, // Full contact details revealed
      amountPaid: parseFloat(p.amountPaid),
      purchasedAt: p.purchasedAt
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

export default { getProfile, updateProfile, getTransactions, getPurchasedLeads };
