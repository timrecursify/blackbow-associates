import express from 'express';
import { getAllUsers, getAllLeads, importLeads, adjustBalance, blockUser, unblockUser, deleteUser, updateLeadStatus } from '../controllers/admin.controller.js';
import { requireAuth, attachUser, requireAdmin } from '../middleware/auth.js';
import { validations } from '../middleware/validate.js';

const router = express.Router();

// All admin routes require admin authentication
router.use(requireAuth, attachUser, requireAdmin);

// User management
router.get('/users', getAllUsers);
router.post('/users/:id/adjust-balance', validations.adjustBalance, adjustBalance);
router.post('/users/:id/block', blockUser);
router.post('/users/:id/unblock', unblockUser);
router.delete('/users/:id', deleteUser);

// Lead management
router.get('/leads', getAllLeads);
router.post('/leads/import', validations.importLeads, importLeads);
router.put('/leads/:id/status', updateLeadStatus);

export default router;
