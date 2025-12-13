import express from 'express';
import { getAllUsers, getAllLeads, importLeads, adjustBalance, blockUser, unblockUser, deleteUser, updateLeadStatus } from '../controllers/admin.controller.js';
import { getAllBetaSignups, getBetaSignupById, updateSignupStatus, exportBetaSignups } from '../controllers/crmBeta.controller.js';
import { getWebhookStats, getWebhookEvents, getFailedWebhooks, retryWebhook, retryAllFailed } from '../controllers/webhook-admin.controller.js';
import {
  getOverview,
  getAllReferrers,
  getReferrerDetails,
  getPendingPayouts,
  markPayoutPaid,
  toggleReferral
} from '../controllers/admin-referral.controller.js';
import { requireAuth, attachUser, requireAdmin } from '../middleware/auth.js';
import { validations } from '../middleware/validate.js';
import { auditLog } from '../middleware/auditLogger.js';
import { adminIpLimiter, adminUserLimiter } from '../middleware/rateLimiter.js';

const router = express.Router();

// All admin routes require admin authentication FIRST (needed for user rate limiting)
router.use(requireAuth, attachUser, requireAdmin);

// DeSaaS Compliance: Dual rate limiting (IP + User) applied to all admin routes
router.use(adminIpLimiter, adminUserLimiter);

// User management - ALL ROUTES NOW HAVE AUDIT LOGGING
router.get('/users', auditLog, getAllUsers);
router.post('/users/:id/adjust-balance', auditLog, validations.adjustBalance, adjustBalance);
router.post('/users/:id/block', auditLog, blockUser);
router.post('/users/:id/unblock', auditLog, unblockUser);
router.delete('/users/:id', auditLog, deleteUser);

// Lead management - ALL ROUTES NOW HAVE AUDIT LOGGING
router.get('/leads', auditLog, getAllLeads);
router.post('/leads/import', auditLog, validations.importLeads, importLeads);
router.put('/leads/:id/status', auditLog, updateLeadStatus);

// CRM Beta Signups management - ALL ROUTES NOW HAVE AUDIT LOGGING
router.get('/crm-beta-signups', auditLog, getAllBetaSignups);
router.get('/crm-beta-signups/export', auditLog, exportBetaSignups);
router.get('/crm-beta-signups/:id', auditLog, getBetaSignupById);
router.patch('/crm-beta-signups/:id/status', auditLog, updateSignupStatus);

// Webhook monitoring - ALL ROUTES NOW HAVE AUDIT LOGGING
router.get('/webhooks/stats', auditLog, getWebhookStats);
router.get('/webhooks/events', auditLog, getWebhookEvents);
router.get('/webhooks/failed', auditLog, getFailedWebhooks);
router.post('/webhooks/retry/:id', auditLog, retryWebhook);
router.post('/webhooks/retry-all-failed', auditLog, retryAllFailed);

// Referral management - ALL ROUTES NOW HAVE AUDIT LOGGING
router.get('/referrals/overview', auditLog, getOverview);
router.get('/referrals/referrers', auditLog, getAllReferrers);
router.get('/referrals/referrers/:id', auditLog, getReferrerDetails);
router.get('/referrals/payouts', auditLog, getPendingPayouts);
router.post('/referrals/payouts/:id/mark-paid', auditLog, markPayoutPaid);
router.post('/referrals/users/:id/toggle-referral', auditLog, toggleReferral);

export default router;
