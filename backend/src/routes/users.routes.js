import express from 'express';
import { getProfile, updateProfile, getTransactions, getPurchasedLeads, updateLeadNote, updateBillingAddress } from '../controllers/users.controller.js';
import { requireAuth, attachUser } from '../middleware/auth.js';
import { validations } from '../middleware/validate.js';

const router = express.Router();

// All user routes require authentication
router.use(requireAuth, attachUser);

// Get user profile
router.get('/profile', getProfile);

// Update user profile
router.put('/profile', validations.updateProfile, updateProfile);

// Update billing address
router.put('/billing-address', validations.updateBillingAddress, updateBillingAddress);

// Get transaction history
router.get('/transactions', getTransactions);

// Get purchased leads
router.get('/purchased-leads', getPurchasedLeads);

// Update note on purchased lead
router.put('/leads/:leadId/note', updateLeadNote);

export default router;
