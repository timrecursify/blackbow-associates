import rateLimit from 'express-rate-limit';
import { logger } from '../utils/logger.js';

// SECURITY: Helper to generate rate limit key with strict validation
const generateRateLimitKey = (req, prefix = 'api') => {
  // Prefer user ID for authenticated requests
  if (req.user?.id) {
    return `${prefix}:user:${req.user.id}`;
  }

  // Fall back to IP for unauthenticated requests
  const ip = req.ip || req.headers['x-forwarded-for'] || req.connection?.remoteAddress;

  if (!ip) {
    logger.error('Rate limiter - missing IP and user ID', {
      path: req.path,
      headers: Object.keys(req.headers)
    });
    // SECURITY: Reject request instead of using shared 'unknown' bucket
    throw new Error('Unable to identify request source for rate limiting');
  }

  return `${prefix}:ip:${ip}`;
};

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many requests, please try again later.'
    }
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  // SECURITY: Use strict key generation with validation
  keyGenerator: (req) => {
    return generateRateLimitKey(req, 'api');
  },
  skip: (req) => {
    // Skip validation for health checks
    return req.path === '/health';
  },
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      path: req.path,
      userId: req.user?.id
    });
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many requests, please try again later.'
      }
    });
  }
});

// Strict limiter for authentication endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 requests per windowMs
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many authentication attempts, please try again later.'
    }
  },
  skipSuccessfulRequests: false,
  // SECURITY: Use strict key generation with validation (IP required for auth endpoints)
  keyGenerator: (req) => {
    return generateRateLimitKey(req, 'auth');
  },
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many authentication attempts, please try again later.'
      }
    });
  }
});

// Payment endpoints limiter
export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20, // Limit each IP to 20 payment requests per hour
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many payment requests, please try again later.'
    }
  },
  // SECURITY: Use strict key generation with validation
  keyGenerator: (req) => {
    return generateRateLimitKey(req, 'payment');
  },
  handler: (req, res) => {
    logger.warn('Payment rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id
    });
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many payment requests, please try again later.'
      }
    });
  }
});

// Analytics endpoints limiter (for admin dashboard)
export const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 100, // Limit each admin to 100 analytics requests per hour
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many analytics requests, please try again later.'
    }
  },
  // SECURITY: Use strict key generation with validation
  keyGenerator: (req) => {
    return generateRateLimitKey(req, 'analytics');
  },
  handler: (req, res) => {
    logger.warn('Analytics rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path
    });
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many analytics requests, please try again later.'
      }
    });
  }
});

// SECURITY: Strict limiter for feedback submissions (prevents $2 reward spam)
export const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // STRICT: Only 5 feedback submissions per hour per user
  message: {
    error: {
      code: 'RATE_LIMIT_EXCEEDED',
      message: 'Too many feedback submissions. Please try again later.'
    }
  },
  skipSuccessfulRequests: false, // Count all attempts, not just successful ones
  keyGenerator: (req) => {
    // SECURITY: Always use user ID (authenticated route only)
    if (!req.user?.id) {
      logger.error('Feedback rate limiter called without authenticated user', {
        ip: req.ip,
        path: req.path
      });
      return 'unauthenticated'; // Fallback (should never happen)
    }
    return `feedback:${req.user.id}`;
  },
  handler: (req, res) => {
    logger.warn('Feedback rate limit exceeded - potential spam attempt', {
      ip: req.ip,
      userId: req.user?.id,
      path: req.path
    });
    res.status(429).json({
      error: {
        code: 'RATE_LIMIT_EXCEEDED',
        message: 'Too many feedback submissions. Please wait before submitting more feedback.'
      }
    });
  }
});

export default { apiLimiter, authLimiter, paymentLimiter, analyticsLimiter, feedbackLimiter };
