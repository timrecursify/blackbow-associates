import { PrismaClient } from '@prisma/client';

// Connect to local PostgreSQL (source)
const sourceDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://blackbow_user:Ji8cKXf6eWJOrOKA4ZUKFyDFUPhvpm5g@localhost:5432/blackbow'
    }
  }
});

// Connect to Supabase PostgreSQL (destination)
const destDb = new PrismaClient({
  datasources: {
    db: {
      url: 'postgresql://supabase_admin:2LSuOhkdKTCS6F4aD4LsTtvZ5gMsgYgLhKbIlHNPReg=@localhost:5433/postgres'
    }
  }
});

async function migrate() {
  try {
    console.log('🚀 Starting data migration from local PostgreSQL to Supabase...\n');

    // 1. Migrate Users
    console.log('📊 Migrating users...');
    const users = await sourceDb.user.findMany();
    console.log(`   Found ${users.length} users`);

    for (const user of users) {
      await destDb.user.create({
        data: {
          id: user.id,
          authUserId: user.authUserId,
          email: user.email,
          businessName: user.businessName,
          vendorType: user.vendorType,
          location: user.location,
          about: user.about,
          onboardingCompleted: user.onboardingCompleted,
          balance: user.balance,
          isAdmin: user.isAdmin,
          adminVerifiedAt: user.adminVerifiedAt,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt
        }
      });
    }
    console.log('   ✅ Users migrated\n');

    // 2. Migrate Leads
    console.log('📊 Migrating leads...');
    const leads = await sourceDb.lead.findMany();
    console.log(`   Found ${leads.length} leads`);

    for (const lead of leads) {
      await destDb.lead.create({
        data: {
          id: lead.id,
          pipedriveDealId: lead.pipedriveDealId,
          weddingDate: lead.weddingDate,
          city: lead.city,
          state: lead.state,
          location: lead.location,
          description: lead.description,
          ethnicReligious: lead.ethnicReligious,
          firstName: lead.firstName,
          lastName: lead.lastName,
          personName: lead.personName,
          email: lead.email,
          phone: lead.phone,
          source: lead.source,
          gclid: lead.gclid,
          fbclid: lead.fbclid,
          utmTerm: lead.utmTerm,
          spUtmCampaign: lead.spUtmCampaign,
          utmContent: lead.utmContent,
          utmMedium: lead.utmMedium,
          eventId: lead.eventId,
          sessionId: lead.sessionId,
          pixelId: lead.pixelId,
          projectId: lead.projectId,
          conversionPageUrl: lead.conversionPageUrl,
          expectedValue: lead.expectedValue,
          active: lead.active,
          comment: lead.comment,
          budgetMin: lead.budgetMin,
          budgetMax: lead.budgetMax,
          servicesNeeded: lead.servicesNeeded,
          price: lead.price,
          status: lead.status,
          maskedInfo: lead.maskedInfo,
          fullInfo: lead.fullInfo,
          createdAt: lead.createdAt,
          updatedAt: lead.updatedAt
        }
      });
    }
    console.log('   ✅ Leads migrated\n');

    // 3. Migrate Transactions
    console.log('📊 Migrating transactions...');
    const transactions = await sourceDb.transaction.findMany();
    console.log(`   Found ${transactions.length} transactions`);

    for (const transaction of transactions) {
      await destDb.transaction.create({
        data: {
          id: transaction.id,
          userId: transaction.userId,
          amount: transaction.amount,
          type: transaction.type,
          stripePaymentId: transaction.stripePaymentId,
          balanceAfter: transaction.balanceAfter,
          metadata: transaction.metadata,
          createdAt: transaction.createdAt
        }
      });
    }
    console.log('   ✅ Transactions migrated\n');

    // 4. Migrate Purchases
    console.log('📊 Migrating purchases...');
    const purchases = await sourceDb.purchase.findMany();
    console.log(`   Found ${purchases.length} purchases`);

    for (const purchase of purchases) {
      await destDb.purchase.create({
        data: {
          id: purchase.id,
          userId: purchase.userId,
          leadId: purchase.leadId,
          amountPaid: purchase.amountPaid,
          purchasedAt: purchase.purchasedAt,
          notes: purchase.notes
        }
      });
    }
    console.log('   ✅ Purchases migrated\n');

    // 5. Migrate Payment Methods (if any)
    console.log('📊 Migrating payment methods...');
    const paymentMethods = await sourceDb.paymentMethod.findMany();
    console.log(`   Found ${paymentMethods.length} payment methods`);

    for (const pm of paymentMethods) {
      await destDb.paymentMethod.create({
        data: {
          id: pm.id,
          userId: pm.userId,
          stripePaymentMethodId: pm.stripePaymentMethodId,
          last4: pm.last4,
          brand: pm.brand,
          expiryMonth: pm.expiryMonth,
          expiryYear: pm.expiryYear,
          isDefault: pm.isDefault,
          createdAt: pm.createdAt
        }
      });
    }
    console.log('   ✅ Payment methods migrated\n');

    // Summary
    console.log('✅ Migration completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   Users: ${users.length}`);
    console.log(`   Leads: ${leads.length}`);
    console.log(`   Transactions: ${transactions.length}`);
    console.log(`   Purchases: ${purchases.length}`);
    console.log(`   Payment Methods: ${paymentMethods.length}`);

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await sourceDb.$disconnect();
    await destDb.$disconnect();
  }
}

migrate();
