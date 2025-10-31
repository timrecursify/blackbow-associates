import jwt from 'jsonwebtoken';
import { createClient } from '@supabase/supabase-js';
import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AppError } from './errorHandler.js';

// Initialize Supabase client for user operations (through Kong gateway)
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'apikey': process.env.SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    }
  }
);

// Initialize admin client for Admin API calls (through Kong gateway)
// Uses service role key for admin operations
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    global: {
      headers: {
        'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY
      }
    }
  }
);

// Verify Supabase JWT and require authentication
export const requireAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('No authentication token provided', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    // Verify JWT token with Supabase JWT secret
    try {
      const decoded = jwt.verify(token, process.env.SUPABASE_JWT_SECRET);

      // Attach decoded token data to request
      req.auth = {
        userId: decoded.sub, // Supabase user ID (UUID)
        email: decoded.email,
        role: decoded.role
      };

      next();
    } catch (jwtError) {
      logger.warn('JWT verification failed', {
        error: jwtError.message,
        type: jwtError.name
      });
      throw new AppError('Invalid or expired authentication token', 401, 'INVALID_TOKEN');
    }
  } catch (error) {
    next(error);
  }
};

// Sync Supabase user to database and attach to request
export const attachUser = async (req, res, next) => {
  try {
    if (!req.auth?.userId) {
      throw new AppError('Unauthorized', 401, 'UNAUTHORIZED');
    }

    const authUserId = req.auth.userId;

    // Find user in database by Supabase auth ID
    let user = await prisma.user.findUnique({
      where: { authUserId },
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
        createdAt: true,
        updatedAt: true
      }
    });

    if (!user) {
      logger.info('User not found by authUserId, checking by email or creating', { authUserId });

      try {
        // Fetch user data from Supabase Auth API using admin client (direct connection)
        const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(authUserId);

        if (authError || !authUser) {
          logger.error('Failed to fetch user from Supabase Auth', {
            authUserId,
            error: authError?.message || 'User not found'
          });
          throw new AppError('User not found in authentication system', 404, 'USER_NOT_FOUND');
        }

        // Extract user data
        const email = authUser.user.email;

        if (!email) {
          throw new AppError('Email not found in auth user data', 400, 'INVALID_DATA');
        }

        // Check if user exists by email (might have been created with different authUserId)
        let existingUser = await prisma.user.findUnique({
          where: { email },
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
            createdAt: true,
            updatedAt: true
          }
        });

        if (existingUser) {
          // User exists with same email but different authUserId - update it
          if (existingUser.authUserId !== authUserId) {
            logger.info('User found by email with different authUserId, updating', {
              userId: existingUser.id,
              oldAuthUserId: existingUser.authUserId,
              newAuthUserId: authUserId,
              email
            });
            
            user = await prisma.user.update({
              where: { id: existingUser.id },
              data: { authUserId },
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
                createdAt: true,
                updatedAt: true
              }
            });
          } else {
            // Same authUserId, use existing user
            user = existingUser;
          }
        } else {
          // User doesn't exist, create new one
          // Extract metadata from user_metadata or app_metadata
          const userMetadata = authUser.user.user_metadata || {};
          const appMetadata = authUser.user.app_metadata || {};

          let businessName = userMetadata.businessName || appMetadata.businessName || null;

          // Fallback: Use first name + last name if no business name provided
          if (!businessName) {
            const firstName = userMetadata.first_name || userMetadata.firstName || '';
            const lastName = userMetadata.last_name || userMetadata.lastName || '';
            const fullName = `${firstName} ${lastName}`.trim();
            businessName = fullName.length > 0 ? fullName : 'Not Provided';
          }

          const vendorType = userMetadata.vendorType || appMetadata.vendorType || 'Other';

          // Validate required fields before database insert
          if (!businessName || businessName.trim().length === 0) {
            businessName = 'Not Provided';
          }
          if (!vendorType || vendorType.trim().length === 0) {
            vendorType = 'Other';
          }

          // Use upsert to handle race conditions safely
          user = await prisma.user.upsert({
            where: { email },
            update: {
              authUserId // Update authUserId if email exists but authUserId was different
            },
            create: {
              authUserId,
              email,
              businessName,
              vendorType,
              balance: 0,
              onboardingCompleted: false
            },
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
              createdAt: true,
              updatedAt: true
            }
          });

          logger.info('User created/updated successfully', {
            userId: user.id,
            authUserId,
            email,
            source: 'Supabase Auth auto-sync'
          });
        }

      } catch (supabaseError) {
        // Handle unique constraint errors gracefully
        if (supabaseError.code === 'P2002') {
          logger.warn('User already exists (race condition), fetching by email', {
            authUserId,
            error: supabaseError.message
          });
          
          // Try to fetch user by email one more time
          const email = req.auth?.email;
          if (email) {
            user = await prisma.user.findUnique({
              where: { email },
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
                createdAt: true,
                updatedAt: true
              }
            });
            
            if (user && user.authUserId !== authUserId) {
              // Update authUserId if different
              user = await prisma.user.update({
                where: { id: user.id },
                data: { authUserId },
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
                  createdAt: true,
                  updatedAt: true
                }
              });
            }
            
            if (user) {
              logger.info('User found after race condition', { userId: user.id, authUserId });
              // Continue with the request
            } else {
              throw supabaseError; // Re-throw if still can't find user
            }
          } else {
            throw supabaseError; // Re-throw if no email available
          }
        } else {
          logger.error('Failed to auto-create user from Supabase Auth', {
            authUserId,
            error: supabaseError.message,
            errorCode: supabaseError.code || 'UNKNOWN',
            errorName: supabaseError.name || 'Error',
            stack: supabaseError.stack
          });
          throw new AppError(
            `Failed to sync user from authentication provider: ${supabaseError.message}`,
            500,
            'USER_SYNC_FAILED',
            { authUserId, originalError: supabaseError.message }
          );
        }
      }
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

// Export Supabase clients for use in other controllers if needed
export { supabase, supabaseAdmin };

export default { requireAuth, attachUser, requireAdmin, supabase, supabaseAdmin };
