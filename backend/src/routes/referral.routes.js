import express from 'express';
import {
  getStats,
  getLink,
  getReferredUsers,
  getCommissions,
  requestPayout,
  getPayouts
} from '../controllers/referral.controller.js';
import { requireAuth, attachUser } from '../middleware/auth.js';

const router = express.Router();

// All referral routes require authentication
router.use(requireAuth, attachUser);

// Get referral statistics
router.get('/stats', getStats);

// Get referral link (auto-generate if missing)
router.get('/link', getLink);

// Get referred users with their purchases
router.get('/referred-users', getReferredUsers);

// Get commission history
router.get('/commissions', getCommissions);

// Request payout
router.post('/request-payout', requestPayout);

// Get payout history
router.get('/payouts', getPayouts);

export default router;
