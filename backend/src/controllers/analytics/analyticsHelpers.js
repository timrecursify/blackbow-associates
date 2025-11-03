/**
 * Analytics Helper Functions
 *
 * Shared utilities for all analytics controllers
 */

import prisma from '../../config/database.js';

/**
 * Parse date range from query parameters
 */
export const parseDateRange = (req) => {
  const { startDate, endDate } = req.query;

  const end = endDate ? new Date(endDate) : new Date();
  const start = startDate ? new Date(startDate) : new Date(end.getTime() - 30 * 24 * 60 * 60 * 1000); // Default: 30 days

  return { start, end };
};

/**
 * Get admin user IDs (cached for performance)
 * This ensures admin data is excluded from all analytics calculations
 */
let adminUserIdsCache = null;
let adminUserIdsCacheTime = null;
const ADMIN_IDS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export const getAdminUserIds = async () => {
  const now = Date.now();
  if (adminUserIdsCache && adminUserIdsCacheTime && (now - adminUserIdsCacheTime) < ADMIN_IDS_CACHE_TTL) {
    return adminUserIdsCache;
  }

  const adminUsers = await prisma.user.findMany({
    where: { isAdmin: true },
    select: { id: true }
  });

  adminUserIdsCache = adminUsers.map(u => u.id);
  adminUserIdsCacheTime = now;
  return adminUserIdsCache;
};
