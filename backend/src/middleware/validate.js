import { validationResult, body, param, query } from 'express-validator';
import { AppError } from './errorHandler.js';

// Middleware to check validation results
export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorDetails = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.value
    }));

    throw new AppError(
      'Validation failed',
      400,
      'VALIDATION_ERROR',
      errorDetails
    );
  }
  next();
};

// Common validation rules
export const validations = {
  // User profile validation
  updateProfile: [
    body('businessName')
      .optional()
      .trim()
      .isLength({ min: 2, max: 100 })
      .withMessage('Business name must be between 2 and 100 characters'),
    body('vendorType')
      .optional()
      .trim()
      .isLength({ min: 2, max: 50 })
      .withMessage('Vendor type must be between 2 and 50 characters'),
    validate
  ],

  // Billing address validation
  updateBillingAddress: [
    body('isCompany')
      .optional()
      .isBoolean()
      .withMessage('isCompany must be a boolean'),
    body('firstName')
      .optional({ checkFalsy: true })
      .trim()
      .custom((value, { req }) => {
        // Required if not a company
        if (req.body.isCompany !== true) {
          if (!value || value.trim().length === 0) {
            throw new Error('First name is required for individuals');
          }
          if (value.trim().length < 1 || value.trim().length > 50) {
            throw new Error('First name must be between 1 and 50 characters');
          }
        }
        return true;
      }),
    body('lastName')
      .optional({ checkFalsy: true })
      .trim()
      .custom((value, { req }) => {
        // Required if not a company
        if (req.body.isCompany !== true) {
          if (!value || value.trim().length === 0) {
            throw new Error('Last name is required for individuals');
          }
          if (value.trim().length < 1 || value.trim().length > 50) {
            throw new Error('Last name must be between 1 and 50 characters');
          }
        }
        return true;
      }),
    body('companyName')
      .optional({ checkFalsy: true })
      .trim()
      .custom((value, { req }) => {
        // Required if it's a company
        if (req.body.isCompany === true) {
          if (!value || value.trim().length === 0) {
            throw new Error('Company name is required for companies');
          }
          if (value.trim().length < 1 || value.trim().length > 100) {
            throw new Error('Company name must be between 1 and 100 characters');
          }
        }
        return true;
      }),
    body('addressLine1')
      .trim()
      .notEmpty()
      .withMessage('Address line 1 is required')
      .isLength({ min: 5, max: 100 })
      .withMessage('Address line 1 must be between 5 and 100 characters'),
    body('addressLine2')
      .optional()
      .trim()
      .isLength({ max: 100 })
      .withMessage('Address line 2 must be less than 100 characters'),
    body('city')
      .trim()
      .notEmpty()
      .withMessage('City is required')
      .isLength({ min: 2, max: 50 })
      .withMessage('City must be between 2 and 50 characters'),
    body('state')
      .trim()
      .notEmpty()
      .withMessage('State is required')
      .isLength({ min: 2, max: 2 })
      .withMessage('State must be a 2-letter code (e.g., NY, CA)'),
    body('zip')
      .trim()
      .notEmpty()
      .withMessage('ZIP code is required')
      .matches(/^\d{5}(-\d{4})?$/)
      .withMessage('ZIP code must be in format 12345 or 12345-6789'),
    validate
  ],

  // Lead purchase validation
  purchaseLead: [
    param('id')
      .isString()
      .isLength({ min: 8, max: 8 })
      .matches(/^[A-Z]{2}\d{6}$/)
      .withMessage('Invalid lead ID format (expected format: XX123456)'),
    validate
  ],

  // Deposit validation
  createDeposit: [
    body('amount')
      .isFloat({ min: 20, max: 10000 })
      .withMessage('Deposit amount must be between $20 and $10,000'),
    validate
  ],

  // Payment method validation
  addPaymentMethod: [
    body('paymentMethodId')
      .isString()
      .notEmpty()
      .withMessage('Payment method ID is required'),
    validate
  ],

  // Admin verification
  verifyAdmin: [
    body('verificationCode')
      .isString()
      .notEmpty()
      .withMessage('Verification code is required'),
    validate
  ],

  // CSV import validation
  importLeads: [
    body('leads')
      .isArray({ min: 1 })
      .withMessage('Leads array is required'),
    body('leads.*.weddingDate')
      .optional()
      .isISO8601()
      .withMessage('Invalid wedding date format'),
    body('leads.*.location')
      .notEmpty()
      .withMessage('Location is required'),
    body('leads.*.budgetMin')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Budget min must be a positive number'),
    body('leads.*.budgetMax')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Budget max must be a positive number'),
    validate
  ],

  // Balance adjustment (admin)
  adjustBalance: [
    body('amount')
      .isFloat()
      .withMessage('Amount must be a number'),
    body('reason')
      .isString()
      .notEmpty()
      .withMessage('Reason is required'),
    validate
  ],

  // Lead filters
  leadFilters: [
    query('status')
      .optional()
      .isIn(['AVAILABLE', 'SOLD', 'EXPIRED'])
      .withMessage('Invalid status'),
    query('location')
      .optional()
      .trim(),
    query('servicesNeeded')
      .optional()
      .trim(),
    query('minBudget')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Min budget must be a positive number'),
    query('maxBudget')
      .optional()
      .isFloat({ min: 0 })
      .withMessage('Max budget must be a positive number'),
    query('page')
      .optional()
      .isInt({ min: 1 })
      .withMessage('Page must be a positive integer'),
    query('limit')
      .optional()
      .isInt({ min: 1, max: 100 })
      .withMessage('Limit must be between 1 and 100'),
    validate
  ]
};

export default { validate, validations };
