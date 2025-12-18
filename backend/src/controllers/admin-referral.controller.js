import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import EmailService from '../services/emailService.js';
import { NotificationService } from '../services/notification.service.js';

/**
 * Get referral system overview
 * GET /api/admin/referrals/overview
 */
export const getOverview = asyncHandler(async (req, res) => {
  const [
    totalReferrers,
    totalReferred,
    totalCommissions,
    pendingPayouts,
    paidPayouts
  ] = await Promise.all([
    // Count users with referral codes
    prisma.user.count({
      where: { referralCode: { not: null } }
    }),
    // Count users who were referred
    prisma.user.count({
      where: { referredByUserId: { not: null } }
    }),
    // Total commissions by status
    prisma.referralCommission.groupBy({
      by: ['status'],
      _sum: { amount: true },
      _count: true
    }),
    // Pending payouts
    prisma.referralPayout.aggregate({
      where: { status: 'PENDING' },
      _sum: { amount: true },
      _count: true
    }),
    // Paid payouts
    prisma.referralPayout.aggregate({
      where: { status: 'PAID' },
      _sum: { amount: true },
      _count: true
    })
  ]);

  const pendingCommissions = totalCommissions.find(c => c.status === 'PENDING');
  const paidCommissions = totalCommissions.find(c => c.status === 'PAID');

  res.json({
    success: true,
    overview: {
      totalReferrers,
      totalReferred,
      commissions: {
        pending: {
          count: pendingCommissions?._count || 0,
          amount: parseFloat(pendingCommissions?._sum?.amount || 0)
        },
        paid: {
          count: paidCommissions?._count || 0,
          amount: parseFloat(paidCommissions?._sum?.amount || 0)
        },
        total: {
          count: totalCommissions.reduce((sum, c) => sum + c._count, 0),
          amount: totalCommissions.reduce((sum, c) => sum + parseFloat(c._sum?.amount || 0), 0)
        }
      },
      payouts: {
        pending: {
          count: pendingPayouts._count || 0,
          amount: parseFloat(pendingPayouts._sum?.amount || 0)
        },
        paid: {
          count: paidPayouts._count || 0,
          amount: parseFloat(paidPayouts._sum?.amount || 0)
        }
      }
    }
  });
});

/**
 * Get all referrers with their stats
 * GET /api/admin/referrals/referrers
 */
