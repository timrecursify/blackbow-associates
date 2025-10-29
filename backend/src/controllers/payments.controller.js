import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
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

export default { createDeposit, getPaymentMethods, addPaymentMethod, removePaymentMethod };
