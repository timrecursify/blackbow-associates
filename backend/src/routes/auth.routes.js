import express from 'express';
import { getCurrentUser } from '../controllers/auth.controller.js';
import { requireAuth, attachUser } from '../middleware/auth.js';

const router = express.Router();

/**
 * Admin access is managed via database (isAdmin field).
 * No separate admin verification endpoint needed.
 */

// Get current user
router.get('/me', requireAuth, attachUser, getCurrentUser);

export default router;
