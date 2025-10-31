/**
 * Migration Script: Convert Lead IDs from CUID to State-Based Format
 *
 * This script:
 * 1. Fetches all existing leads
 * 2. Generates new IDs in format: [STATE][TIMESTAMP]
 * 3. Updates lead IDs and all foreign key references
 *
 * CRITICAL: This modifies PRIMARY KEYS and FOREIGN KEYS
 * Run with caution and ensure database backup exists
 */

import { PrismaClient } from '@prisma/client';
import { generateLeadId } from '../src/utils/leadIdGenerator.js';

const prisma = new PrismaClient();

/**
 * Migrate a single lead ID
 */
async function migrateLeadId(lead) {
  const oldId = lead.id;

  // Generate new ID based on state and creation date
  const newId = generateLeadId(lead.state, lead.createdAt);

  console.log(`Migrating: ${oldId} → ${newId} (State: ${lead.state || 'XX'})`);

  try {
    // Use a transaction to ensure atomicity
    await prisma.$transaction(async (tx) => {
      // Step 1: Update purchases to reference new lead ID
      const purchaseCount = await tx.purchase.updateMany({
        where: { leadId: oldId },
        data: { leadId: newId }
      });

      console.log(`  ↳ Updated ${purchaseCount.count} purchases`);

      // Step 2: Update transactions metadata (if leadId exists in metadata JSON)
      const transactions = await tx.transaction.findMany({
        where: {
          metadata: {
            path: ['leadId'],
            equals: oldId
          }
        }
      });

      for (const transaction of transactions) {
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            metadata: {
              ...transaction.metadata,
              leadId: newId
            }
          }
        });
      }

      console.log(`  ↳ Updated ${transactions.length} transaction metadata`);

      // Step 3: Create new lead with new ID (copy all fields)
      await tx.lead.create({
        data: {
          id: newId,
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

      console.log(`  ↳ Created new lead with ID: ${newId}`);

      // Step 4: Delete old lead (CASCADE will handle any remaining references)
      await tx.lead.delete({
        where: { id: oldId }
      });

      console.log(`  ↳ Deleted old lead: ${oldId}`);
    });

    return { success: true, oldId, newId };
  } catch (error) {
    console.error(`  ✗ Error migrating ${oldId}:`, error.message);
    return { success: false, oldId, error: error.message };
  }
}

/**
 * Main migration function
 */
async function migrateAllLeads() {
  console.log('========================================');
  console.log('Lead ID Migration Script');
  console.log('========================================\n');

  try {
    // Fetch all leads
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'asc' } // Oldest first
    });

    console.log(`Found ${leads.length} leads to migrate\n`);

    if (leads.length === 0) {
      console.log('No leads to migrate. Exiting.');
      return;
    }

    // Confirm before proceeding
    console.log('⚠️  WARNING: This will modify all lead IDs and foreign key references');
    console.log('⚠️  Ensure you have a database backup before proceeding\n');

    const results = [];

    // Migrate each lead
    for (let i = 0; i < leads.length; i++) {
      const lead = leads[i];
      console.log(`\n[${i + 1}/${leads.length}]`);
      const result = await migrateLeadId(lead);
      results.push(result);

      // Small delay to avoid overwhelming the database
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    // Summary
    console.log('\n========================================');
    console.log('Migration Summary');
    console.log('========================================');

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    console.log(`✓ Successful: ${successful}`);
    console.log(`✗ Failed: ${failed}`);

    if (failed > 0) {
      console.log('\nFailed migrations:');
      results.filter(r => !r.success).forEach(r => {
        console.log(`  - ${r.oldId}: ${r.error}`);
      });
    }

    console.log('\n✅ Migration complete!');

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateAllLeads()
  .then(() => {
    console.log('\nExiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
