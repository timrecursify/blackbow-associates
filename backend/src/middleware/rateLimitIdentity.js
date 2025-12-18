import { verifyToken } from '../services/auth.service.js';

/**
 * Attach a stable identifier for rate limiting.
 *
 * This runs BEFORE the global API rate limiter so authenticated users are limited
 * by userId instead of shared IP (NAT/VPN/office networks).
 *
 * - If a valid access token is present, sets req.rateLimitUserId
 * - Otherwise leaves it unset and the limiter will fall back to IP
 */
export const attachRateLimitIdentity = (req, _res, next) => {
  try {
    const authHeader = req.headers.authorization;
    let token = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && req.cookies.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      return next();
    }

    // Verify token (cheap, no DB call)
    const decoded = verifyToken(token);

    // Only treat access tokens as identity
    if (decoded?.type === 'access' && decoded?.sub) {
      req.rateLimitUserId = decoded.sub;
    }

    return next();
  } catch (_err) {
    // Invalid/expired token: do not block request here; let auth middleware handle it.
    return next();
  }
};

export default attachRateLimitIdentity;
