import express from 'express';
import { stripeWebhook, pipedriveWebhook, clerkWebhook } from '../controllers/webhooks.controller.js';

const router = express.Router();

// Stripe webhook (raw body needed for signature verification)
router.post('/stripe', express.raw({ type: 'application/json' }), stripeWebhook);

// Pipedrive webhook
router.post('/pipedrive', pipedriveWebhook);

// Clerk webhook
router.post('/clerk', clerkWebhook);

export default router;
