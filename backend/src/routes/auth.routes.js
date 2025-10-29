import express from 'express';
import { syncUser, verifyAdmin, getCurrentUser } from '../controllers/auth.controller.js';
import { requireAuth, attachUser } from '../middleware/auth.js';
import { authLimiter } from '../middleware/rateLimiter.js';
import { validations } from '../middleware/validate.js';

const router = express.Router();

// Clerk webhook - sync user to database
router.post('/sync', authLimiter, syncUser);

// Verify admin code - grant admin access
router.post('/verify-admin', requireAuth, attachUser, validations.verifyAdmin, verifyAdmin);

// Get current user
router.get('/me', requireAuth, attachUser, getCurrentUser);

export default router;
