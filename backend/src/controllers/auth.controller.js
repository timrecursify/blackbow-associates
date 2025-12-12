import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import EmailService from '../services/emailService.js';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  validatePassword,
  validateEmail
} from '../services/auth.service.js';

/**
 * Admin access is granted by setting isAdmin=true directly in the database.
 * No verification code needed - admins are designated users, not self-registered.
 */

/**
 * Authentication endpoints - Custom JWT
 */

// Register new user with email/password
export const register = asyncHandler(async (req, res) => {
  const { email, password, businessName, vendorType } = req.body;

  // Validate required fields
  if (!email || !password || !businessName) {
    return res.status(400).json({
      success: false,
      message: 'Email, password, and business name are required'
    });
  }

  // Validate email format
  if (!validateEmail(email)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid email format'
    });
  }

  // Validate password strength
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return res.status(400).json({
      success: false,
      message: passwordValidation.message
    });
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email }
  });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: 'User with this email already exists'
    });
  }

  // Hash password
  const passwordHash = await hashPassword(password);

  // Generate confirmation token
  const confirmationToken = EmailService.generateConfirmationToken();

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      businessName,
      vendorType: vendorType || 'Other',
      balance: 0,
      emailConfirmed: false,
      onboardingCompleted: false,
      confirmationToken,
      confirmationSentAt: new Date()
    }
  });

  // Send confirmation email
  try {
    await EmailService.sendConfirmationEmail(email, businessName, confirmationToken);

    logger.info('User registered successfully', {
      userId: user.id,
      email: user.email
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! Please check your email to confirm your account.',
      user: {
        id: user.id,
        email: user.email,
        businessName: user.businessName
      }
    });
  } catch (error) {
    logger.error('Failed to send confirmation email after registration', {
      userId: user.id,
      email: user.email,
      error: error.message
    });

    res.status(201).json({
      success: true,
      message: 'Registration successful! However, we could not send the confirmation email. Please use the resend option.',
      user: {
        id: user.id,
        email: user.email,
        businessName: user.businessName
      }
    });
  }
});

// Login with email/password
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({
      success: false,
      message: 'Email and password are required'
    });
  }

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user || !user.passwordHash) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Check if user is blocked
  if (user.isBlocked) {
    return res.status(403).json({
      success: false,
      message: `Account blocked${user.blockedReason ? `: ${user.blockedReason}` : '. Please contact support.'}`
    });
  }

  // Compare password
  const isPasswordValid = await comparePassword(password, user.passwordHash);

  if (!isPasswordValid) {
    return res.status(401).json({
      success: false,
      message: 'Invalid email or password'
    });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Calculate refresh token expiry (7 days from now)
  const refreshTokenExpiresAt = new Date();
  refreshTokenExpiresAt.setDate(refreshTokenExpiresAt.getDate() + 7);

  // Store refresh token in database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken,
      refreshTokenExpiresAt
    }
  });

  logger.info('User logged in successfully', {
    userId: user.id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Login successful',
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      businessName: user.businessName,
      vendorType: user.vendorType,
      balance: user.balance,
      isAdmin: user.isAdmin,
      emailConfirmed: user.emailConfirmed,
      onboardingCompleted: user.onboardingCompleted
    }
  });
});

// Refresh access token using refresh token
export const refreshTokenEndpoint = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: 'Refresh token is required'
    });
  }

  // Verify refresh token
  let decoded;
  try {
    decoded = verifyToken(refreshToken);
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired refresh token'
    });
  }

  // Check token type
  if (decoded.type !== 'refresh') {
    return res.status(401).json({
      success: false,
      message: 'Invalid token type'
    });
  }

  // Find user and verify refresh token matches
  const user = await prisma.user.findUnique({
    where: { id: decoded.sub }
  });

  if (!user || user.refreshToken !== refreshToken) {
    return res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }

  // Check if refresh token has expired
  if (user.refreshTokenExpiresAt && new Date() > user.refreshTokenExpiresAt) {
    return res.status(401).json({
      success: false,
      message: 'Refresh token has expired. Please login again.'
    });
  }

  // Check if user is blocked
  if (user.isBlocked) {
    return res.status(403).json({
      success: false,
      message: `Account blocked${user.blockedReason ? `: ${user.blockedReason}` : '. Please contact support.'}`
    });
  }

  // Generate new access token
  const newAccessToken = generateAccessToken(user);

  logger.info('Access token refreshed', {
    userId: user.id,
    email: user.email
  });

  res.json({
    success: true,
    accessToken: newAccessToken
  });
});

