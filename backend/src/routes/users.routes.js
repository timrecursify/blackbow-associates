import express from 'express';
import { getProfile, updateProfile, getTransactions, getPurchasedLeads } from '../controllers/users.controller.js';
import { requireAuth, attachUser } from '../middleware/auth.js';
import { validations } from '../middleware/validate.js';

const router = express.Router();

// All user routes require authentication
router.use(requireAuth, attachUser);

// Get user profile
router.get('/profile', getProfile);

// Update user profile
router.put('/profile', validations.updateProfile, updateProfile);

// Get transaction history
router.get('/transactions', getTransactions);

// Get purchased leads
router.get('/purchases', getPurchasedLeads);

export default router;
