/**
 * Leads Purchase Controller
 *
 * Handles lead purchasing and feedback submission
 *
 * Endpoints:
 * - POST /api/leads/:id/purchase - Purchase a lead
 * - POST /api/leads/:id/feedback - Submit lead feedback
 */

import { prisma } from '../../config/database.js';
import { logger, notifyTelegram } from '../../utils/logger.js';
import { AppError, asyncHandler } from '../../middleware/errorHandler.js';
import { VENDOR_TYPE_PURCHASE_LIMIT, getPurchaseCountByVendorType } from './leadsHelpers.js';

/**
 * Purchase lead (CRITICAL: Row-level locking for race condition prevention)
 * POST /api/leads/:id/purchase
 */
export const purchaseLead = asyncHandler(async (req, res) => {
  const { id: leadId } = req.params;
  const user = req.user;
  const leadPrice = parseFloat(process.env.LEAD_PRICE || 20);

  // Start transaction
  const result = await prisma.$transaction(async (tx) => {
    // SECURITY: Use SELECT FOR UPDATE to lock the lead row and prevent race conditions
    // This ensures only one purchase can proceed at a time for this lead
    const leads = await tx.$queryRaw`
      SELECT * FROM "Lead" WHERE id = ${leadId} FOR UPDATE
    `;

    if (!leads || leads.length === 0) {
      throw new AppError('Lead not found', 404, 'NOT_FOUND');
    }

    const lead = leads[0];

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

    // SECURITY: Atomic balance deduction with constraint check to prevent race conditions
    // This ensures concurrent purchases cannot cause negative balances
    let updatedUser;
    try {
      updatedUser = await tx.user.update({
        where: {
          id: user.id,
          balance: { gte: leadPrice } // Atomic check: only update if balance is sufficient
        },
        data: {
          balance: { decrement: leadPrice } // Atomic decrement
        },
        select: {
          balance: true
        }
      });
    } catch (error) {
      // If update fails due to balance constraint, throw insufficient funds error
      if (error.code === 'P2025') {
        // Get current balance for error message
        const currentUser = await tx.user.findUnique({
          where: { id: user.id },
          select: { balance: true }
        });
        const balance = parseFloat(currentUser?.balance || 0);
        throw new AppError(
          `Insufficient funds. Balance: $${balance.toFixed(2)}, Required: $${leadPrice.toFixed(2)}`,
          402,
          'INSUFFICIENT_FUNDS',
          { balance, required: leadPrice }
        );
      }
      throw error;
    }

    const newBalance = parseFloat(updatedUser.balance);

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

/**
 * Submit lead feedback
 * POST /api/leads/:id/feedback
 */
export const submitFeedback = asyncHandler(async (req, res) => {
  const user = req.user;
  const { leadId } = req.params;
  const { booked, leadResponsive, timeToBook, amountCharged } = req.body;

  // Validation
  if (typeof booked !== 'boolean') {
    throw new AppError('Booked status is required', 400, 'VALIDATION_ERROR');
  }

  if (!['responsive', 'ghosted', 'partial'].includes(leadResponsive)) {
    throw new AppError('Invalid lead responsiveness value', 400, 'VALIDATION_ERROR');
  }

  if (booked && !timeToBook) {
    throw new AppError('Time to book is required when lead booked', 400, 'VALIDATION_ERROR');
  }

  if (booked && !amountCharged) {
    throw new AppError('Amount charged is required when lead booked', 400, 'VALIDATION_ERROR');
  }

  // Check if user has purchased this lead
  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_leadId: {
        userId: user.id,
        leadId
      }
    }
  });

  if (!purchase) {
    throw new AppError('You have not purchased this lead', 403, 'FORBIDDEN');
  }

  // Check if feedback already exists
  const existingFeedback = await prisma.leadFeedback.findUnique({
    where: {
      userId_leadId: {
        userId: user.id,
        leadId
      }
    }
  });

  if (existingFeedback) {
    throw new AppError('You have already submitted feedback for this lead', 409, 'ALREADY_SUBMITTED');
  }

  // Start transaction to create feedback and add $2 reward
  const result = await prisma.$transaction(async (tx) => {
    // Create feedback record
    const feedback = await tx.leadFeedback.create({
      data: {
        userId: user.id,
        leadId,
        booked,
        leadResponsive,
        timeToBook: booked ? timeToBook : null,
        amountCharged: booked ? parseFloat(amountCharged) : null
      }
    });

    // Get current balance
    const currentUser = await tx.user.findUnique({
      where: { id: user.id }
    });

    const currentBalance = parseFloat(currentUser.balance);
    const rewardAmount = 2.00;
    const newBalance = currentBalance + rewardAmount;

    // Add $2 reward to user balance
    await tx.user.update({
      where: { id: user.id },
      data: { balance: newBalance }
    });

    // Create transaction record for the reward
    await tx.transaction.create({
      data: {
        userId: user.id,
        amount: rewardAmount,
        type: 'FEEDBACK_REWARD',
        balanceAfter: newBalance,
        description: 'Feedback reward for lead ' + leadId.substring(0, 8),
        metadata: { leadId, feedbackId: feedback.id }
      }
    });

    return { feedback, newBalance, rewardAmount };
  });

  logger.info('Lead feedback submitted', {
    userId: user.id,
    leadId,
    booked: result.feedback.booked,
    rewardAmount: result.rewardAmount
  });

  await notifyTelegram(
    `📝 Lead feedback submitted by ${user.businessName} - Booked: ${booked ? 'Yes' : 'No'}, Lead: ${leadId.substring(0, 8)}`,
    'info'
  );

  res.json({
    success: true,
    message: 'Feedback submitted successfully',
    feedback: result.feedback,
    rewardAmount: result.rewardAmount,
    newBalance: result.newBalance
  });
});
