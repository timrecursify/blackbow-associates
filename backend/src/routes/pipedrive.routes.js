import express from 'express';
import { getImportStatus, getSyncStatus } from '../controllers/pipedrive.controller.js';
import { requireAuth, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Admin only routes
router.get('/status', requireAuth, requireAdmin, getImportStatus);
router.get('/sync-status', requireAuth, requireAdmin, getSyncStatus);

export default router;
