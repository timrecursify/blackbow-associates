import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import fs from 'fs';
import axios from 'axios';
import os from 'os';

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

// Request logging helper
export const logRequest = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('HTTP Request', {
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

// Telegram notification helper
export const notifyTelegram = async (message, level = 'info') => {
  try {
    const emoji = {
      info: 'ℹ️',
      warn: '⚠️',
      error: '🚨',
      success: '✅'
    }[level] || 'ℹ️';

    await axios.post('http://localhost:3400/notify', {
      message: `${emoji} **BlackBow API**\n${message}`,
      level,
      service: 'blackbow-api'
    }, { timeout: 5000 });
  } catch (error) {
    logger.warn('Failed to send Telegram notification', { error: error.message });
  }
};

export default logger;
