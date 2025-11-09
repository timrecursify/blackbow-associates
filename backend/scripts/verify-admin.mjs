import { PrismaClient } from '@prisma/client';
import 'dotenv/config';

const prisma = new PrismaClient();

async function verifyAdmin() {
  try {
    const admin = await prisma.user.findUnique({
      where: { email: 'tim@preciouspicspro.com' },
      select: { id: true, email: true, isAdmin: true, emailConfirmed: true, createdAt: true }
    });
    
    if (admin) {
      console.log('✓ Admin user preserved:', admin);
    } else {
      console.log('✗ ERROR: Admin user not found!');
      process.exit(1);
    }
  } catch (error) {
    console.error('Error verifying admin:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

verifyAdmin();
