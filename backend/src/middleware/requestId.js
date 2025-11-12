/**
 * Request ID Middleware
 * 
 * Generates unique request IDs for tracing requests through logs.
 * DeSaaS Compliance: Required for audit trail and debugging.
 */

import { randomUUID } from 'crypto';

/**
 * Request ID middleware
 * Generates UUID for each request and adds it to req.id
 * Also sets X-Request-ID response header
 */
export const requestIdMiddleware = (req, res, next) => {
  // Use existing request ID from client if provided, otherwise generate new one
  req.id = req.headers['x-request-id'] || randomUUID();
  
  // Set response header for client tracking
  res.setHeader('X-Request-ID', req.id);
  
  next();
};

export default requestIdMiddleware;

