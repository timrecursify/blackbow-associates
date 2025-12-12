import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import { logger, logRequest, notifyTelegram } from './utils/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { testConnection, disconnect } from './config/database.js';
import { requestIdMiddleware } from './middleware/requestId.js';

// Import routes
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/users.routes.js';
import leadRoutes from './routes/leads.routes.js';
import paymentRoutes from './routes/payments.routes.js';
import adminRoutes from './routes/admin.routes.js';
import webhookRoutes from './routes/webhooks.routes.js';
import pipedriveRoutes from './routes/pipedrive.routes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import crmBetaRoutes from './routes/crmBeta.routes.js';

// Import cron jobs
import { initRetryScheduler } from './jobs/webhook-retry.job.js';

// Initialize Express app
const app = express();
const PORT = process.env.PORT || 3450;
const HOST = process.env.HOST || '127.0.0.1';

// Trust proxy (required for rate limiting behind nginx/reverse proxy)
app.set('trust proxy', true);

// DeSaaS Compliance: Request ID middleware (must be first)
app.use(requestIdMiddleware);

// Security middleware - Enhanced helmet configuration
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "https://pixel.salesmagic.us"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://pixel.salesmagic.us"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  frameguard: {
    action: 'deny'
  },
  noSniff: true,
  xssFilter: true,
  referrerPolicy: {
    policy: 'strict-origin-when-cross-origin'
  },
  permissionsPolicy: {
    features: {
      geolocation: ["'none'"],
      microphone: ["'none'"],
      camera: ["'none'"]
    }
  }
}));

// CORS configuration - Production-ready for all browsers and mobile devices
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, curl, etc.)
    if (!origin) {
      return callback(null, true);
    }

    // Build allowed origins list
    const allowedOrigins = [
      'https://blackbowassociates.com',
      'https://www.blackbowassociates.com',
      'http://blackbowassociates.com', // HTTP fallback
      'http://www.blackbowassociates.com' // HTTP fallback
    ];

    // Add environment-specific frontend URL if set
    if (process.env.FRONTEND_URL) {
      allowedOrigins.push(process.env.FRONTEND_URL);
      // Also add www variant if not already present
      if (process.env.FRONTEND_URL.includes('blackbowassociates.com') && !process.env.FRONTEND_URL.includes('www')) {
        allowedOrigins.push(process.env.FRONTEND_URL.replace('blackbowassociates.com', 'www.blackbowassociates.com'));
      }
    }

    // Development - allow localhost
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push(
        'http://localhost:5173',
        'http://localhost:3000',
        'http://localhost:5174',
        'http://127.0.0.1:5173',
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5174'
      );
    }

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Log blocked origin for debugging
      logger.warn('CORS blocked origin', { origin, allowedOrigins });
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['Content-Length', 'X-Foo', 'X-Bar'],
  maxAge: 86400 // 24 hours - cache preflight requests
};

app.use(cors(corsOptions));

// Body parsers
// Exclude Stripe webhook from JSON parsing (needs raw body for signature verification)
app.use((req, res, next) => {
  if (req.path === "/api/webhooks/stripe") {
    return next(); // Skip JSON parsing for Stripe webhook
  }
  express.json()(req, res, next);
});
app.use(express.urlencoded({ extended: true }));

// Cookie parser (for OAuth sessions)
app.use(cookieParser());

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
app.use('/api/admin/analytics', analyticsRoutes);
app.use('/api/crm-beta', crmBetaRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} signal received: closing HTTP server`);

  try {
    await disconnect();
    // Don't send Telegram notification for graceful shutdowns (PM2 restarts)
    // Only log locally to avoid notification spam
    logger.info('Server shutdown gracefully', { signal });
    process.exit(0);
  } catch (error) {
    logger.error('Error during shutdown', { error: error.message });
    // Only notify on shutdown errors, not normal restarts
    await notifyTelegram(`❌ Server shutdown error: ${error.message}`, 'error');
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
    // Don't send notification on every restart - only log locally
    // PM2 restarts are normal operations, not events worth notifying
    logger.info('Server started successfully', { port: PORT, host: HOST });

    // Initialize webhook retry scheduler
    initRetryScheduler();
    logger.info('Webhook retry scheduler initialized');
  } catch (error) {
    logger.error('Failed to connect to database on startup', { error: error.message });
    // Database connection failed - log error but don't spam notifications
    // PM2 will auto-restart and we'll try again
    logger.error('Database connection failed on startup', { error: error.message });
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
