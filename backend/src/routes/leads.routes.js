import express from 'express';
import { getLeads, getLead } from '../controllers/leads/leadsMarketplaceController.js';
import { purchaseLead, submitFeedback } from '../controllers/leads/leadsPurchaseController.js';
import { addFavorite, removeFavorite, getFavorites } from '../controllers/leads/leadsFavoritesController.js';
import { requireAuth, attachUser } from '../middleware/auth.js';
import { validations } from '../middleware/validate.js';
import { feedbackLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All lead routes require authentication
router.use(requireAuth, attachUser);

// Get all leads (with filters)
router.get('/', validations.leadFilters, getLeads);

// Get user's favorited leads
router.get('/favorites/list', getFavorites);

// Get single lead
router.get('/:id', getLead);

// Purchase lead - validation runs before controller
router.post('/:id/purchase', validations.purchaseLead, purchaseLead);

// SECURITY: Submit lead feedback with strict rate limiting (5 per hour) to prevent $2 reward spam
router.post('/:leadId/feedback', feedbackLimiter, submitFeedback);

// Add lead to favorites
router.post('/:leadId/favorite', addFavorite);

// Remove lead from favorites
router.delete('/:leadId/favorite', removeFavorite);

export default router;
