import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import * as stripeService from '../services/stripe.service.js';
import { processWebhookEvent } from '../services/webhook-processor.service.js';
import { NotificationService } from '../services/notification.service.js';

// Stripe webhook handler
export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const payload = req.body;

  logger.info('Stripe webhook received', {
    hasSignature: !!signature,
    payloadSize: payload.length,
    headers: Object.keys(req.headers)
  });

  // Verify webhook signature
  let event;
  try {
    event = stripeService.verifyWebhookSignature(payload, signature);
    logger.info('Webhook signature verified', { eventType: event.type });
  } catch (error) {
    logger.error('Stripe webhook signature verification failed', { 
      error: error.message,
      signature: signature ? signature.substring(0, 20) + '...' : 'missing'
    });
    throw new AppError('Invalid signature', 400, 'INVALID_SIGNATURE');
  }

  // Handle events
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata?.userId;
      const amount = paymentIntent.amount / 100; // Convert from cents

      // Validate userId exists in metadata
      if (!userId || typeof userId !== 'string') {
        logger.error('Missing or invalid userId in payment intent metadata', {
          paymentIntentId: paymentIntent.id,
          metadata: paymentIntent.metadata,
          customerId: paymentIntent.customer
        });
        res.status(200).json({ received: true, error: 'Missing userId in metadata' });
        return;
      }

      // SECURITY: Validate amount bounds to prevent manipulation
      if (amount < 0 || amount > 10000) {
        logger.error('Invalid payment amount in webhook', {
          userId,
          amount,
          paymentIntentId: paymentIntent.id
        });
        break; // Reject invalid amounts
      }

      // SECURITY: Use transaction to prevent race conditions and duplicate processing
      try {
        const result = await prisma.$transaction(async (tx) => {
          // Check if payment already processed (prevent duplicate credits)
          const existingTransaction = await tx.transaction.findFirst({
            where: {
              stripePaymentId: paymentIntent.id,
              userId: userId
            }
          });

          if (existingTransaction) {
            logger.warn('Payment already processed via webhook - duplicate event', {
              userId,
              paymentIntentId: paymentIntent.id,
              transactionId: existingTransaction.id
            });
            return { alreadyProcessed: true, transaction: existingTransaction };
          }

          // Get user with lock
          const user = await tx.user.findUnique({ 
            where: { id: userId },
            select: { id: true, email: true, balance: true }
          });

          if (!user) {
            logger.error('User not found for payment', { 
              userId, 
              paymentIntentId: paymentIntent.id,
              customerId: paymentIntent.customer,
              metadata: paymentIntent.metadata
            });
            throw new Error(`User not found: ${userId}`);
          }

          // Atomic balance update
          const updatedUser = await tx.user.update({
            where: { id: userId },
            data: { balance: { increment: amount } },
            select: { balance: true }
          });

          const newBalance = parseFloat(updatedUser.balance);

          // Create transaction record atomically
          const transaction = await tx.transaction.create({
            data: {
              userId,
              amount,
              type: 'DEPOSIT',
              stripePaymentId: paymentIntent.id,
              balanceAfter: newBalance,
              metadata: { 
                paymentIntent: paymentIntent.id,
                processedVia: 'stripe_webhook',
                timestamp: new Date().toISOString()
              }
            }
          });

          return { alreadyProcessed: false, transaction, user, amount, newBalance };
        });

        if (result.alreadyProcessed) {
          logger.info('Payment already processed - skipping duplicate webhook', {
            userId,
            paymentIntentId: paymentIntent.id
          });
          break;
        }

        logger.info('Deposit processed successfully via webhook', {
          userId: result.user.id,
          email: result.user.email,
          amount: result.amount,
          newBalance: result.newBalance,
          paymentIntentId: paymentIntent.id,
          timestamp: new Date().toISOString()
        });

        await notifyTelegram(
          `💰 Deposit successful: ${result.user.email} added $${result.amount}`,
          'success'
        );

        await NotificationService.create({
          userId: result.user.id,
          type: 'DEPOSIT_CONFIRMED',
          title: 'Deposit confirmed',
          body: `Your deposit of $${Number(result.amount).toFixed(2)} was confirmed. New balance: $${Number(result.newBalance).toFixed(2)}.`,
          linkUrl: '/account?tab=transactions',
          metadata: { stripePaymentId: paymentIntent.id, amount: Number(result.amount) }
        });
      } catch (error) {
        logger.error('Failed to process payment webhook', {
          error: error.message,
          stack: error.stack,
          userId,
          paymentIntentId: paymentIntent.id
        });
        // Don't break - let webhook handler continue (Stripe will retry)
        throw error;
      }

      break;
    }

    case 'payment_intent.payment_failed': {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata.userId;

      // SECURITY: Sanitize payment error - do not log sensitive payment details
      const sanitizedError = paymentIntent.last_payment_error ? {
        code: paymentIntent.last_payment_error.code,
        type: paymentIntent.last_payment_error.type,
        decline_code: paymentIntent.last_payment_error.decline_code,
        // Do NOT log: payment_method object (contains card details), charge details, or full message
      } : null;

      logger.warn('Payment failed', {
        userId,
        paymentIntentId: paymentIntent.id,
        errorCode: sanitizedError?.code,
        errorType: sanitizedError?.type,
        declineCode: sanitizedError?.decline_code
      });

      await notifyTelegram(
        `❌ Payment failed for user ${userId}`,
        'warn'
      );

      break;
    }

    default:
      logger.info('Unhandled Stripe webhook event', { type: event.type });
  }

  res.json({ received: true });
});

