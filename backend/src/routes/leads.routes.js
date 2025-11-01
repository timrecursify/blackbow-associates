import express from 'express';
import { getLeads, getLead, purchaseLead, addFavorite, removeFavorite, getFavorites } from '../controllers/leads.controller.js';
import { requireAuth, attachUser } from '../middleware/auth.js';
import { validations } from '../middleware/validate.js';

const router = express.Router();

// All lead routes require authentication
router.use(requireAuth, attachUser);

// Get all leads (with filters)
router.get('/', validations.leadFilters, getLeads);

// Get user's favorited leads
router.get('/favorites/list', getFavorites);

// Get single lead
router.get('/:id', getLead);

// Purchase lead
router.post('/:id/purchase', validations.purchaseLead, purchaseLead);

// Add lead to favorites
router.post('/:leadId/favorite', addFavorite);

// Remove lead from favorites
router.delete('/:leadId/favorite', removeFavorite);

export default router;
