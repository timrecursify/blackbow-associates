import { logger } from '../utils/logger.js';

// Custom error class for application errors
export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', details = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Global error handler middleware
export const errorHandler = (err, req, res, next) => {
  // Default to 500 server error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';
  let details = err.details || null;

  // Handle Prisma errors
  if (err.code?.startsWith('P')) {
    statusCode = 400;
    code = 'DATABASE_ERROR';

    // Prisma error codes
    if (err.code === 'P2002') {
      message = 'A record with this value already exists';
      code = 'DUPLICATE_ERROR';
    } else if (err.code === 'P2025') {
      message = 'Record not found';
      code = 'NOT_FOUND';
      statusCode = 404;
    }
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = 'INVALID_TOKEN';
    message = 'Invalid or expired authentication token';
  }

  // Log error
  logger.error('API Error', {
    code,
    message,
    statusCode,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    stack: err.stack
  });

  // Send error response
  res.status(statusCode).json({
    error: {
      code,
      message,
      ...(details && { details }),
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// 404 handler
export const notFoundHandler = (req, res) => {
  res.status(404).json({
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`
    }
  });
};

// Async handler wrapper to catch promise rejections
export const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

export default { errorHandler, notFoundHandler, asyncHandler, AppError };
