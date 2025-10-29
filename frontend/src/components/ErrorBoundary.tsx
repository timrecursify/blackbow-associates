/**
 * Production-grade Error Boundary with comprehensive logging
 * Catches React errors and provides graceful fallback UI
 */

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  componentName?: string;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const componentName = this.props.componentName || 'Unknown';
    const errorId = this.state.errorId || 'unknown';

    // Log comprehensive error information
    logger.error('React Error Boundary Caught Error', {
      component: componentName,
      errorId,
      error: error.message,
      stack: error.stack,
      name: error.name,
      componentStack: errorInfo.componentStack,
      errorBoundary: true,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      userId: this.getUserId(),
      sessionId: this.getSessionId(),
    });

    // Update state with error info
    this.setState({
      errorInfo,
    });

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // Send to external error tracking services
    this.reportToExternalServices(error, errorInfo, componentName, errorId);
  }

  private getUserId(): string | undefined {
    // Try to get user ID from various sources
    try {
      return localStorage.getItem('userId') || 
             sessionStorage.getItem('userId') || 
             undefined;
    } catch {
      return undefined;
    }
  }

  private getSessionId(): string | undefined {
    try {
      return sessionStorage.getItem('sessionId') || undefined;
    } catch {
      return undefined;
    }
  }

  private reportToExternalServices(error: Error, errorInfo: ErrorInfo, componentName: string, errorId: string) {
    // Report to Sentry if configured
    if (import.meta.env.VITE_SENTRY_DSN) {
      this.reportToSentry(error, errorInfo, componentName, errorId);
    }

    // Report to LogRocket if configured
    if (import.meta.env.VITE_LOGROCKET_APP_ID) {
      this.reportToLogRocket(error, errorInfo, componentName, errorId);
    }

    // Report to custom error endpoint if configured
    if (import.meta.env.VITE_ERROR_REPORTING_ENDPOINT) {
      this.reportToCustomEndpoint(error, errorInfo, componentName, errorId);
    }
  }

  private reportToSentry(error: Error, errorInfo: ErrorInfo, componentName: string, errorId: string) {
    try {
      // Sentry integration would go here
      // For now, we'll prepare the data structure
      const sentryData = {
        error,
        errorInfo,
        componentName,
        errorId,
        environment: import.meta.env.MODE,
        tags: {
          component: componentName,
          errorBoundary: true,
        },
        extra: {
          componentStack: errorInfo.componentStack,
          errorId,
        },
      };

      logger.debug('Prepared Sentry error report', { sentryData });
    } catch (reportError) {
      logger.warn('Failed to report to Sentry', { error: reportError });
    }
  }

  private reportToLogRocket(error: Error, errorInfo: ErrorInfo, componentName: string, errorId: string) {
    try {
      // LogRocket integration would go here
      const logRocketData = {
        error: error.message,
        stack: error.stack,
        componentStack: errorInfo.componentStack,
        componentName,
        errorId,
      };

      logger.debug('Prepared LogRocket error report', { logRocketData });
    } catch (reportError) {
      logger.warn('Failed to report to LogRocket', { error: reportError });
    }
  }

  private async reportToCustomEndpoint(error: Error, errorInfo: ErrorInfo, componentName: string, errorId: string) {
    try {
      const payload = {
        errorId,
        error: {
          message: error.message,
          stack: error.stack,
          name: error.name,
        },
        componentStack: errorInfo.componentStack,
        componentName,
        environment: import.meta.env.MODE,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        userId: this.getUserId(),
        sessionId: this.getSessionId(),
      };

      await fetch(import.meta.env.VITE_ERROR_REPORTING_ENDPOINT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      logger.debug('Reported error to custom endpoint', { errorId });
    } catch (reportError) {
      logger.warn('Failed to report to custom endpoint', { error: reportError });
    }
  }

  private handleRetry = () => {
    logger.info('User attempting error recovery', {
      component: this.props.componentName || 'Unknown',
      errorId: this.state.errorId,
    });

    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
    });
  };

  private handleReload = () => {
    logger.info('User reloading page after error', {
      component: this.props.componentName || 'Unknown',
      errorId: this.state.errorId,
    });

    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg
                  className="h-8 w-8 text-red-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-lg font-medium text-gray-900">
                  Something went wrong
                </h3>
              </div>
            </div>
            
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                We're sorry, but something unexpected happened. Our team has been notified and is working on a fix.
              </p>
              
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4">
                  <summary className="text-sm font-medium text-gray-700 cursor-pointer">
                    Error Details (Development Only)
                  </summary>
                  <div className="mt-2 p-3 bg-gray-100 rounded text-xs font-mono text-gray-800 overflow-auto max-h-40">
                    <div className="mb-2">
                      <strong>Error ID:</strong> {this.state.errorId}
                    </div>
                    <div className="mb-2">
                      <strong>Message:</strong> {this.state.error.message}
                    </div>
                    <div>
                      <strong>Stack:</strong>
                      <pre className="whitespace-pre-wrap">{this.state.error.stack}</pre>
                    </div>
                  </div>
                </details>
              )}
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-black text-white px-4 py-2 rounded text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 bg-gray-200 text-gray-900 px-4 py-2 rounded text-sm font-medium hover:bg-gray-300 transition-colors"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
} 