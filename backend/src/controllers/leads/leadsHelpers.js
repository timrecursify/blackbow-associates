/**
 * Leads Helper Functions
 *
 * Shared utilities for all leads controllers
 */

// Configuration
export const VENDOR_TYPE_PURCHASE_LIMIT = parseInt(process.env.VENDOR_TYPE_PURCHASE_LIMIT || '5', 10);

/**
 * Count purchases of a lead by a specific vendor type
 * @param {PrismaClient} prismaInstance - Prisma client instance (can be transaction client)
 * @param {string} leadId - Lead ID
 * @param {string} vendorType - Vendor type to count
 * @returns {Promise<number>} Purchase count
 */
export async function getPurchaseCountByVendorType(prismaInstance, leadId, vendorType) {
  const count = await prismaInstance.purchase.count({
    where: {
      leadId,
      user: {
        vendorType
      }
    }
  });
  return count;
}

/**
 * Calculate dynamic tags for a lead
 * @param {Object} lead - Lead object
 * @param {Date} purchasedAt - Optional purchase date
 * @returns {Array<string>} Array of tags
 */
export function calculateDynamicTags(lead, purchasedAt = null) {
  const dynamicTags = [...lead.tags]; // Start with existing tags
  const now = new Date();
  const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const tenDaysAgo = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000);

  // NEW tag: leads created within last 3 days OR recently purchased by this user (within 7 days)
  const isNewlyCreated = new Date(lead.createdAt) >= threeDaysAgo;
  const isNewlyPurchased = purchasedAt && new Date(purchasedAt) >= sevenDaysAgo;

  // Remove NEW if it exists but shouldn't (cleanup old tags)
  const existingNewIndex = dynamicTags.indexOf('NEW');
  if (existingNewIndex !== -1 && !isNewlyCreated && !isNewlyPurchased) {
    dynamicTags.splice(existingNewIndex, 1);
  }

  // Add NEW if it should be there but isn't
  if ((isNewlyCreated || isNewlyPurchased) && !dynamicTags.includes('NEW')) {
    dynamicTags.push('NEW');
  }

  // HOT tag: leads with recent client responses (last 10 days)
  if (lead.lastClientResponse && new Date(lead.lastClientResponse) >= tenDaysAgo && !dynamicTags.includes('HOT')) {
    dynamicTags.push('HOT');
  }

  return dynamicTags;
}

// Delayed Lead Access Configuration
export const DELAYED_ACCESS_VENDOR_TYPES = ['Photographer', 'Videographer'];
export const DELAYED_ACCESS_DAYS = 14;

export function hasDelayedAccess(vendorType) {
  return DELAYED_ACCESS_VENDOR_TYPES.includes(vendorType);
}

export function getDelayedAccessCutoffDate() {
  const now = new Date();
  return new Date(now.getTime() - DELAYED_ACCESS_DAYS * 24 * 60 * 60 * 1000);
}
