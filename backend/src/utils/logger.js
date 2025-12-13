import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import os from 'os';
import { randomUUID } from 'crypto';

const LOG_DIR = process.env.LOG_DIR || '/var/log/desaas';

// Ensure log directory exists
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (error) {
    console.error('Failed to create log directory:', error.message);
  }
}

// Custom format for structured logging
const structuredFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.metadata({ fillExcept: ['message', 'level', 'timestamp', 'service'] }),
  winston.format.json()
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ timestamp, level, message, metadata }) => {
    let msg = `${timestamp} [${level}] ${message}`;
    if (metadata && Object.keys(metadata).length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }
    return msg;
  })
);

// Create logger instance
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: structuredFormat,
  defaultMeta: {
    service: 'blackbow-api',
    host: os.hostname(),
    port: process.env.PORT || 3450
  },
  transports: [
    // Error log - errors only
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'blackbow-error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),

    // Combined log - all levels
    new DailyRotateFile({
      filename: path.join(LOG_DIR, 'blackbow-combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      zippedArchive: true
    }),

    // Console output (development only)
    ...(process.env.NODE_ENV !== 'production' ? [
      new winston.transports.Console({
        format: consoleFormat
      })
    ] : [])
  ]
});

// Request logging helper with request ID
export const logRequest = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
      requestId: req.id,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  });

  next();
};

/**
 * Structured Event Logging for DeSaaS Compliance
 * Usage: logEvent('auth.login.success', { userId, email, ip })
 */
export const logEvent = (event, data = {}) => {
  logger.info('Security Event', {
    event,                              // e.g., 'auth.login.success'
    eventId: randomUUID(),              // Unique event ID for traceability
    timestamp: new Date().toISOString(),
    ...data
  });
};

/**
 * Log authentication events for compliance
 */
export const logAuthEvent = (eventType, data = {}) => {
  const eventMap = {
    'login_success': 'auth.login.success',
    'login_failed': 'auth.login.failed',
    'logout': 'auth.logout',
    'token_refresh': 'auth.token.refresh',
    'password_change': 'auth.password.change',
    'email_confirmation': 'auth.email.confirmed'
  };
  
  logEvent(eventMap[eventType] || `auth.${eventType}`, {
    ...data,
    status: eventType.includes('success') || eventType.includes('confirmed') ? 'success' : 'failed'
  });
};

/**
 * Log admin actions for compliance
 */
export const logAdminAction = (action, data = {}) => {
  logEvent(`admin.${action}`, {
    ...data,
    status: data.status || 'success'
  });
};

// Telegram notification helper - sends directly to Telegram API
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const TELEGRAM_CHAT_ID = process.env.TELEGRAM_CHAT_ID;

export const notifyTelegram = async (message, level = 'info') => {
  // Skip if Telegram not configured
  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_CHAT_ID) {
    return;
  }

  try {
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '🚨',
      success: '✅'
    }[level] || 'ℹ️';

    const formattedMessage = `${emoji} *BlackBow Associates*\n\n${message}`;

    await axios.post(
      `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`,
      {
        chat_id: TELEGRAM_CHAT_ID,
        text: formattedMessage,
        parse_mode: 'Markdown',
        disable_web_page_preview: true
      },
      { timeout: 10000 }
    );
  } catch (error) {
    // Log locally but don't throw - notifications should never break the app
    logger.warn('Failed to send Telegram notification', {
      error: error.message,
      code: error.response?.data?.error_code
    });
  }
};

export default logger;
