/**
 * Migration Script: Convert Lead IDs to V2 Format
 * V1 Format: [STATE][TIMESTAMP][RANDOM] (20 chars)
 * V2 Format: [STATE][6-DIGIT UNIQUE] (8 chars)
 *
 * This migration:
 * 1. Uses city-to-state mapping for better state detection
 * 2. Generates shorter, cleaner IDs
 * 3. Maintains sequential numbering for uniqueness
 */

import { PrismaClient } from '@prisma/client';
import { generateLeadId } from '../src/utils/leadIdGeneratorV2.js';

const prisma = new PrismaClient();

async function migrateToV2Ids() {
  console.log('========================================');
  console.log('Lead ID Migration to V2 Format');
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

    // Generate new IDs for all leads
    console.log('Generating new V2 IDs...\n');
    const idMappings = [];
    const usedIds = new Set();

    for (const lead of leads) {
      let newId;
      let attempts = 0;

      // Generate unique ID (retry if collision)
      do {
        newId = generateLeadId(lead.state, lead.city);
        attempts++;
        if (attempts > 100) {
          throw new Error(`Failed to generate unique ID after 100 attempts for lead ${lead.id}`);
        }
      } while (usedIds.has(newId));

      usedIds.add(newId);

      idMappings.push({
        oldId: lead.id,
        newId: newId,
        state: lead.state || 'XX',
        city: lead.city
      });

      console.log(`${lead.id} → ${newId} (State: ${lead.state || 'XX'}, City: ${lead.city || 'N/A'})`);
    }

    console.log('\n⚠️  WARNING: This will modify all lead IDs');
    console.log('⚠️  Ensure you have a database backup before proceeding\n');
    console.log('Starting migration...\n');

    // Step 1: Add temporary column
    console.log('Step 1: Adding temporary column for new IDs...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE leads ADD COLUMN IF NOT EXISTS new_id VARCHAR(8);`
    );
    console.log('✓ Temporary column added\n');

    // Step 2: Populate temporary column with new IDs
    console.log('Step 2: Populating new IDs...');
    for (const mapping of idMappings) {
      await prisma.$executeRawUnsafe(
        `UPDATE leads SET new_id = '${mapping.newId}' WHERE id = '${mapping.oldId}';`
      );
    }
    console.log(`✓ Populated ${idMappings.length} new IDs\n`);

    // Step 3: Drop foreign key constraints
    console.log('Step 3: Dropping foreign key constraints...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE purchases DROP CONSTRAINT IF EXISTS purchases_lead_id_fkey;`
    );
    console.log('✓ Foreign key constraints dropped\n');

    // Step 4: Update purchase records
    console.log('Step 4: Updating purchase records...');
    for (const mapping of idMappings) {
      const result = await prisma.$executeRawUnsafe(
        `UPDATE purchases SET lead_id = '${mapping.newId}' WHERE lead_id = '${mapping.oldId}';`
      );
      if (result > 0) {
        console.log(`  ↳ Updated ${result} purchase(s) for ${mapping.oldId}`);
      }
    }
    console.log('✓ Purchase records updated\n');

    // Step 5: Update transaction metadata
    console.log('Step 5: Updating transaction metadata...');
    for (const mapping of idMappings) {
      await prisma.$executeRawUnsafe(
        `UPDATE transactions
         SET metadata = jsonb_set(metadata, '{leadId}', '"${mapping.newId}"', false)
         WHERE metadata->>'leadId' = '${mapping.oldId}';`
      );
    }
    console.log('✓ Transaction metadata updated\n');

    // Step 6: Drop old id column
    console.log('Step 6: Dropping old id column...');
    await prisma.$executeRawUnsafe(`ALTER TABLE leads DROP COLUMN id;`);
    console.log('✓ Old id column dropped\n');

    // Step 7: Rename new_id to id
    console.log('Step 7: Renaming new_id to id...');
    await prisma.$executeRawUnsafe(`ALTER TABLE leads RENAME COLUMN new_id TO id;`);
    console.log('✓ Column renamed\n');

    // Step 8: Add primary key constraint
    console.log('Step 8: Adding primary key constraint...');
    await prisma.$executeRawUnsafe(`ALTER TABLE leads ADD PRIMARY KEY (id);`);
    console.log('✓ Primary key constraint added\n');

    // Step 9: Recreate foreign key constraint
    console.log('Step 9: Recreating foreign key constraints...');
    await prisma.$executeRawUnsafe(
      `ALTER TABLE purchases ADD CONSTRAINT purchases_lead_id_fkey
       FOREIGN KEY (lead_id) REFERENCES leads(id) ON DELETE CASCADE ON UPDATE CASCADE;`
    );
    console.log('✓ Foreign key constraints recreated\n');

    // Verify migration
    console.log('Verifying migration...');
    const updatedLeads = await prisma.lead.findMany({
      select: { id: true, state: true, city: true }
    });

    let validCount = 0;
    let invalidCount = 0;

    for (const lead of updatedLeads) {
      if (lead.id.length === 8 && /^[A-Z]{2}\d{6}$/.test(lead.id)) {
        validCount++;
      } else {
        invalidCount++;
        console.log(`  ⚠ Invalid ID format: ${lead.id}`);
      }
    }

    console.log(`\n✓ Valid IDs: ${validCount}`);
    console.log(`✗ Invalid IDs: ${invalidCount}`);

    // Show sample of new IDs
    console.log('\nSample of new IDs:');
    updatedLeads.slice(0, 10).forEach(lead => {
      console.log(`  ${lead.id} - ${lead.city || 'N/A'}, ${lead.state || 'XX'}`);
    });

    if (invalidCount === 0) {
      console.log('\n========================================');
      console.log('✅ Migration completed successfully!');
      console.log('========================================');
    } else {
      console.log('\n⚠ Migration completed with warnings');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error);
    console.error('\n⚠️  Database may be in an inconsistent state!');
    console.error('⚠️  You may need to restore from backup');
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run migration
migrateToV2Ids()
  .then(() => {
    console.log('\nExiting...');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error);
    process.exit(1);
  });
