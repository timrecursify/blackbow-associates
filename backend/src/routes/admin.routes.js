import express from 'express';
import { getAllUsers, getAllLeads, importLeads, adjustBalance } from '../controllers/admin.controller.js';
import { requireAuth, attachUser, requireAdmin } from '../middleware/auth.js';
import { validations } from '../middleware/validate.js';

const router = express.Router();

// All admin routes require admin authentication
router.use(requireAuth, attachUser, requireAdmin);

// User management
router.get('/users', getAllUsers);
router.post('/users/:id/adjust-balance', validations.adjustBalance, adjustBalance);

// Lead management
router.get('/leads', getAllLeads);
router.post('/leads/import', validations.importLeads, importLeads);

export default router;
