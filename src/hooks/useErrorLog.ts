/**
 * Hook for error logging
 * Sends errors to backend for tracking and monitoring
 */

import { useCallback } from 'react';
import { AppError } from '@/lib/errors/AppError';

interface ErrorLogPayload {
  error: AppError;
  context?: {
    action?: string;
    component?: string;
    path?: string;
    userId?: string;
  };
  userAgent?: string;
  timestamp?: string;
}

export function useErrorLog() {
  const logError = useCallback(async (payload: ErrorLogPayload) => {
    try {
      // Don't log in development for now
      if (process.env.NODE_ENV === 'development') {
        console.error('[ErrorLog]', payload.error.toJSON());
        return;
      }

      // TODO: Send to logging service
      // await api.post('/logs/errors', {
      //   ...payload.error.toJSON(),
      //   context: payload.context,
      //   userAgent: navigator.userAgent,
      //   timestamp: new Date().toISOString(),
      // });
    } catch (err) {
      // Silently fail - don't let logging break the app
      console.error('Failed to log error:', err);
    }
  }, []);

  return { logError };
}