import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import { logger, logRequest, notifyTelegram } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { testConnection, disconnect } from './config/database.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import leadRoutes from './routes/leads.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import adminRoutes from './routes/admin.routes.js';
import webhookRoutes from './routes/webhooks.routes.js';
import pipedriveRoutes from './routes/pipedrive.routes.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3450;
const HOST = process.env.HOST || '127.0.0.1';

// Trust proxy (required for rate limiting behind nginx/reverse proxy)
app.set('trust proxy', true);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'https://blackbowassociates.com',
  credentials: true,
  optionsSuccessStatus: 200
};

// Development CORS - allow localhost
if (process.env.NODE_ENV === 'development') {
  corsOptions.origin = ['http://localhost:5173', 'http://localhost:3000', process.env.FRONTEND_URL];
}

app.use(cors(corsOptions));

// Body parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use(morgan('combined', {
  stream: {
    write: (message) => logger.info(message.trim())
  }
}));
app.use(logRequest);

// Rate limiting
app.use('/api/', apiLimiter);

// Health check endpoint (no auth required)
app.get('/health', async (req, res) => {
  const startTime = Date.now();

  try {
    // Check database connectivity
    await testConnection();

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: {
        used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
        total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
        unit: 'MB'
      },
      database: 'connected',
      responseTime: `${Date.now() - startTime}ms`,
      environment: process.env.NODE_ENV || 'development'
    };

    res.json(health);
  } catch (error) {
    logger.error('Health check failed', { error: error.message });

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: 'disconnected'
    });
  }
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/webhooks', webhookRoutes);
app.use('/api/pipedrive', pipedriveRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);

  try {
    await disconnect();
    await notifyTelegram(`Server shutting down (${signal})`, 'info');
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
const server = app.listen(PORT, HOST, async () => {
  logger.info('BlackBow API Server started', {
    port: PORT,
    host: HOST,
    env: process.env.NODE_ENV || 'development',
    nodeVersion: process.version
  });

  try {
    // Test database connection on startup
    await testConnection();
    await notifyTelegram(`✅ BlackBow API started on port ${PORT}`, 'success');
  } catch (error) {
    logger.error('Failed to connect to database on startup', { error: error.message });
    await notifyTelegram(`❌ BlackBow API started but database connection failed`, 'error');
  }
});

// Handle unhandled rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
});

process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default app;
