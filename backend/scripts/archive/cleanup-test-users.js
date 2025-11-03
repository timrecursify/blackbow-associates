/**
 * Cleanup Test Users Script
 * 
 * This script removes all non-admin users and their related data from the database.
 * It preserves only users where isAdmin = true.
 * 
 * Related data that will be cascade deleted:
 * - Purchases
 * - Transactions
 * - Payment Methods
 * - User Lead Favorites
 * - Lead Feedback
 * 
 * WARNING: This is a destructive operation. Run with caution.
 */

import prisma from '../src/config/database.js';
import logger from '../src/utils/logger.js';

async function cleanupTestUsers() {
  try {
    logger.info('Starting cleanup of test users...');

    // Step 1: Identify admin users
    const adminUsers = await prisma.user.findMany({
      where: { isAdmin: true },
      select: {
        id: true,
        email: true,
        businessName: true,
        isAdmin: true
      }
    });

    logger.info(`Found ${adminUsers.length} admin user(s) to preserve:`, {
      admins: adminUsers.map(u => ({ id: u.id, email: u.email }))
    });

    if (adminUsers.length === 0) {
      throw new Error('No admin users found. Aborting cleanup to prevent deleting all users.');
    }

    // Step 2: Count users to be deleted
    const usersToDelete = await prisma.user.count({
      where: { isAdmin: false }
    });

    logger.info(`Found ${usersToDelete} non-admin user(s) to delete`);

    if (usersToDelete === 0) {
      logger.info('No non-admin users found. Nothing to clean up.');
      return;
    }

    // Step 3: Count related data to be deleted
    const adminUserIds = adminUsers.map(u => u.id);
    
    const purchasesCount = await prisma.purchase.count({
      where: {
        userId: { notIn: adminUserIds }
      }
    });

    const transactionsCount = await prisma.transaction.count({
      where: {
        userId: { notIn: adminUserIds }
      }
    });

    const feedbackCount = await prisma.leadFeedback.count({
      where: {
        userId: { notIn: adminUserIds }
      }
    });

    const favoritesCount = await prisma.userLeadFavorite.count({
      where: {
        userId: { notIn: adminUserIds }
      }
    });

    const paymentMethodsCount = await prisma.paymentMethod.count({
      where: {
        userId: { notIn: adminUserIds }
      }
    });

    // Step 4: Delete related data for non-admin users first
    logger.info('Deleting related data for non-admin users...');

    // Delete transactions
    const deletedTransactions = await prisma.transaction.deleteMany({
      where: {
        userId: { notIn: adminUserIds }
      }
    });
    logger.info(`Deleted ${deletedTransactions.count} transaction(s)`);

    // Delete purchases
    const deletedPurchases = await prisma.purchase.deleteMany({
      where: {
        userId: { notIn: adminUserIds }
      }
    });
    logger.info(`Deleted ${deletedPurchases.count} purchase(s)`);

    // Delete lead feedback
    const deletedFeedback = await prisma.leadFeedback.deleteMany({
      where: {
        userId: { notIn: adminUserIds }
      }
    });
    logger.info(`Deleted ${deletedFeedback.count} feedback record(s)`);

    // Delete favorites
    const deletedFavorites = await prisma.userLeadFavorite.deleteMany({
      where: {
        userId: { notIn: adminUserIds }
      }
    });
    logger.info(`Deleted ${deletedFavorites.count} favorite(s)`);

    // Delete payment methods
    const deletedPaymentMethods = await prisma.paymentMethod.deleteMany({
      where: {
        userId: { notIn: adminUserIds }
      }
    });
    logger.info(`Deleted ${deletedPaymentMethods.count} payment method(s)`);

    // Step 5: Delete non-admin users (now safe to delete)
    const deleteResult = await prisma.user.deleteMany({
      where: { isAdmin: false }
    });

    logger.info(`Successfully deleted ${deleteResult.count} non-admin user(s)`);

    // Step 5: Verify cleanup
    const remainingUsers = await prisma.user.count();
    const remainingAdmins = await prisma.user.count({
      where: { isAdmin: true }
    });

    logger.info('Cleanup verification:', {
      totalUsers: remainingUsers,
      adminUsers: remainingAdmins,
      nonAdminUsers: remainingUsers - remainingAdmins
    });

    if (remainingUsers !== remainingAdmins) {
      throw new Error(`Cleanup incomplete: ${remainingUsers - remainingAdmins} non-admin users still exist`);
    }

    logger.info('✅ Cleanup completed successfully');

    return {
      deletedUsers: deleteResult.count,
      deletedPurchases: deletedPurchases.count,
      deletedTransactions: deletedTransactions.count,
      deletedFeedback: deletedFeedback.count,
      deletedFavorites: deletedFavorites.count,
      deletedPaymentMethods: deletedPaymentMethods.count,
      remainingAdmins: remainingAdmins
    };

  } catch (error) {
    logger.error('Failed to cleanup test users', {
      error: error.message,
      stack: error.stack
    });
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the cleanup
cleanupTestUsers()
  .then(result => {
    console.log('\n✅ Cleanup Summary:');
    console.log(`- Deleted ${result.deletedUsers} non-admin user(s)`);
    console.log(`- Deleted ${result.deletedPurchases} purchase(s)`);
    console.log(`- Deleted ${result.deletedTransactions} transaction(s)`);
    console.log(`- Deleted ${result.deletedFeedback} feedback record(s)`);
    console.log(`- Deleted ${result.deletedFavorites} favorite(s)`);
    console.log(`- Deleted ${result.deletedPaymentMethods} payment method(s)`);
    console.log(`- Preserved ${result.remainingAdmins} admin user(s)`);
    process.exit(0);
  })
  .catch(error => {
    console.error('\n❌ Cleanup failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  });
