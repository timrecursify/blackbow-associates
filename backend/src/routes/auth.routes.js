import express from 'express';
import { getCurrentUser, confirmEmail, resendConfirmation, sendInitialConfirmation } from '../controllers/auth.controller.js';
import { requireAuth, attachUser } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Get current user
router.get('/me', requireAuth, attachUser, getCurrentUser);

// Email confirmation (public routes - no auth required but rate limited)
router.get('/confirm-email/:token', authLimiter, confirmEmail);
router.post('/resend-confirmation', authLimiter, resendConfirmation);
router.post('/send-confirmation', authLimiter, sendInitialConfirmation);

export default router;