// Logout user
export const logout = asyncHandler(async (req, res) => {
  const user = req.user;

  // Clear refresh token from database
  await prisma.user.update({
    where: { id: user.id },
    data: {
      refreshToken: null,
      refreshTokenExpiresAt: null
    }
  });

  logger.info('User logged out', {
    userId: user.id,
    email: user.email
  });

  res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

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

  // Find user by email
  const user = await prisma.user.findUnique({
    where: { email }
  });

  if (!user) {
    logger.warn('User not found for email confirmation', { email });
    return res.status(404).json({
      success: false,
      message: 'User not found. Please register first.'
    });
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


/**
 * Password Reset endpoints
 */

// Request password reset
export const requestPasswordReset = asyncHandler(async (req, res) => {
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

  // Don't reveal if user exists or not for security
  if (!user) {
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent.'
    });
  }

  // Check rate limiting - max 1 request per 5 minutes
  if (user.passwordResetSentAt) {
    const timeSinceLastSend = Date.now() - new Date(user.passwordResetSentAt).getTime();
    const FIVE_MINUTES = 5 * 60 * 1000;

    if (timeSinceLastSend < FIVE_MINUTES) {
      const waitMinutes = Math.ceil((FIVE_MINUTES - timeSinceLastSend) / 60000);
      return res.status(429).json({
        success: false,
        message: `Please wait ${waitMinutes} minute(s) before requesting another password reset email`,
        waitMinutes
      });
    }
  }

  // Generate reset token
  const resetToken = EmailService.generatePasswordResetToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

  // Update user with reset token
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
      passwordResetSentAt: new Date()
    }
  });

  // Send password reset email
  try {
    await EmailService.sendPasswordResetEmail(user.email, user.businessName, resetToken);

    logger.info('Password reset email sent', {
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Password reset email sent! Please check your inbox.'
    });
  } catch (error) {
    logger.error('Failed to send password reset email', {
      userId: user.id,
      email: user.email,
      error: error.message,
      stack: error.stack
    });

    res.status(500).json({
      success: false,
      message: 'Failed to send password reset email. Please try again later.'
    });
  }
});

// Verify reset token
export const verifyResetToken = asyncHandler(async (req, res) => {
  const { token } = req.params;

  if (!token) {
    return res.status(400).json({
      success: false,
      message: 'Reset token is required'
    });
  }

  // Find user by reset token
  const user = await prisma.user.findUnique({
    where: { passwordResetToken: token }
  });

  if (!user) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Check token expiry
  if (!user.passwordResetExpires || new Date() > new Date(user.passwordResetExpires)) {
    return res.status(400).json({
      success: false,
      message: 'Reset token has expired. Please request a new one.',
      expired: true
    });
  }

  res.json({
    success: true,
    message: 'Token is valid',
    email: user.email
  });
});

// Reset password with token
export const resetPassword = asyncHandler(async (req, res) => {
  const { token, newPassword } = req.body;
  const requestContext = {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    origin: req.get('origin'),
    method: req.method,
    path: req.path
  };

  // Log request attempt
  logger.info('Password reset request received', {
    ...requestContext,
    hasToken: !!token,
    passwordLength: newPassword?.length || 0
  });

  if (!token || !newPassword) {
    logger.warn('Password reset validation failed', {
      ...requestContext,
      missingToken: !token,
      missingPassword: !newPassword
    });
    return res.status(400).json({
      success: false,
      message: 'Token and new password are required'
    });
  }

  // Validate password strength
  if (newPassword.length < 8) {
    logger.warn('Password reset validation failed - password too short', {
      ...requestContext,
      passwordLength: newPassword.length
    });
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 8 characters long'
    });
  }

  // Find user by reset token
  const user = await prisma.user.findUnique({
    where: { passwordResetToken: token }
  });

  if (!user) {
    logger.warn('Password reset failed - invalid token', {
      ...requestContext,
      tokenPrefix: token.substring(0, 8) + '...'
    });
    return res.status(400).json({
      success: false,
      message: 'Invalid or expired reset token'
    });
  }

  // Check token expiry
  if (!user.passwordResetExpires || new Date() > new Date(user.passwordResetExpires)) {
    logger.warn('Password reset failed - token expired', {
      ...requestContext,
      userId: user.id,
      email: user.email,
      expiresAt: user.passwordResetExpires
    });
    return res.status(400).json({
      success: false,
      message: 'Reset token has expired. Please request a new one.',
      expired: true
    });
  }

  // Update password using bcrypt
  try {
    logger.info('Processing password reset', {
      ...requestContext,
      userId: user.id,
      email: user.email
    });

    // Hash the new password
    const passwordHash = await hashPassword(newPassword);

    // Update password and clear reset token in database
    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordResetSentAt: null
      }
    });

    logger.info('Password reset successfully completed', {
      ...requestContext,
      userId: user.id,
      email: user.email
    });

    res.json({
      success: true,
      message: 'Password reset successfully! You can now sign in with your new password.'
    });
  } catch (error) {
    logger.error('Failed to reset password - critical error', {
      ...requestContext,
      userId: user?.id,
      email: user?.email,
      error: error.message,
      stack: error.stack,
      errorName: error.name
    });

    res.status(500).json({
      success: false,
      message: 'Failed to reset password. Please try again later.'
    });
  }
});


export default {
  register,
  login,
  refreshTokenEndpoint,
  logout,
  getCurrentUser,
  confirmEmail,
  resendConfirmation,
  sendInitialConfirmation,
  requestPasswordReset,
  verifyResetToken,
  resetPassword
};
