import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET;
const ACCESS_TOKEN_EXPIRY = '24h';
const REFRESH_TOKEN_EXPIRY = '7d';
const BCRYPT_ROUNDS = 12;

/**
 * Hash a plain text password using bcrypt
 * @param {string} password - Plain text password
 * @returns {Promise<string>} Hashed password
 */
export const hashPassword = async (password) => {
  try {
    const hash = await bcrypt.hash(password, BCRYPT_ROUNDS);
    return hash;
  } catch (error) {
    logger.error('Failed to hash password', {
      error: error.message,
      stack: error.stack
    });
    throw new Error('Failed to hash password');
  }
};

/**
 * Compare a plain text password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hash - Hashed password
 * @returns {Promise<boolean>} True if passwords match
 */
export const comparePassword = async (password, hash) => {
  try {
    const match = await bcrypt.compare(password, hash);
    return match;
  } catch (error) {
    logger.error('Failed to compare password', {
      error: error.message,
      stack: error.stack
    });
    throw new Error('Failed to compare password');
  }
};

/**
 * Generate JWT access token (24h expiration)
 * @param {object} user - User object with id and email
 * @returns {string} JWT access token
 */
export const generateAccessToken = (user) => {
  try {
    const payload = {
      sub: user.id,
      email: user.email,
      isAdmin: user.isAdmin || false,
      type: 'access'
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: ACCESS_TOKEN_EXPIRY
    });

    return token;
  } catch (error) {
    logger.error('Failed to generate access token', {
      userId: user.id,
      error: error.message,
      stack: error.stack
    });
    throw new Error('Failed to generate access token');
  }
};

/**
 * Generate JWT refresh token (7d expiration)
 * @param {object} user - User object with id and email
 * @returns {string} JWT refresh token
 */
export const generateRefreshToken = (user) => {
  try {
    const payload = {
      sub: user.id,
      email: user.email,
      type: 'refresh'
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: REFRESH_TOKEN_EXPIRY
    });

    return token;
  } catch (error) {
    logger.error('Failed to generate refresh token', {
      userId: user.id,
      error: error.message,
      stack: error.stack
    });
    throw new Error('Failed to generate refresh token');
  }
};

/**
 * Verify JWT token
 * @param {string} token - JWT token
 * @returns {object} Decoded token payload
 * @throws {Error} If token is invalid or expired
 */
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expired', {
        error: error.message
      });
      throw new Error('Token has expired');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token', {
        error: error.message
      });
      throw new Error('Invalid token');
    } else {
      logger.error('Failed to verify token', {
        error: error.message,
        stack: error.stack
      });
      throw new Error('Failed to verify token');
    }
  }
};

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { valid: boolean, message: string }
 */
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }

  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }

  // Check for at least one number
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }

  return { valid: true, message: 'Password is valid' };
};

/**
 * Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean} True if email is valid
 */
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return false;
  }

  // Basic email regex pattern
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailPattern.test(email);
};

export default {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyToken,
  validatePassword,
  validateEmail
};
