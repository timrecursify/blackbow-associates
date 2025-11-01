import { prisma } from '../config/database.js';
import { logger } from '../utils/logger.js';
import { AppError, asyncHandler } from '../middleware/errorHandler.js';

// Get current user profile
export const getProfile = asyncHandler(async (req, res) => {
  try {
    const user = req.user;
    
    if (!user || !user.id) {
      logger.error('getProfile: Missing user in request', { user });
      throw new AppError('User not authenticated', 401, 'UNAUTHORIZED');
    }

    logger.info('getProfile: Fetching profile', { userId: user.id });

    const profile = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        businessName: true,
        vendorType: true,
        location: true,
        about: true,
        balance: true,
        onboardingCompleted: true,
        isAdmin: true,
        createdAt: true,
        updatedAt: true,
        billingFirstName: true,
        billingLastName: true,
        billingCompanyName: true,
        billingIsCompany: true,
        billingAddressLine1: true,
        billingAddressLine2: true,
        billingCity: true,
        billingState: true,
        billingZip: true,
        billingCountry: true
      }
    });

    if (!profile) {
      logger.error('getProfile: Profile not found', { userId: user.id });
      throw new AppError('User profile not found', 404, 'NOT_FOUND');
    }

    logger.info('getProfile: Profile found', { 
      userId: profile.id, 
      onboardingCompleted: profile.onboardingCompleted,
      balance: profile.balance 
    });

    const balance = profile.balance ? parseFloat(profile.balance.toString()) : 0;
    const onboardingCompleted = profile.onboardingCompleted === true;

    res.json({
      success: true,
      user: {
        id: profile.id,
        email: profile.email,
        businessName: profile.businessName,
        vendorType: profile.vendorType,
        location: profile.location,
        about: profile.about,
        balance: balance,
        onboardingCompleted: onboardingCompleted,
        isAdmin: profile.isAdmin,
        createdAt: profile.createdAt,
        updatedAt: profile.updatedAt,
        billing: {
          firstName: profile.billingFirstName,
          lastName: profile.billingLastName,
          companyName: profile.billingCompanyName,
          isCompany: profile.billingIsCompany,
          addressLine1: profile.billingAddressLine1,
          addressLine2: profile.billingAddressLine2,
          city: profile.billingCity,
          state: profile.billingState,
          zip: profile.billingZip,
          country: profile.billingCountry
        }
      }
    });
  } catch (error) {
    logger.error('getProfile: Error occurred', {
      error: error.message,
      stack: error.stack,
      userId: req.user?.id
    });
    throw error;
  }
});

// Update user profile
export const updateProfile = asyncHandler(async (req, res) => {
  const user = req.user;
  const { businessName, vendorType, location, about, onboardingCompleted } = req.body;

  logger.info('Profile update request', { 
    userId: user.id, 
    body: req.body,
    onboardingCompleted 
  });

  const updateData = {};
  if (businessName !== undefined) updateData.businessName = businessName;
  if (vendorType !== undefined) updateData.vendorType = vendorType;
  if (location !== undefined) updateData.location = location;
  if (about !== undefined) updateData.about = about;
  if (onboardingCompleted !== undefined) updateData.onboardingCompleted = onboardingCompleted;

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: updateData
  });

  logger.info('User profile updated', { userId: user.id });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    user: {
      id: updatedUser.id,
      email: updatedUser.email,
      businessName: updatedUser.businessName,
      vendorType: updatedUser.vendorType,
      location: updatedUser.location,
      about: updatedUser.about,
      balance: parseFloat(updatedUser.balance),
      onboardingCompleted: updatedUser.onboardingCompleted
    }
  });
});

