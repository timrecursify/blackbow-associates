/**
 * Production-grade Logger Utility for React Vite Projects
 * Implements structured logging with environment-appropriate configuration
 */

export type LogLevel = "debug" | "info" | "warn" | "error";

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  environment: string;
  component: string;
  userId?: string;
  sessionId?: string;
  requestId?: string;
  [key: string]: any;
}

class Logger {
  private levels: LogLevel[] = ["debug", "info", "warn", "error"];
  private currentLevel: LogLevel;
  private sessionId: string;

  constructor() {
    this.currentLevel = import.meta.env.PROD ? "warn" : "debug";
    this.sessionId = this.generateSessionId();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private shouldLog(level: LogLevel): boolean {
    return this.levels.indexOf(level) >= this.levels.indexOf(this.currentLevel);
  }

  private formatLogEntry(level: LogLevel, message: string, data: Record<string, any> = {}): LogEntry {
    return {
      timestamp: new Date().toISOString(),
      level,
      message,
      environment: import.meta.env.MODE || 'unknown',
      component: data.component || 'unknown',
      sessionId: this.sessionId,
      userId: data.userId,
      requestId: data.requestId,
      ...data
    };
  }

  private async sendToExternalService(logEntry: LogEntry): Promise<void> {
    try {
      // In production, send to external logging services
      if (import.meta.env.VITE_SENTRY_DSN && logEntry.level === 'error') {
        // Send to Sentry for error tracking
        this.sendToSentry(logEntry);
      }

      if (import.meta.env.VITE_LOGROCKET_APP_ID) {
        // Send to LogRocket for session replay
        this.sendToLogRocket(logEntry);
      }

      // Send to custom logging endpoint if configured
      if (import.meta.env.VITE_LOGGING_ENDPOINT) {
        await fetch(import.meta.env.VITE_LOGGING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(logEntry),
        });
      }
    } catch (error) {
      // Fail silently to prevent logging from breaking the application
      console.warn('Failed to send log to external service:', error);
    }
  }

  private sendToSentry(logEntry: LogEntry): void {
    // Sentry integration would go here
    // For now, just console log in development
    if (import.meta.env.DEV) {
      console.warn('Sentry not configured for:', logEntry);
    }
  }

  private sendToLogRocket(logEntry: LogEntry): void {
    // LogRocket integration would go here
    // For now, just console log in development
    if (import.meta.env.DEV) {
      console.info('LogRocket not configured for:', logEntry);
    }
  }

  log(level: LogLevel, message: string, data: Record<string, any> = {}): void {
    if (!this.shouldLog(level)) {
      return;
    }

    const logEntry = this.formatLogEntry(level, message, data);
    
    // Console output with proper formatting
    const consoleMethod = level === 'debug' ? 'debug' : 
                         level === 'info' ? 'info' : 
                         level === 'warn' ? 'warn' : 'error';
    
    console[consoleMethod](
      `[${level.toUpperCase()}] ${logEntry.timestamp}:`,
      message,
      data
    );

    // Send to external services in production
    if (import.meta.env.PROD) {
      this.sendToExternalService(logEntry);
    }
  }

  debug(message: string, data?: Record<string, any>): void {
    this.log('debug', message, data);
  }

  info(message: string, data?: Record<string, any>): void {
    this.log('info', message, data);
  }

  warn(message: string, data?: Record<string, any>): void {
    this.log('warn', message, data);
  }

  error(message: string, data?: Record<string, any>): void {
    this.log('error', message, data);
  }

  // Specialized logging methods
  apiCall(endpoint: string, method: string, data?: Record<string, any>): void {
    this.info(`API Call: ${method} ${endpoint}`, {
      type: 'api_call',
      endpoint,
      method,
      ...data
    });
  }

  apiResponse(endpoint: string, status: number, duration: number, data?: Record<string, any>): void {
    const level = status >= 400 ? 'error' : status >= 300 ? 'warn' : 'info';
    this.log(level, `API Response: ${status} ${endpoint}`, {
      type: 'api_response',
      endpoint,
      status,
      duration,
      ...data
    });
  }

  userAction(action: string, data?: Record<string, any>): void {
    this.info(`User Action: ${action}`, {
      type: 'user_action',
      action,
      ...data
    });
  }

  componentLifecycle(component: string, event: 'mount' | 'unmount', data?: Record<string, any>): void {
    this.debug(`Component ${event}: ${component}`, {
      type: 'component_lifecycle',
      component,
      event,
      ...data
    });
  }

  performance(operation: string, duration: number, data?: Record<string, any>): void {
    this.info(`Performance: ${operation} took ${duration}ms`, {
      type: 'performance',
      operation,
      duration,
      ...data
    });
  }
}

// Export singleton instance
export const logger = new Logger();

// Export Logger class for testing
export { Logger }; 