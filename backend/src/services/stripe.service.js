import Stripe from 'stripe';
import { logger } from '../utils/logger.js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create payment intent for deposit
export const createPaymentIntent = async (amount, userId, metadata = {}) => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency: 'usd',
      metadata: {
        userId,
        ...metadata
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    logger.info('Stripe PaymentIntent created', {
      paymentIntentId: paymentIntent.id,
      amount,
      userId
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to create PaymentIntent', {
      error: error.message,
      userId,
      amount
    });
    throw error;
  }
};

// Attach payment method to customer
export const attachPaymentMethod = async (paymentMethodId, customerId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
      customer: customerId
    });

    logger.info('Payment method attached', {
      paymentMethodId,
      customerId
    });

    return paymentMethod;
  } catch (error) {
    logger.error('Failed to attach payment method', {
      error: error.message,
      paymentMethodId,
      customerId
    });
    throw error;
  }
};

// Detach payment method
export const detachPaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.detach(paymentMethodId);

    logger.info('Payment method detached', { paymentMethodId });

    return paymentMethod;
  } catch (error) {
    logger.error('Failed to detach payment method', {
      error: error.message,
      paymentMethodId
    });
    throw error;
  }
};

// Verify webhook signature
export const verifyWebhookSignature = (payload, signature) => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    return event;
  } catch (error) {
    logger.error('Webhook signature verification failed', {
      error: error.message
    });
    throw new Error('Invalid webhook signature');
  }
};

// Create customer (for saving payment methods)
export const createCustomer = async (email, metadata = {}) => {
  try {
    const customer = await stripe.customers.create({
      email,
      metadata
    });

    logger.info('Stripe customer created', {
      customerId: customer.id,
      email
    });

    return customer;
  } catch (error) {
    logger.error('Failed to create customer', {
      error: error.message,
      email
    });
    throw error;
  }
};

// Retrieve payment intent from Stripe
export const getPaymentIntent = async (paymentIntentId) => {
  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    return paymentIntent;
  } catch (error) {
    logger.error('Failed to retrieve PaymentIntent', {
      error: error.message,
      paymentIntentId
    });
    throw error;
  }
};

// Get payment method details
export const getPaymentMethod = async (paymentMethodId) => {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return paymentMethod;
  } catch (error) {
    logger.error('Failed to retrieve payment method', {
      error: error.message,
      paymentMethodId
    });
    throw error;
  }
};

export default {
  createPaymentIntent,
  attachPaymentMethod,
  detachPaymentMethod,
  verifyWebhookSignature,
  createCustomer,
  getPaymentMethod,
  getPaymentIntent
};
