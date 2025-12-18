import { prisma } from '../config/database.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const MAX_PAGE = 1000;
const MAX_LIMIT = 100;

const VALID_TYPES = new Set([
  'DEPOSIT',
  'PURCHASE',
  'REFUND',
  'ADJUSTMENT',
  'FEEDBACK_REWARD',
  'REFERRAL_PAYOUT'
]);

/**
 * Get all transactions (admin)
 * GET /api/admin/transactions
 */
export const getAllTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50, type, searchEmail, start, end } = req.query;

  const pageNum = Math.max(1, Math.min(MAX_PAGE, parseInt(page) || 1));
  const limitNum = Math.max(1, Math.min(MAX_LIMIT, parseInt(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  const where = {};

  if (type && VALID_TYPES.has(type)) {
    where.type = type;
  }

  if (searchEmail && String(searchEmail).trim()) {
    const q = String(searchEmail).trim();
    where.user = {
      OR: [
        { email: { contains: q, mode: 'insensitive' } },
        { businessName: { contains: q, mode: 'insensitive' } }
      ]
    };
  }

  if (start || end) {
    where.createdAt = {};
    if (start) {
      const s = new Date(start);
      if (!Number.isNaN(s.getTime())) where.createdAt.gte = s;
    }
    if (end) {
      const e = new Date(end);
      if (!Number.isNaN(e.getTime())) where.createdAt.lte = e;
    }
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum,
      include: {
        user: {
          select: {
            id: true,
            email: true,
            businessName: true,
            isAdmin: true
          }
        }
      }
    }),
    prisma.transaction.count({ where })
  ]);

  res.json({
    success: true,
    transactions: transactions.map(t => ({
      id: t.id,
      userId: t.userId,
      user: t.user,
      amount: parseFloat(t.amount),
      type: t.type,
      description: t.description,
      stripePaymentId: t.stripePaymentId,
      balanceAfter: parseFloat(t.balanceAfter),
      metadata: t.metadata,
      createdAt: t.createdAt
    })),
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});


