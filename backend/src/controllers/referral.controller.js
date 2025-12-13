import { prisma } from '../config/database.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { generateReferralCode, getReferrerStats } from '../services/referral.service.js';

const COMMISSION_RATE = 0.10; // 10%
const MINIMUM_PAYOUT = 50.00;

/**
 * Get referral statistics for current user
 * GET /api/referrals/stats
 */
export const getStats = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const stats = await getReferrerStats(userId);

  res.json({
    success: true,
    stats
  });
});

/**
 * Get referral link (auto-generate code if missing)
 * GET /api/referrals/link
 */
export const getLink = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  let user = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true, referralEnabled: true }
  });

  // Auto-generate referral code if missing
  if (!user.referralCode) {
    let code;
    let isUnique = false;

    // Generate unique code
    while (!isUnique) {
      code = generateReferralCode();
      const existing = await prisma.user.findUnique({
        where: { referralCode: code }
      });
      if (!existing) {
        isUnique = true;
      }
    }

    // Update user with new code
    user = await prisma.user.update({
      where: { id: userId },
      data: { referralCode: code },
      select: { referralCode: true, referralEnabled: true }
    });

    logger.info('Referral code generated', { userId, code });
  }

  const frontendUrl = process.env.FRONTEND_URL || 'https://blackbowassociates.com';
  const referralLink = `${frontendUrl}/signup?ref=${user.referralCode}`;

  res.json({
    success: true,
    referralCode: user.referralCode,
    referralLink,
    enabled: user.referralEnabled
  });
});

/**
 * Get referred users with their purchases
 * GET /api/referrals/referred-users
 */
export const getReferredUsers = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const referredUsers = await prisma.user.findMany({
    where: { referredByUserId: userId },
    select: {
      id: true,
      email: true,
      businessName: true,
      createdAt: true,
      purchases: {
        select: {
          id: true,
          amountPaid: true,
          purchasedAt: true,
          referralCommission: {
            select: {
              amount: true,
              status: true
            }
          }
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedUsers = referredUsers.map(user => ({
    id: user.id,
    email: user.email,
    businessName: user.businessName,
    signupDate: user.createdAt,
    totalPurchases: user.purchases.length,
    totalSpent: user.purchases.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0),
    commissionEarned: user.purchases
      .filter(p => p.referralCommission)
      .reduce((sum, p) => sum + parseFloat(p.referralCommission.amount), 0),
    purchases: user.purchases.map(p => ({
      id: p.id,
      amount: parseFloat(p.amountPaid),
      date: p.purchasedAt,
      commission: p.referralCommission ? {
        amount: parseFloat(p.referralCommission.amount),
        status: p.referralCommission.status
      } : null
    }))
  }));

  res.json({
    success: true,
    referredUsers: formattedUsers
  });
});

/**
 * Get commission history
 * GET /api/referrals/commissions
 */
export const getCommissions = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { status } = req.query;

  const where = { earnerId: userId };
  if (status && ['PENDING', 'PAID'].includes(status)) {
    where.status = status;
  }

  const commissions = await prisma.referralCommission.findMany({
    where,
    include: {
      sourceUser: {
        select: {
          email: true,
          businessName: true
        }
      },
      purchase: {
        select: {
          amountPaid: true,
          purchasedAt: true
        }
      },
      payout: {
        select: {
          id: true,
          amount: true,
          status: true,
          requestedAt: true,
          paidAt: true
        }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedCommissions = commissions.map(c => ({
    id: c.id,
    amount: parseFloat(c.amount),
    status: c.status,
    createdAt: c.createdAt,
    paidAt: c.paidAt,
    sourceUser: {
      email: c.sourceUser.email,
      businessName: c.sourceUser.businessName
    },
    purchase: {
      amount: parseFloat(c.purchase.amountPaid),
      date: c.purchase.purchasedAt
    },
    payout: c.payout ? {
      id: c.payout.id,
      amount: parseFloat(c.payout.amount),
      status: c.payout.status,
      requestedAt: c.payout.requestedAt,
      paidAt: c.payout.paidAt
    } : null
  }));

  res.json({
    success: true,
    commissions: formattedCommissions
  });
});

/**
 * Request payout
 * POST /api/referrals/request-payout
 */
export const requestPayout = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  // Get pending commissions
  const pendingCommissions = await prisma.referralCommission.findMany({
    where: {
      earnerId: userId,
      status: 'PENDING'
    }
  });

  if (pendingCommissions.length === 0) {
    throw new AppError('No pending commissions available', 400, 'NO_PENDING_COMMISSIONS');
  }

  // Calculate total
  const totalAmount = pendingCommissions.reduce(
    (sum, c) => sum + parseFloat(c.amount),
    0
  );

  // Check minimum payout
  if (totalAmount < MINIMUM_PAYOUT) {
    throw new AppError(
      `Minimum payout amount is $${MINIMUM_PAYOUT}. Current pending: $${totalAmount.toFixed(2)}`,
      400,
      'BELOW_MINIMUM_PAYOUT',
      { minimumPayout: MINIMUM_PAYOUT, currentAmount: totalAmount }
    );
  }

  // Create payout request
  const payout = await prisma.referralPayout.create({
    data: {
      userId,
      amount: totalAmount,
      status: 'PENDING'
    }
  });

  // Link commissions to payout
  await prisma.referralCommission.updateMany({
    where: {
      id: { in: pendingCommissions.map(c => c.id) }
    },
    data: {
      payoutId: payout.id
    }
  });

  logger.info('Payout requested', {
    userId,
    payoutId: payout.id,
    amount: totalAmount,
    commissionsCount: pendingCommissions.length
  });

  // Send Telegram notification for payout request
  await notifyTelegram(
    `💸 *Referral Payout Request*\n\nUser: ${req.user.email}\nAmount: $${totalAmount.toFixed(2)}\nCommissions: ${pendingCommissions.length}`,
    'info'
  );

  res.json({
    success: true,
    payout: {
      id: payout.id,
      amount: parseFloat(payout.amount),
      status: payout.status,
      requestedAt: payout.requestedAt,
      commissionsCount: pendingCommissions.length
    }
  });
});

/**
 * Get payout history
 * GET /api/referrals/payouts
 */
export const getPayouts = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  const payouts = await prisma.referralPayout.findMany({
    where: { userId },
    include: {
      commissions: {
        select: {
          id: true,
          amount: true
        }
      }
    },
    orderBy: { requestedAt: 'desc' }
  });

  const formattedPayouts = payouts.map(p => ({
    id: p.id,
    amount: parseFloat(p.amount),
    status: p.status,
    requestedAt: p.requestedAt,
    paidAt: p.paidAt,
    notes: p.notes,
    commissionsCount: p.commissions.length
  }));

  res.json({
    success: true,
    payouts: formattedPayouts
  });
});

export default {
  getStats,
  getLink,
  getReferredUsers,
  getCommissions,
  requestPayout,
  getPayouts
};
