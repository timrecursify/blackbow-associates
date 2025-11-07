import express from 'express';
import { getLeads, getLead } from '../controllers/leads/leadsMarketplaceController.js';
import { purchaseLead, submitFeedback } from '../controllers/leads/leadsPurchaseController.js';
import { addFavorite, removeFavorite, getFavorites } from '../controllers/leads/leadsFavoritesController.js';
import { requireAuth, attachUser } from '../middleware/auth.js';
import { validations } from '../middleware/validate.js';
import { feedbackLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// Public routes (no auth required)
router.get('/', getLeads);
router.get('/:id', getLead);

// Protected routes (auth required)
// Purchase lead - validation runs before controller
router.post('/:id/purchase', requireAuth, attachUser, validations.purchaseLead, purchaseLead);

// SECURITY: Submit lead feedback with strict rate limiting (5 per hour) to prevent $2 reward spam
router.post('/:leadId/feedback', requireAuth, attachUser, feedbackLimiter, submitFeedback);

// Add lead to favorites
router.post('/:leadId/favorite', requireAuth, attachUser, addFavorite);
router.delete('/:leadId/favorite', requireAuth, attachUser, removeFavorite);
router.get('/favorites/list', requireAuth, attachUser, getFavorites);

export default router;