// Pipedrive webhook handler
// Pipedrive webhook handler - Updated to use HTTP Basic Auth
// Pipedrive webhook handler - Supports both v1 and v2 webhook formats
export const pipedriveWebhook = asyncHandler(async (req, res) => {
  // Extract data - support both v1 (event, current) and v2 (meta, data) formats
  const { event, current, meta, data, previous } = req.body;

  // DEBUG: Log full webhook payload
  logger.info('Pipedrive webhook received', {
    event,
    meta,
    hasCurrentData: !!current,
    hasData: !!data,
    bodyKeys: Object.keys(req.body)
  });

  // SECURITY: Verify webhook using HTTP Basic Auth (Pipedrive supports this)
  const authHeader = req.headers.authorization;
  const expectedSecret = process.env.PIPEDRIVE_WEBHOOK_SECRET;

  if (!authHeader || !expectedSecret) {
    logger.warn('Pipedrive webhook authentication missing', {
      hasAuthHeader: !!authHeader,
      hasConfiguredSecret: !!expectedSecret
    });
    throw new AppError('Invalid webhook authentication', 401, 'UNAUTHORIZED');
  }

  // Parse HTTP Basic Auth: Authorization: Basic base64(username:password)
  if (!authHeader.startsWith('Basic ')) {
    logger.warn('Pipedrive webhook invalid auth format', { ip: req.ip });
    throw new AppError('Invalid webhook authentication', 401, 'UNAUTHORIZED');
  }

  try {
    const base64Credentials = authHeader.slice(6);
    const credentials = Buffer.from(base64Credentials, 'base64').toString('utf8');
    const [username, password] = credentials.split(':');

    const receivedBuffer = Buffer.from(password || '', 'utf8');
    const expectedBuffer = Buffer.from(expectedSecret, 'utf8');

    if (receivedBuffer.length !== expectedBuffer.length) {
      throw new AppError('Invalid webhook authentication', 401, 'UNAUTHORIZED');
    }

    if (!crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
      logger.warn('Pipedrive webhook authentication failed - invalid password', { ip: req.ip });
      throw new AppError('Invalid webhook authentication', 401, 'UNAUTHORIZED');
    }
  } catch (error) {
    if (error instanceof AppError) throw error;
    logger.warn('Pipedrive webhook authentication parsing failed', { error: error.message, ip: req.ip });
    throw new AppError('Invalid webhook authentication', 401, 'UNAUTHORIZED');
  }

  // Determine event type and deal data - support both v1 and v2 formats
  let eventType = null;
  let deal = null;

  // v2 format: meta.action and meta.entity
  if (meta && meta.entity === 'deal') {
    if (meta.action === 'create' || meta.action === 'added') {
      eventType = 'added.deal';
    } else if (meta.action === 'update' || meta.action === 'updated') {
      eventType = 'updated.deal';
    }
    deal = data; // v2 uses 'data' field
  }
  // v1 format: event field
  else if (event === 'added.deal' || event === 'updated.deal') {
    eventType = event;
    deal = current; // v1 uses 'current' field
  }

  logger.info('Pipedrive webhook parsed', {
    eventType,
    hasDeal: !!deal,
    dealId: deal?.id,
    dealKeys: deal ? Object.keys(deal).slice(0, 20) : []
  });

  if (eventType && deal && deal.id) {
    try {
      // Create webhook event record in database for async processing
      const webhookEvent = await prisma.webhookEvent.create({
        data: {
          source: 'pipedrive',
          eventType: eventType,
          dealId: deal.id,
          payload: req.body,
          status: 'PENDING'
        }
      });

      logger.info('Webhook event created', {
        eventId: webhookEvent.id,
        source: 'pipedrive',
        eventType: eventType,
        dealId: deal.id
      });

      // Process asynchronously - don't await to respond to Pipedrive immediately
      processWebhookEvent(webhookEvent.id)
        .then(result => {
          logger.info('Webhook processed successfully', {
            eventId: webhookEvent.id,
            result
          });
        })
        .catch(error => {
          logger.error('Webhook processing failed', {
            eventId: webhookEvent.id,
            error: error.message,
            stack: error.stack
          });
        });

      // Acknowledge to Pipedrive immediately
      res.json({ received: true, eventId: webhookEvent.id });
    } catch (error) {
      logger.error('Failed to create webhook event', {
        error: error.message,
        stack: error.stack,
        dealId: deal?.id,
        eventType
      });
      res.json({ received: true, error: 'Failed to queue event' });
    }
  } else {
    // For non-deal events, just acknowledge
    logger.info('Pipedrive webhook ignored - not a deal event', {
      eventType,
      hasDeal: !!deal,
      meta
    });
    res.json({ received: true });
  }
});





export default { stripeWebhook, pipedriveWebhook };
