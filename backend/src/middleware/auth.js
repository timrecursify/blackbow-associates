import { ClerkExpressRequireAuth, ClerkExpressWithAuth } from '@clerk/clerk-sdk-node';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AppError } from './errorHandler.js';

// Verify Clerk session and require authentication
export const requireAuth = ClerkExpressRequireAuth({
  onError: (error) => {
    logger.warn('Authentication failed', { error: error.message });
  }
});

// Attach user to request (optional auth)
export const withAuth = ClerkExpressWithAuth();

// Sync Clerk user to database and attach to request
export const attachUser = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const clerkUserId = req.auth.userId;

    // Find user in database
    let user = await prisma.user.findUnique({
      where: { clerkUserId },
      select: {
        id: true,
        clerkUserId: true,
        email: true,
        businessName: true,
        vendorType: true,
        balance: true,
        isAdmin: true,
        adminVerifiedAt: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      logger.warn('User not found in database', { clerkUserId });
      throw new AppError(
        'User not synced. Please complete registration.',
        404,
        'USER_NOT_SYNCED'
      );
    }

    req.user = user;
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

export default { requireAuth, withAuth, attachUser, requireAdmin };
