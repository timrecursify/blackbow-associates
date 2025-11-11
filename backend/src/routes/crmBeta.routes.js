/**
 * CRM Beta Routes
 * Public route for beta signups
 */

import express from 'express';
import rateLimit from 'express-rate-limit';
import { createBetaSignup } from '../controllers/crmBeta.controller.js';
import { validations } from '../middleware/validate.js';

const router = express.Router();

// Rate limiter: 5 signup attempts per hour per IP
const signupLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: {
    success: false,
    message: 'Too many signup attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Public beta signup endpoint
router.post('/signup', signupLimiter, validations.crmBetaSignup, createBetaSignup);

export default router;
