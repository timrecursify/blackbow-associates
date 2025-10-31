import express from 'express';
import { createDeposit, getPaymentMethods, addPaymentMethod, removePaymentMethod, verifyPayment } from '../controllers/payments.controller.js';
import { requireAuth, attachUser } from '../middleware/auth.js';
import { paymentLimiter } from '../middleware/rateLimiter.js';
import { validations } from '../middleware/validate.js';

const router = express.Router();

// All payment routes require authentication
router.use(requireAuth, attachUser);

// Create deposit payment intent
router.post('/deposit', paymentLimiter, validations.createDeposit, createDeposit);

// Verify payment (fallback if webhook fails)
router.post('/verify', paymentLimiter, verifyPayment);

// Payment methods
router.get('/methods', getPaymentMethods);
router.post('/methods', validations.addPaymentMethod, addPaymentMethod);
router.delete('/methods/:id', removePaymentMethod);

export default router;
