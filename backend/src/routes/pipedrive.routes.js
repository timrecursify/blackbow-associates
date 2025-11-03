import express from 'express';
import { importDeals, getImportStatus, syncNow, getSyncStatus } from '../controllers/pipedrive.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin only routes
router.post('/import', requireAuth, requireAdmin, importDeals);
router.get('/status', requireAuth, requireAdmin, getImportStatus);

// Scheduled sync routes
router.post('/sync-now', requireAuth, requireAdmin, syncNow);
router.get('/sync-status', requireAuth, requireAdmin, getSyncStatus);

export default router;
