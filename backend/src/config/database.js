import { PrismaClient } from '@prisma/client';
import { logger } from '../utils/logger.js';

// Initialize Prisma Client with DeSaaS compliance settings
export const prisma = new PrismaClient({
  log: [
    { level: 'query', emit: 'event' },
    { level: 'error', emit: 'event' },
    { level: 'warn', emit: 'event' }
  ],
  datasources: {
    db: {
      url: process.env.DATABASE_URL
    }
  },
  // Note: Prisma doesn't support query_timeout directly in config
  // But we'll add middleware-based timeout detection below
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

// DeSaaS Compliance: Slow Query Detection (>1s threshold)
// NOTE: prisma.$use() middleware was deprecated in Prisma 5+
// TODO: Migrate to Prisma Client Extensions API when time permits
// For now, relying on query event logging above for monitoring
//
// prisma.$use(async (params, next) => {
//   const start = Date.now();
//
//   try {
//     const result = await next(params);
//     const duration = Date.now() - start;
//
//     // Log slow queries (>1000ms)
//     if (duration > 1000) {
//       logger.warn('Slow Query Detected', {
//         model: params.model,
//         action: params.action,
//         duration: `${duration}ms`,
//         query: JSON.stringify(params.args).substring(0, 200) + '...',
//         timestamp: new Date().toISOString()
//       });
//     }
//
//     // Log all queries in development for debugging
//     if (process.env.NODE_ENV !== 'production' && duration > 100) {
//       logger.debug('Query Performance', {
//         model: params.model,
//         action: params.action,
//         duration: `${duration}ms`
//       });
//     }
//
//     return result;
//   } catch (error) {
//     const duration = Date.now() - start;
//     logger.error('Query Failed', {
//       model: params.model,
//       action: params.action,
//       duration: `${duration}ms`,
//       error: error.message
//     });
//     throw error;
//   }
// });

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
