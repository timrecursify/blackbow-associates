import express from 'express';
import { importDeals, getImportStatus } from '../controllers/pipedrive.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin only routes
router.post('/import', requireAuth, requireAdmin, importDeals);
router.get('/status', requireAuth, requireAdmin, getImportStatus);

export default router;
