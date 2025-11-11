/**
 * CRM Beta Controller
 * Handles CRM beta signup endpoints
 */

import CrmBetaService from '../services/crmBetaService.js';
import { logger } from '../utils/logger.js';

// Async handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

/**
 * Create a new CRM beta signup
 * POST /api/crm-beta/signup
 */
export const createBetaSignup = asyncHandler(async (req, res) => {
  const { name, email, phone, companyName, companyWebsite, vendorType, message } = req.body;

  try {
    const signup = await CrmBetaService.createSignup({
      name,
      email,
      phone,
      companyName,
      companyWebsite,
      vendorType,
      message
    });

    logger.info('CRM Beta signup created successfully', {
      signupId: signup.id,
      email: signup.email,
      ip: req.ip
    });

    res.status(201).json({
      success: true,
      message: 'Beta signup submitted successfully. Check your email for confirmation.',
      signup: {
        id: signup.id,
        email: signup.email,
        companyName: signup.companyName,
        status: signup.status,
        createdAt: signup.createdAt
      }
    });
  } catch (error) {
    if (error.message === 'EMAIL_ALREADY_REGISTERED') {
      logger.warn('Duplicate beta signup attempt', {
        email,
        ip: req.ip
      });
      return res.status(409).json({
        success: false,
        message: 'This email has already been registered for the beta program.'
      });
    }

    logger.error('Failed to create CRM beta signup', {
      email,
      error: error.message,
      ip: req.ip
    });

    res.status(500).json({
      success: false,
      message: 'Failed to submit beta signup. Please try again later.'
    });
  }
});

/**
 * Get all beta signups (admin only)
 * GET /api/admin/crm-beta-signups
 */
export const getAllBetaSignups = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;

  try {
    const result = await CrmBetaService.getAllSignups(
      parseInt(page),
      parseInt(limit),
      status
    );

    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    logger.error('Failed to retrieve beta signups', {
      error: error.message,
      userId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve beta signups'
    });
  }
});

/**
 * Update beta signup status (admin only)
 * PATCH /api/admin/crm-beta-signups/:id/status
 */
export const updateSignupStatus = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;

  try {
    const signup = await CrmBetaService.updateSignupStatus(id, status);

    logger.info('Beta signup status updated', {
      signupId: id,
      newStatus: status,
      adminUserId: req.user?.id
    });

    res.json({
      success: true,
      message: 'Status updated successfully',
      signup
    });
  } catch (error) {
    if (error.message.includes('Invalid status')) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    logger.error('Failed to update beta signup status', {
      signupId: id,
      status,
      error: error.message,
      adminUserId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to update signup status'
    });
  }
});

/**
 * Get single beta signup by ID (admin only)
 * GET /api/admin/crm-beta-signups/:id
 */
export const getBetaSignupById = asyncHandler(async (req, res) => {
  const { id } = req.params;

  try {
    const signup = await CrmBetaService.getSignupById(id);

    res.json({
      success: true,
      signup
    });
  } catch (error) {
    if (error.message === 'SIGNUP_NOT_FOUND') {
      return res.status(404).json({
        success: false,
        message: 'Beta signup not found'
      });
    }

    logger.error('Failed to retrieve beta signup', {
      signupId: id,
      error: error.message,
      adminUserId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to retrieve beta signup'
    });
  }
});

/**
 * Export all beta signups to CSV (admin only)
 * GET /api/admin/crm-beta-signups/export
 */
export const exportBetaSignups = asyncHandler(async (req, res) => {
  try {
    const csvContent = await CrmBetaService.exportSignupsToCSV();

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="crm-beta-signups-${Date.now()}.csv"`);
    res.send(csvContent);

    logger.info('Beta signups exported', {
      adminUserId: req.user?.id
    });
  } catch (error) {
    logger.error('Failed to export beta signups', {
      error: error.message,
      adminUserId: req.user?.id
    });

    res.status(500).json({
      success: false,
      message: 'Failed to export beta signups'
    });
  }
});

export default {
  createBetaSignup,
  getAllBetaSignups,
  updateSignupStatus,
  getBetaSignupById,
  exportBetaSignups
};
