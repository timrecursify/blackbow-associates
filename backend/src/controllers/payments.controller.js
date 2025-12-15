import { prisma } from '../config/database.js';
import EmailService from '../services/emailService.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import * as stripeService from '../services/stripe.service.js';

// Create deposit payment intent
export const createDeposit = asyncHandler(async (req, res) => {
  const { amount } = req.body;
  const user = req.user;

  if (amount < 20) {
    throw new AppError('Minimum deposit is $20', 400, 'INVALID_AMOUNT');
  }

  if (amount > 10000) {
    throw new AppError('Maximum deposit is $10,000', 400, 'INVALID_AMOUNT');
  }

  const paymentIntent = await stripeService.createPaymentIntent(
    amount,
    user.id,
    { email: user.email, businessName: user.businessName }
  );

  logger.info('Deposit payment intent created', {
    userId: user.id,
    amount,
    paymentIntentId: paymentIntent.id
  });

  res.json({
    success: true,
    clientSecret: paymentIntent.client_secret,
    paymentIntentId: paymentIntent.id,
    amount
  });
});

// Get payment methods
export const getPaymentMethods = asyncHandler(async (req, res) => {
  const user = req.user;

  const paymentMethods = await prisma.paymentMethod.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json({
    success: true,
    paymentMethods: paymentMethods.map(pm => ({
      id: pm.id,
      last4: pm.last4,
      brand: pm.brand,
      expiryMonth: pm.expiryMonth,
      expiryYear: pm.expiryYear,
      isDefault: pm.isDefault,
      createdAt: pm.createdAt
    }))
  });
});

// Add payment method
export const addPaymentMethod = asyncHandler(async (req, res) => {
  const { paymentMethodId } = req.body;
  const user = req.user;

  // Retrieve payment method from Stripe
  const paymentMethod = await stripeService.getPaymentMethod(paymentMethodId);

  if (!paymentMethod || !paymentMethod.card) {
    throw new AppError('Invalid payment method', 400, 'INVALID_PAYMENT_METHOD');
  }

  // Save to database
  const savedMethod = await prisma.paymentMethod.create({
    data: {
      userId: user.id,
      stripePaymentMethodId: paymentMethodId,
      last4: paymentMethod.card.last4,
      brand: paymentMethod.card.brand,
      expiryMonth: paymentMethod.card.exp_month,
      expiryYear: paymentMethod.card.exp_year,
      isDefault: false
    }
  });

  logger.info('Payment method added', {
    userId: user.id,
    paymentMethodId,
    brand: paymentMethod.card.brand,
    last4: paymentMethod.card.last4
  });

  res.json({
    success: true,
    paymentMethod: {
      id: savedMethod.id,
      last4: savedMethod.last4,
      brand: savedMethod.brand,
      expiryMonth: savedMethod.expiryMonth,
      expiryYear: savedMethod.expiryYear
    }
  });
});

// Remove payment method
export const removePaymentMethod = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = req.user;

  const paymentMethod = await prisma.paymentMethod.findUnique({
    where: { id }
  });

  if (!paymentMethod) {
    throw new AppError('Payment method not found', 404, 'NOT_FOUND');
  }

  if (paymentMethod.userId !== user.id) {
    throw new AppError('Unauthorized', 403, 'FORBIDDEN');
  }

  // Detach from Stripe
  await stripeService.detachPaymentMethod(paymentMethod.stripePaymentMethodId);

  // Delete from database
  await prisma.paymentMethod.delete({
    where: { id }
  });

  logger.info('Payment method removed', {
    userId: user.id,
    paymentMethodId: id
  });

  res.json({
    success: true,
    message: 'Payment method removed successfully'
  });
});

// Verify payment and credit balance (fallback if webhook fails)
export const verifyPayment = asyncHandler(async (req, res) => {
  const { paymentIntentId } = req.body;
  const user = req.user;

  if (!paymentIntentId) {
    throw new AppError('PaymentIntent ID is required', 400, 'VALIDATION_ERROR');
  }

  try {
    // Retrieve payment intent from Stripe
    const paymentIntent = await stripeService.getPaymentIntent(paymentIntentId);

    // Verify it belongs to this user
    if (paymentIntent.metadata.userId !== user.id) {
      throw new AppError('PaymentIntent does not belong to this user', 403, 'FORBIDDEN');
    }

    // Check if payment succeeded
    if (paymentIntent.status !== 'succeeded') {
      return res.json({
        success: false,
        status: paymentIntent.status,
        message: `Payment status: ${paymentIntent.status}`
      });
    }

    // SECURITY: Use transaction to prevent double-crediting race condition
    // This ensures webhook and manual verification cannot both credit the same payment
    const result = await prisma.$transaction(async (tx) => {
      // Check if already processed (with transaction lock)
      const existingTransaction = await tx.transaction.findFirst({
        where: {
          stripePaymentId: paymentIntentId,
          userId: user.id
        }
      });

      if (existingTransaction) {
        logger.info('Payment already processed', {
          userId: user.id,
          paymentIntentId,
          transactionId: existingTransaction.id
        });

        return {
          alreadyProcessed: true,
          transaction: existingTransaction
        };
      }

      // Credit the balance atomically
      const amount = paymentIntent.amount / 100; // Convert from cents
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: { balance: { increment: amount } }, // Atomic increment
        select: { balance: true }
      });

      const newBalance = parseFloat(updatedUser.balance);

      // Create transaction record (MUST use tx for atomicity)
      const transaction = await tx.transaction.create({
        data: {
          userId: user.id,
          amount,
          type: 'DEPOSIT',
          stripePaymentId: paymentIntentId,
          balanceAfter: newBalance,
          metadata: {
            paymentIntent: paymentIntentId,
            processedVia: 'verifyPayment_endpoint',
            timestamp: new Date().toISOString()
          }
        }
      });

      return {
        alreadyProcessed: false,
        transaction,
        amount,
        newBalance
      };
    });

    // Handle result after transaction completes
    if (result.alreadyProcessed) {
      logger.info('Payment already processed - returning existing transaction', {
        userId: user.id,
        paymentIntentId,
        transactionId: result.transaction.id
      });

      return res.json({
        success: true,
        amount: parseFloat(result.transaction.amount),
        newBalance: parseFloat(result.transaction.balanceAfter),
        message: 'Payment already processed',
        alreadyProcessed: true
      });
    }

    // New payment processed successfully
    logger.info('Deposit processed via verifyPayment endpoint', {
      userId: user.id,
      email: user.email,
      amount: result.amount,
      newBalance: result.newBalance,
      paymentIntentId
    });

    await notifyTelegram(
      `💰 Deposit verified & credited: ${user.email} added $${result.amount} (via verifyPayment endpoint)`,
      'success'
    );

    res.json({
      success: true,
      amount: result.amount,
      newBalance: result.newBalance,
      message: 'Payment verified and balance credited'
    });
  } catch (error) {
    logger.error('Failed to verify payment', {
      error: error.message,
      userId: user.id,
      paymentIntentId
    });
    throw new AppError(`Failed to verify payment: ${error.message}`, 500, 'PAYMENT_VERIFICATION_ERROR');
  }
});

export default { createDeposit, getPaymentMethods, addPaymentMethod, removePaymentMethod, verifyPayment };
