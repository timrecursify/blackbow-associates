import { prisma } from '../config/database.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import * as stripeService from '../services/stripe.service.js';

// Stripe webhook handler
export const stripeWebhook = asyncHandler(async (req, res) => {
  const signature = req.headers['stripe-signature'];
  const payload = req.body;

  // Verify webhook signature
  let event;
  try {
    event = stripeService.verifyWebhookSignature(payload, signature);
  } catch (error) {
    logger.error('Stripe webhook signature verification failed', { error: error.message });
    throw new AppError('Invalid signature', 400, 'INVALID_SIGNATURE');
  }

  // Handle events
  switch (event.type) {
    case 'payment_intent.succeeded': {
      const paymentIntent = event.data.object;
      const userId = paymentIntent.metadata.userId;
      const amount = paymentIntent.amount / 100; // Convert from cents

      // Update user balance
      const user = await prisma.user.findUnique({ where: { id: userId } });

      if (!user) {
        logger.error('User not found for payment', { userId, paymentIntentId: paymentIntent.id });
        break;
      }

      const newBalance = parseFloat(user.balance) + amount;

      await prisma.user.update({
        where: { id: userId },
        data: { balance: newBalance }
      });

      // Create transaction record
      await prisma.transaction.create({
        data: {
          userId,
          amount,
          type: 'DEPOSIT',
          stripePaymentId: paymentIntent.id,
          balanceAfter: newBalance,
          metadata: { paymentIntent: paymentIntent.id }
        }
      });

      logger.info('Deposit processed successfully', {
        userId,
        amount,
        newBalance,
        paymentIntentId: paymentIntent.id
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

      logger.warn('Payment failed', {
        userId,
        paymentIntentId: paymentIntent.id,
        error: paymentIntent.last_payment_error
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

  // Verify webhook secret
  const webhookSecret = req.headers['x-pipedrive-webhook-secret'];
  if (webhookSecret !== process.env.PIPEDRIVE_WEBHOOK_SECRET) {
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

// Clerk webhook handler (already implemented in auth.controller.js)
// Re-export for consistency
export { syncUser as clerkWebhook } from './auth.controller.js';

export default { stripeWebhook, pipedriveWebhook, clerkWebhook };
