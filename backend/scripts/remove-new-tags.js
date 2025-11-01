import 'dotenv/config';
import { prisma } from '../src/config/database.js';

async function removeNewTags() {
  try {
    // Fetch ALL leads to check their tags
    const allLeads = await prisma.lead.findMany({
      select: {
        id: true,
        tags: true
      }
    });

    console.log(`Checking ${allLeads.length} total leads...`);

    // Filter leads that have NEW tag
    const leadsWithNew = allLeads.filter(lead => 
      lead.tags && Array.isArray(lead.tags) && lead.tags.includes('NEW')
    );

    console.log(`Found ${leadsWithNew.length} leads with NEW tag`);

    if (leadsWithNew.length === 0) {
      console.log('No leads to update - all NEW tags already removed');
      await prisma.$disconnect();
      process.exit(0);
    }

    // Show what we're removing
    console.log('\nLeads to update:');
    leadsWithNew.forEach(lead => {
      console.log(`  Lead ${lead.id}: removing NEW from tags [${lead.tags.join(', ')}]`);
    });

    // Update each lead to remove NEW tag, keeping other tags
    const updates = leadsWithNew.map(lead => {
      const filteredTags = lead.tags.filter(tag => tag !== 'NEW');
      return prisma.lead.update({
        where: { id: lead.id },
        data: {
          tags: {
            set: filteredTags
          }
        }
      });
    });

    const results = await prisma.$transaction(updates);
    console.log(`\nSuccessfully updated ${results.length} leads - removed NEW tags`);

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error removing NEW tags:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

removeNewTags();
