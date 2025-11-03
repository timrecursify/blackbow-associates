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
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
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

// SECURITY: Adjust user balance with strict bounds validation
export const adjustBalance = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { amount, reason } = req.body;

  // SECURITY: Enforce reasonable bounds to prevent abuse
  const MIN_ADJUSTMENT = -10000; // Maximum $10,000 deduction
  const MAX_ADJUSTMENT = 10000;  // Maximum $10,000 addition

  if (typeof amount !== 'number' || isNaN(amount)) {
    throw new AppError('Invalid amount - must be a number', 400, 'VALIDATION_ERROR');
  }

  if (amount < MIN_ADJUSTMENT || amount > MAX_ADJUSTMENT) {
    throw new AppError(
      `Balance adjustment must be between $${MIN_ADJUSTMENT} and $${MAX_ADJUSTMENT}`,
      400,
      'ADJUSTMENT_OUT_OF_BOUNDS',
      { amount, min: MIN_ADJUSTMENT, max: MAX_ADJUSTMENT }
    );
  }

  if (amount === 0) {
    throw new AppError('Amount cannot be zero', 400, 'VALIDATION_ERROR');
  }

  if (!reason || reason.trim().length === 0) {
    throw new AppError('Reason is required for balance adjustments', 400, 'VALIDATION_ERROR');
  }

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  // Use transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Use atomic increment/decrement for safety
    const updatedUser = await tx.user.update({
      where: { id },
      data: { balance: { increment: amount } },
      select: { id: true, email: true, balance: true }
    });

    const newBalance = parseFloat(updatedUser.balance);

    // Create transaction record
    const transaction = await tx.transaction.create({
      data: {
        userId: id,
        amount,
        type: 'ADJUSTMENT',
        balanceAfter: newBalance,
        metadata: {
          reason: reason.trim(),
          adminId: req.user.id,
          adminEmail: req.user.email
        }
      }
    });

    return { updatedUser, newBalance, transaction };
  });

  logger.info('Balance adjusted by admin', {
    userId: id,
    amount,
    newBalance: result.newBalance,
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
      id: result.updatedUser.id,
      email: result.updatedUser.email,
      balance: result.newBalance
    }
  });
});

// Block user
export const blockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { reason } = req.body;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (user.isAdmin) {
    throw new AppError('Cannot block admin users', 403, 'FORBIDDEN');
  }

  if (user.isBlocked) {
    throw new AppError('User is already blocked', 400, 'ALREADY_BLOCKED');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      isBlocked: true,
      blockedAt: new Date(),
      blockedReason: reason || 'Blocked by admin'
    }
  });

  logger.info('User blocked by admin', {
    userId: id,
    userEmail: user.email,
    reason,
    adminId: req.user.id
  });

  await notifyTelegram(
    `🚫 User blocked: ${user.email}\nReason: ${reason || 'Blocked by admin'}`,
    'warning'
  );

  res.json({
    success: true,
    message: 'User blocked successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      isBlocked: updatedUser.isBlocked
    }
  });
});

// Unblock user
export const unblockUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (!user.isBlocked) {
    throw new AppError('User is not blocked', 400, 'NOT_BLOCKED');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: {
      isBlocked: false,
      blockedAt: null,
      blockedReason: null
    }
  });

  logger.info('User unblocked by admin', {
    userId: id,
    userEmail: user.email,
    adminId: req.user.id
  });

  await notifyTelegram(
    `✅ User unblocked: ${user.email}`,
    'info'
  );

  res.json({
    success: true,
    message: 'User unblocked successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      isBlocked: updatedUser.isBlocked
    }
  });
});

// Delete user
export const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({ where: { id } });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  if (user.isAdmin) {
    throw new AppError('Cannot delete admin users', 403, 'FORBIDDEN');
  }

  // Delete user (cascading will handle related records)
  await prisma.user.delete({ where: { id } });

  logger.info('User deleted by admin', {
    userId: id,
    userEmail: user.email,
    adminId: req.user.id
  });

  await notifyTelegram(
    `❌ User deleted: ${user.email}`,
    'warning'
  );

  res.json({
    success: true,
    message: 'User deleted successfully'
  });
});

// Update lead status
export const updateLeadStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  if (!['AVAILABLE', 'SOLD', 'EXPIRED', 'HIDDEN', 'REMOVED'].includes(status)) {
    throw new AppError('Invalid status', 400, 'INVALID_STATUS');
  }

  const lead = await prisma.lead.findUnique({ where: { id } });

  if (!lead) {
    throw new AppError('Lead not found', 404, 'NOT_FOUND');
  }

  const updatedLead = await prisma.lead.update({
    where: { id },
    data: { status }
  });

  logger.info('Lead status updated by admin', {
    leadId: id,
    oldStatus: lead.status,
    newStatus: status,
    adminId: req.user.id
  });

  await notifyTelegram(
    `📝 Lead ${id} status updated: ${lead.status} → ${status}`,
    'info'
  );

  res.json({
    success: true,
    message: 'Lead status updated successfully',
    lead: {
      id: updatedLead.id,
      status: updatedLead.status,
      location: updatedLead.location
    }
  });
});

export default { getAllUsers, getAllLeads, importLeads, adjustBalance, blockUser, unblockUser, deleteUser, updateLeadStatus };
