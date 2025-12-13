/**
 * Referral Service
 *
 * Handles referral code generation and validation
 */

import { prisma } from '../config/database.js';

/**
 * Generate a unique 8-character referral code
 * @returns {string} Unique referral code
 */
export function generateReferralCode() {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return code;
}

/**
 * Validate a referral code and return the referrer if valid
 * @param {string} code - Referral code to validate
 * @returns {Promise<Object|null>} Referrer user object or null if invalid
 */
export async function validateReferralCode(code) {
  if (!code) {
    return null;
  }

  const referrer = await prisma.user.findFirst({
    where: {
      referralCode: code,
      referralEnabled: true
    },
    select: {
      id: true,
      email: true,
      businessName: true,
      referralCode: true
    }
  });

  return referrer;
}

/**
 * Calculate commission amount
 * @param {number} amount - Purchase amount
 * @param {number} rate - Commission rate (default 0.10 = 10%)
 * @returns {number} Commission amount
 */
export function calculateCommission(amount, rate = 0.10) {
  return parseFloat((amount * rate).toFixed(2));
}

/**
 * Get referrer statistics
 * @param {string} userId - User ID of the referrer
 * @returns {Promise<Object>} Statistics object with total referred, earned, pending, and paid amounts
 */
export async function getReferrerStats(userId) {
  const [totalReferred, commissions] = await Promise.all([
    // Count total users referred
    prisma.user.count({
      where: { referredByUserId: userId }
    }),
    // Get all commissions
    prisma.referralCommission.groupBy({
      by: ['status'],
      where: { earnerId: userId },
      _sum: {
        amount: true
      }
    })
  ]);

  // Calculate totals by status
  const pending = commissions.find(c => c.status === 'PENDING')?._sum?.amount || 0;
  const paid = commissions.find(c => c.status === 'PAID')?._sum?.amount || 0;
  const totalEarned = parseFloat(pending) + parseFloat(paid);

  return {
    totalReferred,
    totalEarned: parseFloat(totalEarned.toFixed(2)),
    pendingAmount: parseFloat(pending),
    paidAmount: parseFloat(paid)
  };
}

export default {
  generateReferralCode,
  validateReferralCode,
  calculateCommission,
  getReferrerStats
};
