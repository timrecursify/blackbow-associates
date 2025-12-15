import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';
import { logger, logAuthEvent } from '../utils/logger.js';
import googleOAuthService from '../services/google-oauth.service.js';
import { generateAccessToken, generateRefreshToken } from '../services/auth.service.js';

/**
 * Initiate Google OAuth login
 * Redirects user directly to Google consent screen
 */
export const initiateGoogleLogin = asyncHandler(async (req, res) => {
  try {
    // Generate Google authorization URL
    const authUrl = googleOAuthService.generateAuthUrl();

    logger.info('Redirecting to Google OAuth', {
      ip: req.ip,
      userAgent: req.get('user-agent')
    });

    // Redirect user to Google
    res.redirect(authUrl);
  } catch (error) {
    logger.error('Failed to initiate Google OAuth', {
      error: error.message,
      stack: error.stack
    });
    throw new AppError('Failed to initiate Google login', 500, 'OAUTH_INIT_FAILED');
  }
});

/**
 * Handle Google OAuth callback
 * Exchange code for tokens, create/link user, set session
 */
export const handleGoogleCallback = asyncHandler(async (req, res) => {
  const { code, error, error_description } = req.query;

  // Handle OAuth errors from Google
  if (error) {
    logger.error('Google OAuth error', {
      error,
      description: error_description
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://blackbowassociates.com';
    return res.redirect(`${frontendUrl}/sign-in?error=${encodeURIComponent(error_description || error)}`);
  }

  if (!code) {
    throw new AppError('No authorization code provided', 400, 'MISSING_CODE');
  }

  try {
    // Exchange code for tokens and user info
    const { tokens, userInfo } = await googleOAuthService.exchangeCode(code);

    logger.info('Google OAuth callback received', {
      email: userInfo.email,
      verified: userInfo.emailVerified
    });

    // Find user by Google ID or email
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { authUserId: userInfo.googleUserId },
          { email: userInfo.email }
        ]
      }
    });

    if (user) {
      // Update existing user with Google ID if not already linked
      if (!user.authUserId || user.authUserId !== userInfo.googleUserId) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: {
            authUserId: userInfo.googleUserId,
            emailConfirmed: userInfo.emailVerified ? true : user.emailConfirmed
          }
        });

        logger.info('Linked Google account to existing user', {
          userId: user.id,
          email: user.email,
          googleUserId: userInfo.googleUserId
        });
      }
    } else {
      // Create new user
      user = await prisma.user.create({
        data: {
          authUserId: userInfo.googleUserId,
          email: userInfo.email,
          businessName: userInfo.name || userInfo.email.split('@')[0],
          emailConfirmed: userInfo.emailVerified,
          onboardingCompleted: false,
          isAdmin: false,
          vendorType: "pending" // Will be set during onboarding
        }
      });

      logger.info('Created new user from Google OAuth', {
        userId: user.id,
        email: user.email,
        googleUserId: userInfo.googleUserId
      });

      // Log registration event
      logAuthEvent('register', {
        userId: user.id,
        email: user.email,
        method: 'google_oauth',
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id
      });
    }

    // Generate JWT access and refresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Store refresh token in database
    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    // Log successful login
    logAuthEvent('login_success', {
      userId: user.id,
      email: user.email,
      method: 'google_oauth',
      isAdmin: user.isAdmin,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id
    });

    // Set HTTP-only cookies for session
    const cookieOptions = {
      domain: '.blackbowassociates.com', // Allow cookie to be shared across subdomains
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Redirect to appropriate dashboard
    const frontendUrl = process.env.FRONTEND_URL || 'https://blackbowassociates.com';
    let redirectPath;

    if (!user.onboardingCompleted) {
      redirectPath = '/onboarding';
    } else if (user.isAdmin) {
      redirectPath = '/admin';
    } else {
      redirectPath = '/marketplace';
    }

    const redirectUrl = `${frontendUrl}${redirectPath}`;

    logger.info('Google OAuth login successful, redirecting', {
      userId: user.id,
      email: user.email,
      redirectPath
    });

    res.redirect(redirectUrl);
  } catch (error) {
    logger.error('Google OAuth callback failed', {
      error: error.message,
      stack: error.stack
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://blackbowassociates.com';
    res.redirect(`${frontendUrl}/sign-in?error=${encodeURIComponent('Authentication failed. Please try again.')}`);
  }
});

/**
 * Handle OAuth logout
 * Clear session cookies and redirect to homepage
 */
export const handleOAuthLogout = asyncHandler(async (req, res) => {
  try {
    // Clear session cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    // Clear refresh token in database
    if (req.user?.id) {
      await prisma.user.update({
        where: { id: req.user.id },
        data: { refreshToken: null }
      });

      logAuthEvent('logout', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id
      });
    }

    const frontendUrl = process.env.FRONTEND_URL || 'https://blackbowassociates.com';
    res.redirect(frontendUrl);
  } catch (error) {
    logger.error('OAuth logout failed', {
      error: error.message
    });

    const frontendUrl = process.env.FRONTEND_URL || 'https://blackbowassociates.com';
    res.redirect(frontendUrl);
  }
});
