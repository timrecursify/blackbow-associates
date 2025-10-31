/**
 * Migration Script: Convert Lead IDs using Raw SQL
 *
 * This script updates lead IDs in place using raw SQL to avoid unique constraint issues
 */

import { PrismaClient } from '@prisma/client';
import { generateLeadId } from '../src/utils/leadIdGenerator.js';

const prisma = new PrismaClient();

async function migrateLeadIdsWithSQL() {
  console.log('========================================');
  console.log('Lead ID Migration Script (SQL Approach)');
  console.log('========================================\n');

  try {
    // Fetch all leads
    const leads = await prisma.lead.findMany({
      orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${leads.length} leads to migrate\n`);

    if (leads.length === 0) {
      console.log('No leads to migrate. Exiting.');
      return;
    }

    const idMappings = [];

    // Generate new IDs for all leads
    console.log('Generating new IDs...\n');
    for (const lead of leads) {
      const newId = generateLeadId(lead.state, lead.createdAt);
      idMappings.push({
        oldId: lead.id,
        newId: newId,
        state: lead.state || 'XX',
        createdAt: lead.createdAt
      });
      console.log(`${lead.id} → ${newId} (State: ${lead.state || 'XX'})`);
    }

    console.log('\n⚠️  WARNING: This will modify all lead IDs using raw SQL');
    console.log('⚠️  Foreign key constraints will be temporarily disabled');
    console.log('⚠️  Ensure you have a database backup before proceeding\n');

    // Execute migration in a single transaction
    await prisma.$transaction(async (tx) => {
      console.log('Starting migration transaction...\n');

      // Step 1: Disable foreign key constraints temporarily (PostgreSQL)
      await tx.$executeRawUnsafe('SET CONSTRAINTS ALL DEFERRED;');
      console.log('✓ Foreign key constraints deferred');

      // Step 2: Update purchase records
      for (const mapping of idMappings) {
        const updateCount = await tx.$executeRawUnsafe(
          `UPDATE purchases SET lead_id = '${mapping.newId}' WHERE lead_id = '${mapping.oldId}';`
        );
        if (updateCount > 0) {
          console.log(`  ↳ Updated ${updateCount} purchase(s) for ${mapping.oldId}`);
        }
      }
      console.log('✓ Purchase records updated');

      // Step 3: Update transaction metadata (JSON field)
      for (const mapping of idMappings) {
        await tx.$executeRawUnsafe(
          `UPDATE transactions
           SET metadata = jsonb_set(metadata, '{leadId}', '"${mapping.newId}"', false)
           WHERE metadata->>'leadId' = '${mapping.oldId}';`
        );
      }
      console.log('✓ Transaction metadata updated');

      // Step 4: Update lead IDs
      for (const mapping of idMappings) {
        await tx.$executeRawUnsafe(
          `UPDATE leads SET id = '${mapping.newId}' WHERE id = '${mapping.oldId}';`
        );
      }
      console.log('✓ Lead IDs updated');

      console.log('\n✅ Transaction committed successfully!');
    });

    // Verify migration
    console.log('\nVerifying migration...');
    const updatedLeads = await prisma.lead.findMany({
      select: { id: true, state: true }
    });

    let validCount = 0;
    let invalidCount = 0;

    for (const lead of updatedLeads) {
      if (lead.id.length === 20 && /^[A-Z]{2}\d{18}$/.test(lead.id)) {
        validCount++;
      } else {
        invalidCount++;
        console.log(`  ⚠ Invalid ID format: ${lead.id}`);
      }
    }

    console.log(`\n✓ Valid IDs: ${validCount}`);
    console.log(`✗ Invalid IDs: ${invalidCount}`);

    if (invalidCount === 0) {
      console.log('\n========================================');
      console.log('✅ Migration completed successfully!');
      console.log('========================================');
    } else {
      console.log('\n⚠ Migration completed with warnings');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateLeadIdsWithSQL()
  .then(() => {
    console.log('\nExiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
