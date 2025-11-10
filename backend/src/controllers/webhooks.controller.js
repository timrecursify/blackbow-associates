import crypto from 'crypto';
import { prisma } from '../config/database.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import * as stripeService from '../services/stripe.service.js';

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

      logger.info('Deposit processed successfully via webhook', {
        userId,
        email: user.email,
        amount,
        newBalance,
        paymentIntentId: paymentIntent.id,
        timestamp: new Date().toISOString()
      });

      await notifyTelegram(
        `💰 Deposit successful: ${user.email} added $${amount}`,
        'success'
      );

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
export const pipedriveWebhook = asyncHandler(async (req, res) => {
  const { event, current } = req.body;

  // SECURITY: Verify webhook secret using constant-time comparison to prevent timing attacks
  const webhookSecret = req.headers['x-pipedrive-webhook-secret'];
  const expectedSecret = process.env.PIPEDRIVE_WEBHOOK_SECRET;

  if (!webhookSecret || !expectedSecret) {
    logger.warn('Pipedrive webhook secret missing', {
      hasReceivedSecret: !!webhookSecret,
      hasConfiguredSecret: !!expectedSecret
    });
    throw new AppError('Invalid webhook secret', 401, 'UNAUTHORIZED');
  }

  // Use constant-time comparison to prevent timing attacks
  const receivedBuffer = Buffer.from(webhookSecret, 'utf8');
  const expectedBuffer = Buffer.from(expectedSecret, 'utf8');

  // Ensure buffers are same length to prevent timing leak
  if (receivedBuffer.length !== expectedBuffer.length) {
    throw new AppError('Invalid webhook secret', 401, 'UNAUTHORIZED');
  }

  if (!crypto.timingSafeEqual(receivedBuffer, expectedBuffer)) {
    logger.warn('Pipedrive webhook authentication failed - invalid secret', {
      ip: req.ip
    });
    throw new AppError('Invalid webhook secret', 401, 'UNAUTHORIZED');
  }

  if (event === 'added.deal' || event === 'updated.deal') {
    const deal = current;

    // Extract lead information from deal
    const leadData = {
      pipedriveDealId: deal.id,
      weddingDate: deal.wedding_date ? new Date(deal.wedding_date) : null,
      location: deal.location || 'Unknown',
      city: deal.city || null,
      state: deal.state || null,
      budgetMin: deal.budget_min || null,
      budgetMax: deal.value || null,
      servicesNeeded: deal.services_needed ? deal.services_needed.split(',') : [],
      price: 20,
      status: 'AVAILABLE',
      maskedInfo: {
        couple: `Couple in ${deal.city || deal.location}`,
        phone: '***-***-****',
        email: '***@***.***'
      },
      fullInfo: {
        coupleName: deal.person_name || deal.org_name || 'Unknown',
        email: deal.person_email || null,
        phone: deal.person_phone || null,
        notes: deal.notes || ''
      }
    };

    // Upsert lead (create or update)
    const lead = await prisma.lead.upsert({
      where: { pipedriveDealId: deal.id },
      update: leadData,
      create: leadData
    });

    logger.info('Lead created/updated from Pipedrive', {
      leadId: lead.id,
      dealId: deal.id,
      location: lead.location
    });

    await notifyTelegram(
      `📋 New lead from Pipedrive: ${lead.location} - ${lead.servicesNeeded.join(', ')}`,
      'info'
    );
  }

  res.json({ received: true });
});

export default { stripeWebhook, pipedriveWebhook };
