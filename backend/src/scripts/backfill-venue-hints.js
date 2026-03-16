/**
 * Backfill venueHint for existing leads
 * Run with: node src/scripts/backfill-venue-hints.js
 */

import { prisma } from '../config/database.js';
import { extractVenueHint } from '../services/pipedrive.service.js';

async function backfillVenueHints() {
  console.log('Starting venueHint backfill...');

  // Get all leads with fullInfo
  const leads = await prisma.lead.findMany({
    where: {
      fullInfo: { not: null }
    },
    select: {
      id: true,
      fullInfo: true,
      venueHint: true
    }
  });

  console.log(`Found ${leads.length} leads to process`);

  let updated = 0;
  let skipped = 0;
  let noHint = 0;

  for (const lead of leads) {
    // Skip if already has venueHint
    if (lead.venueHint) {
      skipped++;
      continue;
    }

    // Extract notes from fullInfo
    const notes = lead.fullInfo?.notes;
    if (!notes) {
      noHint++;
      continue;
    }

    // Extract venue hint
    const venueHint = extractVenueHint(notes);

    if (venueHint) {
      await prisma.lead.update({
        where: { id: lead.id },
        data: { venueHint }
      });
      updated++;
      console.log(`  ${lead.id}: "${venueHint}"`);
    } else {
      noHint++;
    }
  }

  console.log('\nBackfill complete:');
  console.log(`  Updated: ${updated}`);
  console.log(`  Skipped (already had hint): ${skipped}`);
  console.log(`  No hint extracted: ${noHint}`);

  await prisma.$disconnect();
}

backfillVenueHints().catch(err => {
  console.error('Backfill failed:', err);
  process.exit(1);
});
