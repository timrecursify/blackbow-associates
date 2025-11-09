import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function cleanupUsers() {
  try {
    // Find users to delete
    const usersToDelete = await prisma.user.findMany({
      where: {
        AND: [
          {
            OR: [
              { email: { startsWith: 'tim', mode: 'insensitive' } },
              { email: { startsWith: 'test', mode: 'insensitive' } }
            ]
          },
          {
            email: { not: 'tim@preciouspicspro.com' }
          }
        ]
      },
      select: {
        id: true,
        email: true,
        emailConfirmed: true,
        createdAt: true
      }
    });

    console.log(`Found ${usersToDelete.length} users to delete:`);
    usersToDelete.forEach(user => {
      console.log(`  - ${user.email} (ID: ${user.id}, Confirmed: ${user.emailConfirmed})`);
    });

    if (usersToDelete.length === 0) {
      console.log('No users to delete.');
      await prisma.$disconnect();
      return;
    }

    // Delete users (cascading deletes will handle related records)
    const deleteResults = await Promise.all(
      usersToDelete.map(user => 
        prisma.user.delete({
          where: { id: user.id }
        })
      )
    );

    console.log(`\nSuccessfully deleted ${deleteResults.length} users.`);
    
  } catch (error) {
    console.error('Error cleaning up users:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanupUsers();
