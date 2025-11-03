/**
 * Audit Logger Middleware
 *
 * Tracks admin actions for compliance and security auditing.
 *
 * Logs:
 * - All admin dashboard views
 * - Balance adjustments
 * - Data exports
 * - Lead/user management actions
 * - Settings changes
 */

import prisma from '../config/database.js';
import logger from '../utils/logger.js';

/**
 * Extract action name from route path and method
 */
const getActionName = (method, path) => {
  const cleanPath = path.replace('/api/admin/', '').replace(/\//g, '_').toUpperCase();
  return `${method}_${cleanPath}`;
};

/**
 * Extract resource type and ID from request
 */
const getResourceInfo = (req) => {
  const { leadId, userId, resourceType, resourceId } = req.params;

  if (leadId) return { resourceType: 'LEAD', resourceId: leadId };
  if (userId) return { resourceType: 'USER', resourceId: userId };
  if (resourceType && resourceId) return { resourceType, resourceId };

  // Check query params for export type
  if (req.query.type) {
    return { resourceType: req.query.type.toUpperCase(), resourceId: null };
  }

  return { resourceType: null, resourceId: null };
};

/**
 * Audit logging middleware
 *
 * Usage:
 *   router.get('/some-route', requireAuth, requireAdmin, auditLog, controller);
 */
export const auditLog = async (req, res, next) => {
  // Only log for admin users
  if (!req.user || !req.user.isAdmin) {
    return next();
  }

  const action = getActionName(req.method, req.originalUrl);
  const { resourceType, resourceId } = getResourceInfo(req);

  // Get client info
  const ipAddress = req.ip || req.connection.remoteAddress;
  const userAgent = req.get('user-agent');

  // Build metadata
  const metadata = {
    method: req.method,
    path: req.originalUrl,
    query: req.query,
    timestamp: new Date().toISOString()
  };

  // Add body for POST/PUT/PATCH (exclude sensitive data)
  if (['POST', 'PUT', 'PATCH'].includes(req.method) && req.body) {
    const sanitizedBody = { ...req.body };
    // Remove sensitive fields
    delete sanitizedBody.password;
    delete sanitizedBody.token;
    delete sanitizedBody.apiKey;
    metadata.body = sanitizedBody;
  }

  try {
    // Create audit log entry
    await prisma.adminAuditLog.create({
      data: {
        adminUserId: req.user.id,
        action,
        resourceType,
        resourceId,
        metadata,
        ipAddress,
        userAgent
      }
    });

    logger.info('Admin action logged', {
      adminId: req.user.id,
      adminEmail: req.user.email,
      action,
      resourceType,
      resourceId,
      ipAddress
    });
  } catch (error) {
    // Don't fail the request if audit logging fails
    logger.error('Failed to create audit log', {
      error: error.message,
      adminId: req.user.id,
      action
    });
  }

  next();
};

/**
 * Get audit logs for admin user
 * (Can be used in settings/activity page)
 */
export const getAuditLogs = async (req, res, next) => {
  try {
    const { page = 1, limit = 50, action, resourceType } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};

    // Filter by specific admin (if not viewing all)
    if (req.query.adminUserId) {
      where.adminUserId = req.query.adminUserId;
    }

    // Filter by action type
    if (action) {
      where.action = { contains: action, mode: 'insensitive' };
    }

    // Filter by resource type
    if (resourceType) {
      where.resourceType = resourceType.toUpperCase();
    }

    const [logs, total] = await Promise.all([
      prisma.adminAuditLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          adminUserId: true,
          action: true,
          resourceType: true,
          resourceId: true,
          metadata: true,
          ipAddress: true,
          createdAt: true
        }
      }),
      prisma.adminAuditLog.count({ where })
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Failed to fetch audit logs', { error: error.message });
    next(error);
  }
};

export default auditLog;
