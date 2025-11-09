import express from 'express';
import {
  getCurrentUser,
  confirmEmail,
  resendConfirmation,
  sendInitialConfirmation,
  requestPasswordReset,
  verifyResetToken,
  resetPassword
} from '../controllers/auth.controller.js';
import { requireAuth, attachUser } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Get current user
router.get('/me', requireAuth, attachUser, getCurrentUser);

// Email confirmation (public routes - no auth required but rate limited)
router.get('/confirm-email/:token', authLimiter, confirmEmail);
router.post('/resend-confirmation', authLimiter, resendConfirmation);
router.post('/send-confirmation', authLimiter, sendInitialConfirmation);

// Password reset (public routes - no auth required but rate limited)
router.post('/forgot-password', authLimiter, requestPasswordReset);
router.get('/verify-reset-token/:token', authLimiter, verifyResetToken);
router.post('/reset-password', authLimiter, resetPassword);

export default router;
