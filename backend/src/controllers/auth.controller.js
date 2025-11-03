import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/errorHandler.js';

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

export default { getCurrentUser };
