import 'dotenv/config';
import { prisma } from '../src/config/database.js';

async function backdateLeads() {
  try {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
    // Set leads to be created 4 days ago (so they won't be marked as NEW)
    const fourDaysAgo = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);

    // Find all leads created in the last 3 days
    const recentLeads = await prisma.lead.findMany({
      where: {
        createdAt: {
          gte: threeDaysAgo
        }
      },
      select: {
        id: true,
        createdAt: true
      }
    });

    console.log(`Found ${recentLeads.length} leads created in the last 3 days`);

    if (recentLeads.length === 0) {
      console.log('No leads to update');
      await prisma.$disconnect();
      process.exit(0);
    }

    console.log('\nUpdating createdAt dates to 4 days ago...');
    recentLeads.forEach(lead => {
      console.log(`  Lead ${lead.id}: ${lead.createdAt.toISOString()} -> ${fourDaysAgo.toISOString()}`);
    });

    // Update all recent leads to have createdAt of 4 days ago
    const result = await prisma.lead.updateMany({
      where: {
        createdAt: {
          gte: threeDaysAgo
        }
      },
      data: {
        createdAt: fourDaysAgo
      }
    });

    console.log(`\nSuccessfully updated ${result.count} leads - backdated createdAt dates`);
    console.log('These leads will no longer be marked as NEW by the backend');

    await prisma.$disconnect();
    process.exit(0);
  } catch (error) {
    console.error('Error backdating leads:', error.message);
    console.error(error.stack);
    await prisma.$disconnect();
    process.exit(1);
  }
}

backdateLeads();
