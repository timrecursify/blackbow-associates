import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import EmailService from '../services/emailService.js';
import { supabaseAdmin } from '../middleware/auth.js';

/**
 * Admin access is granted by setting isAdmin=true directly in the database.
 * No verification code needed - admins are designated users, not self-registered.
 */

// Get current user
export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = req.user;

  res.json({
    success: true,
    user: {
      id: user.id,
      email: user.email,
      businessName: user.businessName,
      vendorType: user.vendorType,
      balance: user.balance,
      isAdmin: user.isAdmin,
      isBlocked: user.isBlocked,
      blockedReason: user.blockedReason,
      createdAt: user.createdAt
    }
  });
});


/**
 * Email Confirmation endpoints
 */

// Confirm email with token
export const confirmEmail = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Confirmation token is required'
    });
  }

  // Find user by confirmation token
  const user = await prisma.user.findUnique({
    where: { confirmationToken: token }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired confirmation token'
    });
  }

  // Check if already confirmed
  if (user.emailConfirmed) {
    return res.status(200).json({
      success: true,
      message: 'Email already confirmed',
      alreadyConfirmed: true
    });
  }

  // Check token expiry (24 hours) - only if confirmationSentAt exists
  if (user.confirmationSentAt) {
    const tokenAge = Date.now() - new Date(user.confirmationSentAt).getTime();
    const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

    if (tokenAge > TWENTY_FOUR_HOURS) {
      return res.status(400).json({
        success: false,
        message: 'Confirmation token has expired. Please request a new one.',
        expired: true
      });
    }
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      emailConfirmed: true,
      confirmationToken: null
    }
  });

  logger.info('Email confirmed successfully', {
    userId: user.id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Email confirmed successfully! Redirecting to onboarding...'
  });
});

// Resend confirmation email
export const resendConfirmation = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({
      success: false,
      message: 'Email is required'
    });
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // Don't reveal if user exists or not for security
    return res.json({
      success: true,
      message: 'If an account with that email exists, a confirmation email has been sent.'
    });
  }

  // Check if already confirmed
  if (user.emailConfirmed) {
    return res.status(400).json({
      success: false,
      message: 'Email is already confirmed'
    });
  }

  // Check rate limiting - max 1 resend per 60 seconds
  if (user.confirmationSentAt) {
    const timeSinceLastSend = Date.now() - new Date(user.confirmationSentAt).getTime();
    const ONE_MINUTE = 60 * 1000;

    if (timeSinceLastSend < ONE_MINUTE) {
      const waitSeconds = Math.ceil((ONE_MINUTE - timeSinceLastSend) / 1000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitSeconds} seconds before requesting another confirmation email`,
        waitSeconds
      });
    }
  }

  // Generate new token
  const newToken = EmailService.generateConfirmationToken();

  // Update user with new token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      confirmationToken: newToken,
      confirmationSentAt: new Date()
    }
  });

  // Send confirmation email
  try {
    await EmailService.sendConfirmationEmail(user.email, user.businessName, newToken);

    logger.info('Confirmation email resent', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Confirmation email sent! Please check your inbox.'
    });
  } catch (error) {
    logger.error('Failed to resend confirmation email', {
      userId: user.id,
      email: user.email,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send confirmation email. Please try again later.'
    });
  }
});


// Send confirmation email after signup
export const sendInitialConfirmation = asyncHandler(async (req, res) => {
  const { email, businessName } = req.body;

  if (!email || !businessName) {
    return res.status(400).json({
      success: false,
      message: 'Email and business name are required'
    });
  }

  logger.info('sendInitialConfirmation called', {
    email,
    businessName,
    hasResendKey: !!process.env.RESEND_API_KEY,
    fromEmail: process.env.DEFAULT_FROM_EMAIL
  });

  // Find or create user by email
  // User might not exist in DB yet if they just signed up with Supabase
  let user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    // User doesn't exist in our DB yet - this is normal for new signups
    // Fetch from Supabase Auth to get authUserId
    try {
      // List all users and find by email
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();
      
      if (authError) {
        logger.error('Failed to fetch auth users', {
          email,
          error: authError.message
        });
        throw new Error(`Failed to fetch auth users: ${authError.message}`);
      }
      
      const authUser = authUsers.users.find(u => u.email === email);
      
      if (!authUser) {
        logger.warn('User not found in Supabase Auth', { email });
        return res.status(404).json({
          success: false,
          message: 'User not found in authentication system'
        });
      }
      
      // Create user in our database
      user = await prisma.user.create({
        data: {
          authUserId: authUser.id,
          email: email,
          businessName: businessName,
          vendorType: 'Other',
          balance: 0,
          emailConfirmed: false,
          onboardingCompleted: false
        }
      });
      
      logger.info('User created during email confirmation flow', {
        userId: user.id,
        authUserId: authUser.id,
        email
      });
    } catch (error) {
      logger.error('Failed to create user for email confirmation', {
        email,
        error: error.message,
        stack: error.stack
      });
      throw error;
    }
  }

  // Check if already confirmed
  if (user.emailConfirmed) {
    return res.json({
      success: true,
      message: 'Email already confirmed',
      alreadyConfirmed: true
    });
  }

  // Generate confirmation token
  const confirmationToken = EmailService.generateConfirmationToken();

  // Update user with token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      confirmationToken,
      confirmationSentAt: new Date()
    }
  });

  // Send confirmation email
  try {
    logger.info('Attempting to send confirmation email via Resend', {
      userId: user.id,
      email: email,
      businessName: businessName
    });

    await EmailService.sendConfirmationEmail(email, businessName, confirmationToken);

    logger.info('Initial confirmation email sent successfully', {
      userId: user.id,
      email: email
    });

    res.json({
      success: true,
      message: 'Confirmation email sent successfully'
    });
  } catch (error) {
    logger.error('Failed to send initial confirmation email', {
      userId: user.id,
      email: email,
      error: error.message,
      stack: error.stack,
      resendError: error.response?.data || error.error
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send confirmation email. Please use the resend button.',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});


export default { getCurrentUser, confirmEmail, resendConfirmation, sendInitialConfirmation };
