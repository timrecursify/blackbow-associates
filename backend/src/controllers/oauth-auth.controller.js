import { AppError, asyncHandler } from '../middleware/errorHandler.js';
import { prisma } from '../config/database.js';
import { logger, logAuthEvent, notifyTelegram } from '../utils/logger.js';
import googleOAuthService from '../services/google-oauth.service.js';
import { generateAccessToken, generateRefreshToken } from '../services/auth.service.js';
import { generateReferralCode, validateReferralCode } from '../services/referral.service.js';

/**
 * Initiate Google OAuth login
 * Preserves referral code through OAuth state parameter
 */
export const initiateGoogleLogin = asyncHandler(async (req, res) => {
  try {
    // Capture referral code from query parameter
    const referralCode = req.query.ref || null;

    // Generate Google authorization URL with referral code in state
    const authUrl = googleOAuthService.generateAuthUrl(referralCode);

    logger.info('Redirecting to Google OAuth', {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      referralCode: referralCode || null
    });

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
 * Processes referral code from state parameter
 */
export const handleGoogleCallback = asyncHandler(async (req, res) => {
  const { code, state, error, error_description } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || 'https://blackbowassociates.com';

  if (error) {
    logger.error('Google OAuth error', {
      error,
      description: error_description
    });
    return res.redirect(frontendUrl + '/sign-in?error=' + encodeURIComponent(error_description || error));
  }

  if (!code) {
    throw new AppError('No authorization code provided', 400, 'MISSING_CODE');
  }

  // Parse referral code from state parameter
  const stateData = googleOAuthService.parseState(state);
  const referralCode = stateData.ref || null;

  if (referralCode) {
    logger.info('Referral code received in OAuth callback', { referralCode });
  }

  try {
    const { tokens, userInfo } = await googleOAuthService.exchangeCode(code);

    logger.info('Google OAuth callback received', {
      email: userInfo.email,
      verified: userInfo.emailVerified,
      hasReferralCode: !!referralCode
    });

    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { authUserId: userInfo.googleUserId },
          { email: userInfo.email }
        ]
      }
    });

    let isNewUser = false;

    if (user) {
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
      // Validate referral code and get referrer
      let referredByUserId = null;
      if (referralCode) {
        const referrer = await validateReferralCode(referralCode);
        if (referrer) {
          referredByUserId = referrer.id;
          logger.info('Valid referral code - linking new user to referrer', {
            referralCode,
            referrerId: referrer.id,
            referrerEmail: referrer.email
          });
        } else {
          logger.warn('Invalid or disabled referral code provided', { referralCode });
        }
      }

      // Create new user with referral linkage
      user = await prisma.user.create({
        data: {
          authUserId: userInfo.googleUserId,
          email: userInfo.email,
          businessName: userInfo.name || userInfo.email.split('@')[0],
          emailConfirmed: userInfo.emailVerified,
          onboardingCompleted: false,
          isAdmin: false,
          vendorType: 'pending',
          referralCode: generateReferralCode(),
          referredByUserId: referredByUserId
        }
      });

      isNewUser = true;

      logger.info('Created new user from Google OAuth', {
        userId: user.id,
        email: user.email,
        googleUserId: userInfo.googleUserId,
        referredBy: referredByUserId || 'none',
        referralCodeUsed: referralCode || 'none'
      });

      logAuthEvent('register', {
        userId: user.id,
        email: user.email,
        method: 'google_oauth',
        referralCode: referralCode || null,
        referredBy: referredByUserId || null,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id
      });

      // Send Telegram notification for new registration
      let registrationMsg = '👤 *New User Registration (Google OAuth)*\n\n';
      registrationMsg += `Email: ${user.email}\n`;
      registrationMsg += `Business: ${user.businessName}`;

      if (referredByUserId) {
        const referrer = await prisma.user.findUnique({
          where: { id: referredByUserId },
          select: { email: true, businessName: true }
        });
        if (referrer) {
          registrationMsg += `\n\n🎁 *Referred by:* ${referrer.businessName || referrer.email}`;
        }
      }

      await notifyTelegram(registrationMsg, 'success');
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await prisma.user.update({
      where: { id: user.id },
      data: { refreshToken }
    });

    logAuthEvent('login_success', {
      userId: user.id,
      email: user.email,
      method: 'google_oauth',
      isAdmin: user.isAdmin,
      isNewUser,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id
    });

    const cookieOptions = {
      domain: '.blackbowassociates.com',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/'
    };

    res.cookie('accessToken', accessToken, {
      ...cookieOptions,
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    let redirectPath;
    if (!user.onboardingCompleted) {
      redirectPath = '/onboarding';
    } else if (user.isAdmin) {
      redirectPath = '/admin';
    } else {
      redirectPath = '/marketplace';
    }

    logger.info('Google OAuth login successful, redirecting', {
      userId: user.id,
      email: user.email,
      redirectPath,
      isNewUser,
      wasReferred: !!referralCode
    });

    res.redirect(frontendUrl + redirectPath);
  } catch (error) {
    logger.error('Google OAuth callback failed', {
      error: error.message,
      stack: error.stack
    });

    res.redirect(frontendUrl + '/sign-in?error=' + encodeURIComponent('Authentication failed. Please try again.'));
  }
});

/**
 * Handle OAuth logout
 */
export const handleOAuthLogout = asyncHandler(async (req, res) => {
  try {
    res.clearCookie('accessToken', { path: '/', domain: '.blackbowassociates.com' });
    res.clearCookie('refreshToken', { path: '/', domain: '.blackbowassociates.com' });

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
