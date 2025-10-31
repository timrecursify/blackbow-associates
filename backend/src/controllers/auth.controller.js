import { prisma } from '../config/database.js';
import { logger, notifyTelegram } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Verify admin code and grant admin access
export const verifyAdmin = asyncHandler(async (req, res) => {
  const { verificationCode } = req.body;
  const user = req.user;

  // Check verification code
  if (verificationCode !== process.env.ADMIN_VERIFICATION_CODE) {
    logger.warn('Invalid admin verification code', {
      userId: user.id,
      email: user.email
    });
    throw new AppError('Invalid verification code', 403, 'INVALID_CODE');
  }

  // Grant admin access
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      isAdmin: true,
      adminVerifiedAt: new Date()
    }
  });

  // Log admin verification
  await prisma.adminVerification.create({
    data: {
      userId: user.id,
      ipAddress: req.ip,
      userAgent: req.get('user-agent')
    }
  });

  logger.info('Admin access granted', {
    userId: user.id,
    email: user.email
  });

  await notifyTelegram(`🔑 Admin access granted to ${user.email}`, 'info');

  res.json({
    success: true,
    message: 'Admin access granted',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      isAdmin: updatedUser.isAdmin,
      adminVerifiedAt: updatedUser.adminVerifiedAt
    }
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
      createdAt: user.createdAt
    }
  });
});

export default { verifyAdmin, getCurrentUser };