// Get user transactions
export const getTransactions = asyncHandler(async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    }),
    prisma.transaction.count({ where: { userId: user.id } })
  ]);

  res.json({
    success: true,
    transactions: transactions.map(t => ({
      ...t,
      amount: parseFloat(t.amount),
      balanceAfter: parseFloat(t.balanceAfter)
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Get purchased leads
export const getPurchasedLeads = asyncHandler(async (req, res) => {
  const user = req.user;
  const { page = 1, limit = 50 } = req.query;
  const skip = (page - 1) * limit;

  const [purchases, total] = await Promise.all([
    prisma.purchase.findMany({
      where: { userId: user.id },
      include: {
        lead: true
      },
      orderBy: { purchasedAt: 'desc' },
      skip: parseInt(skip),
      take: parseInt(limit)
    }),
    prisma.purchase.count({ where: { userId: user.id } })
  ]);

  res.json({
    success: true,
    leads: purchases.map(purchase => ({
      id: purchase.id,
      leadId: purchase.leadId,
      purchasedAt: purchase.purchasedAt,
      amountPaid: parseFloat(purchase.amountPaid),
      notes: purchase.notes, // User's notes from Purchase model
      // Full lead details after purchase
      weddingDate: purchase.lead.weddingDate,
      location: purchase.lead.location,
      city: purchase.lead.city,
      state: purchase.lead.state,
      description: purchase.lead.description,
      servicesNeeded: purchase.lead.servicesNeeded,
      ethnicReligious: purchase.lead.ethnicReligious,
      // Contact info (revealed after purchase)
      firstName: purchase.lead.firstName,
      lastName: purchase.lead.lastName,
      personName: purchase.lead.personName,
      email: purchase.lead.email,
      phone: purchase.lead.phone
    })),
    pagination: {
      page: parseInt(page),
      limit: parseInt(limit),
      total,
      totalPages: Math.ceil(total / limit)
    }
  });
});

// Update note on purchased lead
export const updateLeadNote = asyncHandler(async (req, res) => {
  const user = req.user;
  const { leadId } = req.params;
  const { note } = req.body;

  // Verify user owns this lead
  const purchase = await prisma.purchase.findUnique({
    where: {
      userId_leadId: {
        userId: user.id,
        leadId
      }
    }
  });

  if (!purchase) {
    throw new AppError('You have not purchased this lead', 403, 'FORBIDDEN');
  }

  // Update the notes field on the purchase
  const updatedPurchase = await prisma.purchase.update({
    where: {
      userId_leadId: {
        userId: user.id,
        leadId
      }
    },
    data: { notes: note }
  });

  logger.info('Purchase note updated', { userId: user.id, leadId, purchaseId: purchase.id });

  res.json({
    success: true,
    message: 'Note updated successfully',
    notes: updatedPurchase.notes
  });
});

// Update billing address
export const updateBillingAddress = asyncHandler(async (req, res) => {
  const user = req.user;
  const {
    firstName,
    lastName,
    companyName,
    isCompany,
    addressLine1,
    addressLine2,
    city,
    state,
    zip
  } = req.body;

  logger.info('Billing address update request', { userId: user.id });

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      billingFirstName: firstName || null,
      billingLastName: lastName || null,
      billingCompanyName: companyName || null,
      billingIsCompany: isCompany === true,
      billingAddressLine1: addressLine1,
      billingAddressLine2: addressLine2 || null,
      billingCity: city,
      billingState: state,
      billingZip: zip
    },
    select: {
      id: true,
      billingFirstName: true,
      billingLastName: true,
      billingCompanyName: true,
      billingIsCompany: true,
      billingAddressLine1: true,
      billingAddressLine2: true,
      billingCity: true,
      billingState: true,
      billingZip: true,
      billingCountry: true
    }
  });

  logger.info('Billing address updated', { userId: user.id });

  res.json({
    success: true,
    message: 'Billing address updated successfully',
    billing: {
      firstName: updatedUser.billingFirstName,
      lastName: updatedUser.billingLastName,
      companyName: updatedUser.billingCompanyName,
      isCompany: updatedUser.billingIsCompany,
      addressLine1: updatedUser.billingAddressLine1,
      addressLine2: updatedUser.billingAddressLine2,
      city: updatedUser.billingCity,
      state: updatedUser.billingState,
      zip: updatedUser.billingZip,
      country: updatedUser.billingCountry
    }
  });
});

export default {
  getProfile,
  updateProfile,
  getTransactions,
  getPurchasedLeads,
  updateLeadNote,
  updateBillingAddress
};
