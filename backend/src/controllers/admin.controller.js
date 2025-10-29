import { prisma } from '../config/database.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { parse } from 'csv-parse/sync';

// Get all users
export const getAllUsers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
      select: {
        id: true,
        email: true,
        businessName: true,
        vendorType: true,
        balance: true,
        isAdmin: true,
        createdAt: true,
        _count: {
          select: {
            purchases: true,
            transactions: true
          }
        }
      }
    }),
    prisma.user.count()
  ]);

  res.json({
    success: true,
    users: users.map(u => ({
      ...u,
      balance: parseFloat(u.balance),
      purchaseCount: u._count.purchases,
      transactionCount: u._count.transactions
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Get all leads (including sold)
export const getAllLeads = asyncHandler(async (req, res) => {
  const { status, page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const where = status ? { status } : {};

  const [leads, total] = await Promise.all([
    prisma.lead.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit),
      include: {
        _count: {
          select: { purchases: true }
        }
      }
    }),
    prisma.lead.count({ where })
  ]);

  res.json({
    success: true,
    leads: leads.map(l => ({
      id: l.id,
      weddingDate: l.weddingDate,
      location: l.location,
      city: l.city,
      state: l.state,
      budgetMin: l.budgetMin ? parseFloat(l.budgetMin) : null,
      budgetMax: l.budgetMax ? parseFloat(l.budgetMax) : null,
      servicesNeeded: l.servicesNeeded,
      price: parseFloat(l.price),
      status: l.status,
      maskedInfo: l.maskedInfo,
      fullInfo: l.fullInfo,
      purchaseCount: l._count.purchases,
      createdAt: l.createdAt
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Import leads from CSV
export const importLeads = asyncHandler(async (req, res) => {
  const { leads } = req.body;

  const createdLeads = [];

  for (const leadData of leads) {
    const lead = await prisma.lead.create({
      data: {
        weddingDate: leadData.weddingDate ? new Date(leadData.weddingDate) : null,
        location: leadData.location,
        city: leadData.city || null,
        state: leadData.state || null,
        budgetMin: leadData.budgetMin || null,
        budgetMax: leadData.budgetMax || null,
        servicesNeeded: leadData.servicesNeeded || [],
        price: leadData.price || 20,
        status: 'AVAILABLE',
        maskedInfo: leadData.maskedInfo || {},
        fullInfo: leadData.fullInfo || {}
      }
    });

    createdLeads.push(lead);
  }

  logger.info('Leads imported via CSV', {
    count: createdLeads.length,
    adminId: req.user.id
  });

  await notifyTelegram(`📥 ${createdLeads.length} leads imported by admin`, 'info');

  res.json({
    success: true,
    message: `${createdLeads.length} leads imported successfully`,
    leads: createdLeads.map(l => ({ id: l.id, location: l.location }))
  });
});

// Adjust user balance
export const adjustBalance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const newBalance = parseFloat(user.balance) + amount;

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { balance: newBalance }
  });

  // Create transaction record
  await prisma.transaction.create({
    data: {
      userId: id,
      amount,
      type: 'ADJUSTMENT',
      balanceAfter: newBalance,
      metadata: { reason, adminId: req.user.id }
    }
  });

  logger.info('Balance adjusted by admin', {
    userId: id,
    amount,
    newBalance,
    reason,
    adminId: req.user.id
  });

  await notifyTelegram(
    `💰 Balance adjusted for ${user.email}: ${amount > 0 ? '+' : ''}$${amount} (Reason: ${reason})`,
    'info'
  );

  res.json({
    success: true,
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      balance: parseFloat(updatedUser.balance)
    }
  });
});

export default { getAllUsers, getAllLeads, importLeads, adjustBalance };
