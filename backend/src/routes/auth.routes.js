import express from 'express';
import {
  register,
  login,
  refreshTokenEndpoint,
  logout,
  getCurrentUser,
  confirmEmail,
  resendConfirmation,
  sendInitialConfirmation,
  requestPasswordReset,
  verifyResetToken,
  resetPassword
} from '../controllers/auth.controller.js';
import {
  initiateGoogleLogin,
  handleGoogleCallback,
  handleOAuthLogout
} from '../controllers/oauth-auth.controller.js';
import { requireAuth, attachUser } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Google OAuth routes (Direct to Google - no Zitadel)
router.get('/google/login', initiateGoogleLogin);
router.get('/google/callback', handleGoogleCallback);
router.post('/google/logout', handleOAuthLogout);

// Authentication routes (public - rate limited)
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/refresh', authLimiter, refreshTokenEndpoint);
router.post('/logout', requireAuth, attachUser, logout);

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
