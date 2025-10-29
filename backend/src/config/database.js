import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ]
});

// Log database queries in development
if (process.env.NODE_ENV !== 'production') {
  prisma.$on('query', (e) => {
    logger.debug('Database Query', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`
    });
  });
}

// Log database errors
prisma.$on('error', (e) => {
  logger.error('Database Error', { message: e.message });
});

// Test database connection
export const testConnection = async () => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database connection established');
    return true;
  } catch (error) {
    logger.error('Database connection failed', { error: error.message });
    throw error;
  }
};

// Graceful shutdown
export const disconnect = async () => {
  await prisma.$disconnect();
  logger.info('Database connection closed');
};

export default prisma;
