/**
 * useLogger Hook - Production-grade logging for React components
 * Provides structured logging with component context and lifecycle tracking
 */

import { useEffect, useCallback, useRef } from 'react';
import { logger } from '../utils/logger';

export interface ComponentLogger {
  logUserAction: (action: string, data?: Record<string, any>) => void;
  logError: (error: Error | string, context?: Record<string, any>) => void;
  logInfo: (message: string, data?: Record<string, any>) => void;
  logWarning: (message: string, data?: Record<string, any>) => void;
  logDebug: (message: string, data?: Record<string, any>) => void;
  logApiCall: (endpoint: string, method: string, data?: Record<string, any>) => void;
  logApiResponse: (endpoint: string, status: number, duration: number, data?: Record<string, any>) => void;
  logPerformance: (operation: string, duration: number, data?: Record<string, any>) => void;
  startPerformanceTimer: (operation: string) => () => void;
}

export const useLogger = (componentName: string): ComponentLogger => {
  const performanceTimers = useRef<Map<string, number>>(new Map());

  // Log component lifecycle events
  useEffect(() => {
    logger.componentLifecycle(componentName, 'mount', { component: componentName });
    
    return () => {
      logger.componentLifecycle(componentName, 'unmount', { component: componentName });
    };
  }, [componentName]);

  // Create component-specific logging functions
  const logUserAction = useCallback((action: string, data: Record<string, any> = {}) => {
    logger.userAction(action, { 
      component: componentName, 
      action, 
      ...data 
    });
  }, [componentName]);

  const logError = useCallback((error: Error | string, context: Record<string, any> = {}) => {
    const errorMessage = error instanceof Error ? error.message : error;
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    logger.error(`Error in ${componentName}`, { 
      component: componentName, 
      error: errorMessage,
      stack: errorStack,
      ...context 
    });
  }, [componentName]);

  const logInfo = useCallback((message: string, data: Record<string, any> = {}) => {
    logger.info(`${componentName}: ${message}`, { 
      component: componentName, 
      ...data 
    });
  }, [componentName]);

  const logWarning = useCallback((message: string, data: Record<string, any> = {}) => {
    logger.warn(`${componentName}: ${message}`, { 
      component: componentName, 
      ...data 
    });
  }, [componentName]);

  const logDebug = useCallback((message: string, data: Record<string, any> = {}) => {
    logger.debug(`${componentName}: ${message}`, { 
      component: componentName, 
      ...data 
    });
  }, [componentName]);

  const logApiCall = useCallback((endpoint: string, method: string, data: Record<string, any> = {}) => {
    logger.apiCall(endpoint, method, { 
      component: componentName, 
      ...data 
    });
  }, [componentName]);

  const logApiResponse = useCallback((endpoint: string, status: number, duration: number, data: Record<string, any> = {}) => {
    logger.apiResponse(endpoint, status, duration, { 
      component: componentName, 
      ...data 
    });
  }, [componentName]);

  const logPerformance = useCallback((operation: string, duration: number, data: Record<string, any> = {}) => {
    logger.performance(operation, duration, { 
      component: componentName, 
      ...data 
    });
  }, [componentName]);

  const startPerformanceTimer = useCallback((operation: string) => {
    const startTime = performance.now();
    const timerKey = `${componentName}-${operation}-${Date.now()}`;
    performanceTimers.current.set(timerKey, startTime);

    return () => {
      const endTime = performance.now();
      const startTime = performanceTimers.current.get(timerKey);
      if (startTime !== undefined) {
        const duration = endTime - startTime;
        logPerformance(operation, duration);
        performanceTimers.current.delete(timerKey);
      }
    };
  }, [componentName, logPerformance]);

  return {
    logUserAction,
    logError,
    logInfo,
    logWarning,
    logDebug,
    logApiCall,
    logApiResponse,
    logPerformance,
    startPerformanceTimer
  };
}; 