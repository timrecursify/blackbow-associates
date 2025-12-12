import jwt from 'jsonwebtoken';
import { prisma } from '../config/database.js';
import { logger, logAuthEvent } from '../utils/logger.js';
import { AppError } from './errorHandler.js';
import { verifyToken } from '../services/auth.service.js';

// Verify custom JWT and require authentication
export const requireAuth = async (req, res, next) => {
  try {
    // Check for token in Authorization header OR cookies (for OAuth browser flow)
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7); // Remove 'Bearer ' prefix
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken; // Get token from cookie (OAuth flow)
    }

    if (!token) {
      throw new AppError('No authentication token provided', 401, 'UNAUTHORIZED');
    }

    // Verify JWT token with custom JWT secret
    try {
      const decoded = verifyToken(token);

      // Attach decoded token data to request
      req.auth = {
        userId: decoded.sub, // User ID from our database
        email: decoded.email,
        isAdmin: decoded.isAdmin || false,
        tokenType: decoded.type
      };

      // Log successful token verification (DeSaaS Compliance)
      logAuthEvent('token_refresh', {
        userId: decoded.sub,
        email: decoded.email,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id
      });

      next();
    } catch (jwtError) {
      logger.warn('JWT verification failed', {
        error: jwtError.message,
        type: jwtError.name
      });

      // Log failed authentication attempt (DeSaaS Compliance)
      logAuthEvent('login_failed', {
        reason: jwtError.message,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        requestId: req.id
      });

      throw new AppError('Invalid or expired authentication token', 401, 'INVALID_TOKEN');
    }
  } catch (error) {
    next(error);
  }
};

// Find user in database and attach to request
export const attachUser = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const userId = req.auth.userId;

    // Find user in database by user ID
    let user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        authUserId: true,
        email: true,
        businessName: true,
        vendorType: true,
        balance: true,
        location: true,
        about: true,
        onboardingCompleted: true,
        isAdmin: true,
        adminVerifiedAt: true,
        isBlocked: true,
        blockedAt: true,
        blockedReason: true,
        emailConfirmed: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      logger.warn('User not found in database', { userId });
      throw new AppError('User not found', 404, 'USER_NOT_FOUND');
    }

    // SECURITY: Enforce user blocking - prevent blocked users from accessing any routes
    if (user.isBlocked) {
      logger.warn('Blocked user attempted access', {
        userId: user.id,
        email: user.email,
        blockedAt: user.blockedAt,
        blockedReason: user.blockedReason
      });
      throw new AppError(
        `Account blocked${user.blockedReason ? `: ${user.blockedReason}` : '. Please contact support.'}`,
        403,
        'ACCOUNT_BLOCKED',
        { blockedAt: user.blockedAt }
      );
    }

    // SECURITY: Enforce email confirmation - prevent unconfirmed users from accessing protected routes
    // Allow access to confirmation endpoints, auth endpoints, and admin routes
    const allowedPaths = [
      "/api/auth/confirm-email",
      "/api/auth/resend-confirmation",
      "/api/auth/me",
      "/api/users/profile",
      "/api/admin"
    ];
    const isAllowedPath = allowedPaths.some(path => req.path.includes(path));

    if (!user.emailConfirmed && !isAllowedPath) {
      logger.warn("Unconfirmed user attempted access", {
        userId: user.id,
        email: user.email,
        path: req.path
      });
      throw new AppError(
        "Please confirm your email address to continue. Check your inbox for the confirmation link.",
        403,
        "EMAIL_NOT_CONFIRMED",
        { email: user.email }
      );
    }

    req.user = user;
    
    // Log successful user authentication (DeSaaS Compliance)
    logAuthEvent('login_success', {
      userId: user.id,
      authUserId: user.authUserId,
      email: user.email,
      isAdmin: user.isAdmin,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      requestId: req.id
    });
    
    next();
  } catch (error) {
    next(error);
  }
};

// Admin-only middleware (requires admin verification code)
export const requireAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    if (!req.user.isAdmin || !req.user.adminVerifiedAt) {
      logger.warn('Admin access denied', {
        userId: req.user.id,
        isAdmin: req.user.isAdmin,
        email: req.user.email
      });
      throw new AppError(
        'Admin access required',
        403,
        'FORBIDDEN'
      );
    }

    next();
  } catch (error) {
    next(error);
  }
};

export default { requireAuth, attachUser, requireAdmin };
