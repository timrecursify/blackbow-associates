import rateLimit from "express-rate-limit";
import { logger } from "../utils/logger.js";

/**
 * Generate rate limit key.
 *
 * IMPORTANT:
 * - For authenticated requests we use a per-user bucket (req.rateLimitUserId)
 * - For unauthenticated requests we fall back to per-IP
 */
const generateRateLimitKey = (req, prefix = "api") => {
  if (req.rateLimitUserId) {
    return `${prefix}:user:${req.rateLimitUserId}`;
  }

  // Fall back to IP for unauthenticated requests
  let ip = req.ip;

  // Extra fallback: first X-Forwarded-For entry
  if (!ip && req.headers["x-forwarded-for"]) {
    const xff = String(req.headers["x-forwarded-for"]).split(",")[0];
    ip = xff?.trim();
  }

  if (!ip) {
    logger.error("Rate limiter - missing IP and user ID", {
      path: req.path,
      headers: Object.keys(req.headers)
    });
    throw new Error("Unable to identify request source for rate limiting");
  }

  return `${prefix}:ip:${ip}`;
};

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => (req.rateLimitUserId ? 1000 : 100),
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many requests, please try again later."
    }
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => generateRateLimitKey(req, "api"),
  skip: (req) => req.path === "/health",
  handler: (req, res) => {
    logger.warn("Rate limit exceeded", {
      ip: req.ip,
      path: req.path,
      rateLimitUserId: req.rateLimitUserId
    });
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many requests, please try again later."
      }
    });
  }
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many authentication attempts, please try again later."
    }
  },
  skipSuccessfulRequests: false,
  keyGenerator: (req) => generateRateLimitKey(req, "auth"),
  handler: (req, res) => {
    logger.warn("Auth rate limit exceeded", {
      ip: req.ip,
      path: req.path
    });
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many authentication attempts, please try again later."
      }
    });
  }
});

export const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: (req) => (req.rateLimitUserId ? 60 : 20),
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many payment requests, please try again later."
    }
  },
  keyGenerator: (req) => generateRateLimitKey(req, "payment"),
  handler: (req, res) => {
    logger.warn("Payment rate limit exceeded", {
      ip: req.ip,
      rateLimitUserId: req.rateLimitUserId
    });
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many payment requests, please try again later."
      }
    });
  }
});

export const analyticsLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: (req) => (req.rateLimitUserId ? 500 : 100),
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many analytics requests, please try again later."
    }
  },
  keyGenerator: (req) => generateRateLimitKey(req, "analytics"),
  handler: (req, res) => {
    logger.warn("Analytics rate limit exceeded", {
      ip: req.ip,
      rateLimitUserId: req.rateLimitUserId,
      path: req.path
    });
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many analytics requests, please try again later."
      }
    });
  }
});

export const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many feedback submissions. Please try again later."
    }
  },
  skipSuccessfulRequests: false,
  keyGenerator: (req) => {
    if (!req.rateLimitUserId) {
      logger.error("Feedback rate limiter called without authenticated user", {
        ip: req.ip,
        path: req.path
      });
      return "unauthenticated";
    }
    return `feedback:${req.rateLimitUserId}`;
  },
  handler: (req, res) => {
    logger.warn("Feedback rate limit exceeded - potential spam attempt", {
      ip: req.ip,
      rateLimitUserId: req.rateLimitUserId,
      path: req.path
    });
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many feedback submissions. Please wait before submitting more feedback."
      }
    });
  }
});

export const adminIpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many admin requests from this IP, please try again later."
    }
  },
  keyGenerator: (req) => generateRateLimitKey(req, "admin_ip"),
  handler: (req, res) => {
    logger.warn("Admin IP rate limit exceeded", {
      ip: req.ip,
      rateLimitUserId: req.rateLimitUserId,
      path: req.path
    });
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many admin requests from this IP, please try again later."
      }
    });
  }
});

export const adminUserLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  message: {
    error: {
      code: "RATE_LIMIT_EXCEEDED",
      message: "Too many admin requests from this account, please try again later."
    }
  },
  keyGenerator: (req) => {
    if (!req.rateLimitUserId) {
      logger.error("Admin user rate limiter called without user", {
        ip: req.ip,
        path: req.path
      });
      throw new Error("User authentication required for admin rate limiting");
    }
    return `admin:user:${req.rateLimitUserId}`;
  },
  handler: (req, res) => {
    logger.warn("Admin user rate limit exceeded", {
      ip: req.ip,
      rateLimitUserId: req.rateLimitUserId,
      path: req.path
    });
    res.status(429).json({
      error: {
        code: "RATE_LIMIT_EXCEEDED",
        message: "Too many admin requests from this account, please try again later."
      }
    });
  }
});

export default {
  apiLimiter,
  authLimiter,
  paymentLimiter,
  analyticsLimiter,
  feedbackLimiter,
  adminIpLimiter,
  adminUserLimiter
};