export const getAllReferrers = asyncHandler(async (req, res) => {
  const { page = 1, limit = 50 } = req.query;

  const pageNum = Math.max(1, Math.min(1000, parseInt(page) || 1));
  const limitNum = Math.max(1, Math.min(100, parseInt(limit) || 50));
  const skip = (pageNum - 1) * limitNum;

  const [referrers, total] = await Promise.all([
    prisma.user.findMany({
      where: { referralCode: { not: null } },
      select: {
        id: true,
        email: true,
        businessName: true,
        referralCode: true,
        referralEnabled: true,
        createdAt: true,
        _count: {
          select: {
            referrals: true,
            referralCommissions: true
          }
        },
        referralCommissions: {
          select: {
            amount: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limitNum
    }),
    prisma.user.count({
      where: { referralCode: { not: null } }
    })
  ]);

  const formattedReferrers = referrers.map(user => {
    const totalEarned = user.referralCommissions.reduce(
      (sum, c) => sum + parseFloat(c.amount),
      0
    );
    const pendingAmount = user.referralCommissions
      .filter(c => c.status === 'PENDING')
      .reduce((sum, c) => sum + parseFloat(c.amount), 0);
    const paidAmount = user.referralCommissions
      .filter(c => c.status === 'PAID')
      .reduce((sum, c) => sum + parseFloat(c.amount), 0);

    return {
      id: user.id,
      email: user.email,
      businessName: user.businessName,
      referralCode: user.referralCode,
      referralEnabled: user.referralEnabled,
      signupDate: user.createdAt,
      stats: {
        totalReferred: user._count.referrals,
        totalCommissions: user._count.referralCommissions,
        totalEarned,
        pendingAmount,
        paidAmount
      }
    };
  });

  res.json({
    success: true,
    referrers: formattedReferrers,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total,
      totalPages: Math.ceil(total / limitNum)
    }
  });
});

/**
 * Get detailed referrer information
 * GET /api/admin/referrals/referrers/:id
 */
export const getReferrerDetails = asyncHandler(async (req, res) => {
  const { id } = req.params;

  const user = await prisma.user.findUnique({
    where: { id },
    select: {
      id: true,
      email: true,
      businessName: true,
      referralCode: true,
      referralEnabled: true,
      createdAt: true,
      referrals: {
        select: {
          id: true,
          email: true,
          businessName: true,
          createdAt: true,
          purchases: {
            select: {
              id: true,
              amountPaid: true,
              purchasedAt: true
            }
          }
        }
      },
      referralCommissions: {
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
              status: true,
              requestedAt: true,
              paidAt: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      },
      referralPayouts: {
        include: {
          commissions: {
            select: {
              id: true,
              amount: true
            }
          }
        },
        orderBy: { requestedAt: 'desc' }
      }
    }
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const totalEarned = user.referralCommissions.reduce(
    (sum, c) => sum + parseFloat(c.amount),
    0
  );
  const pendingAmount = user.referralCommissions
    .filter(c => c.status === 'PENDING')
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);
  const paidAmount = user.referralCommissions
    .filter(c => c.status === 'PAID')
    .reduce((sum, c) => sum + parseFloat(c.amount), 0);

  res.json({
    success: true,
    referrer: {
      id: user.id,
      email: user.email,
      businessName: user.businessName,
      referralCode: user.referralCode,
      referralEnabled: user.referralEnabled,
      signupDate: user.createdAt,
      stats: {
        totalReferred: user.referrals.length,
        totalCommissions: user.referralCommissions.length,
        totalEarned,
        pendingAmount,
        paidAmount
      },
      referrals: user.referrals.map(r => ({
        id: r.id,
        email: r.email,
        businessName: r.businessName,
        signupDate: r.createdAt,
        totalPurchases: r.purchases.length,
        totalSpent: r.purchases.reduce((sum, p) => sum + parseFloat(p.amountPaid), 0)
      })),
      commissions: user.referralCommissions.map(c => ({
        id: c.id,
        amount: parseFloat(c.amount),
        status: c.status,
        createdAt: c.createdAt,
        paidAt: c.paidAt,
        sourceUser: c.sourceUser,
        purchase: {
          amount: parseFloat(c.purchase.amountPaid),
          date: c.purchase.purchasedAt
        },
        payout: c.payout
      })),
      payouts: user.referralPayouts.map(p => ({
        id: p.id,
        amount: parseFloat(p.amount),
        status: p.status,
        requestedAt: p.requestedAt,
        paidAt: p.paidAt,
        notes: p.notes,
        commissionsCount: p.commissions.length
      }))
    }
  });
});

/**
 * Get pending payouts
 * GET /api/admin/referrals/payouts
 */
export const getPendingPayouts = asyncHandler(async (req, res) => {
  const { status } = req.query;

  const where = {};
  if (status && ['PENDING', 'PROCESSING', 'PAID', 'REJECTED'].includes(status)) {
    where.status = status;
  } else {
    // Default to pending and processing
    where.status = { in: ['PENDING', 'PROCESSING'] };
  }

  const payouts = await prisma.referralPayout.findMany({
    where,
    include: {
      user: {
        select: {
          id: true,
          email: true,
          businessName: true
        }
      },
      commissions: {
        select: {
          id: true,
          amount: true,
          sourceUser: {
            select: {
              email: true,
              businessName: true
            }
          }
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
    user: p.user,
    commissionsCount: p.commissions.length,
    commissions: p.commissions.map(c => ({
      id: c.id,
      amount: parseFloat(c.amount),
      sourceUser: c.sourceUser
    }))
  }));

  res.json({
    success: true,
    payouts: formattedPayouts
  });
});

/**
 * Mark payout as paid
 * POST /api/admin/referrals/payouts/:id/mark-paid
 */
export const markPayoutPaid = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { notes } = req.body;

  const payout = await prisma.referralPayout.findUnique({
    where: { id },
    include: {
      commissions: true,
      user: {
        select: {
          id: true,
          email: true,
          businessName: true,
          payoutMethod: true,
          balance: true
        }
      }
    }
  });

  if (!payout) {
    throw new AppError('Payout not found', 404, 'NOT_FOUND');
  }

  if (payout.status === 'PAID') {
    throw new AppError('Payout already marked as paid', 400, 'ALREADY_PAID');
  }

  // Update payout and commissions in transaction
  await prisma.$transaction(async (tx) => {
    // Update payout status
    await tx.referralPayout.update({
      where: { id },
      data: {
        status: 'PAID',
        paidAt: new Date(),
        notes
      }
    });

    // Mark all commissions as paid
    await tx.referralCommission.updateMany({
      where: { payoutId: id },
      data: {
        status: 'PAID',
        paidAt: new Date()
      }
    });

    // Record payout completion as a transaction (audit trail)
    // NOTE: This does not change the user's platform balance; it's an off-platform payout.
    const currentBalance = parseFloat(payout.user.balance || 0);
    await tx.transaction.create({
      data: {
        userId: payout.user.id,
        amount: -parseFloat(payout.amount),
        type: 'REFERRAL_PAYOUT',
        balanceAfter: currentBalance,
        description: 'Referral payout completed',
        metadata: { payoutId: payout.id, notes: notes || null }
      }
    });
  });

  logger.info('Payout marked as paid', {
    adminUserId: req.user.id,
    payoutId: id,
    amount: parseFloat(payout.amount),
    commissionsCount: payout.commissions.length
  });

  // Notify user (in-app + email). These must never block the admin action.
  await NotificationService.create({
    userId: payout.user.id,
    type: 'PAYOUT_PAID',
    title: 'Payout completed',
    body: `Your payout of $${parseFloat(payout.amount).toFixed(2)} has been completed.`,
    linkUrl: '/account?tab=referrals',
    metadata: { payoutId: payout.id, amount: parseFloat(payout.amount) }
  });

  try {
    await EmailService.sendPayoutPaidEmail(
      payout.user.email,
      payout.user.businessName,
      parseFloat(payout.amount),
      payout.user.payoutMethod,
      payout.id
    );
  } catch (emailError) {
    logger.warn('Failed to send payout paid email', { payoutId: payout.id, error: emailError.message });
  }

  res.json({
    success: true,
    message: 'Payout marked as paid successfully'
  });
});

/**
 * Toggle referral enabled/disabled for a user
 * POST /api/admin/referrals/users/:id/toggle-referral
 */
export const toggleReferral = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { enabled } = req.body;

  const user = await prisma.user.findUnique({
    where: { id },
    select: { referralEnabled: true }
  });

  if (!user) {
    throw new AppError('User not found', 404, 'NOT_FOUND');
  }

  const updatedUser = await prisma.user.update({
    where: { id },
    data: { referralEnabled: enabled },
    select: {
      id: true,
      email: true,
      referralCode: true,
      referralEnabled: true
    }
  });

  logger.info('Referral status toggled', {
    adminUserId: req.user.id,
    userId: id,
    enabled
  });

  res.json({
    success: true,
    user: updatedUser
  });
});

export default {
  getOverview,
  getAllReferrers,
  getReferrerDetails,
  getPendingPayouts,
  markPayoutPaid,
  toggleReferral
};
