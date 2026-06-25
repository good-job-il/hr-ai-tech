/**
 * Hook for handling errors in components
 * Provides error logging, retry logic, and user feedback
 */

import { useCallback, useRef } from 'react';
import { AppError } from './AppError';
import { ErrorNormalizer } from './errorNormalizer';
import { useErrorLog } from '@/hooks/useErrorLog';

export interface ErrorHandlerOptions {
  onError?: (error: AppError) => void;
  onRetry?: () => Promise<void>;
  retryCount?: number;
  retryDelay?: number;
  logError?: boolean;
  showNotification?: boolean;
}

export function useErrorHandler(options: ErrorHandlerOptions = {}) {
  const {
    onError,
    onRetry,
    retryCount = 3,
    retryDelay = 1000,
    logError = true,
    showNotification = true,
  } = options;

  const { logError: logErrorToService } = useErrorLog();
  const retries = useRef<number>(0);

  const handle = useCallback(
    async (error: unknown, context?: { action?: string; component?: string }) => {
      // Normalize error
      const normalizedError = ErrorNormalizer.normalize(error);

      // Log error
      if (logError) {
        logErrorToService({
          error: normalizedError,
          context,
        });
      }

      // Call custom handler
      if (onError) {
        onError(normalizedError);
      }

      // Check if should logout
      if (ErrorNormalizer.shouldLogout(normalizedError)) {
        // TODO: trigger logout
        console.log('Should logout');
      }

      // Show notification if enabled
      if (showNotification) {
        const message = ErrorNormalizer.getMessage(normalizedError);
        // TODO: show toast
        console.log('Error notification:', message);
      }

      return normalizedError;
    },
    [onError, logError, showNotification, logErrorToService]
  );

  const retry = useCallback(
    async (fn: () => Promise<void>, errorToHandle?: unknown) => {
      if (!onRetry && !fn) {
        throw new Error('Either onRetry or fn must be provided');
      }

      const maxRetries = retryCount;
      retries.current = 0;

      const attemptRetry = async (): Promise<void> => {
        try {
          if (fn) {
            await fn();
          } else if (onRetry) {
            await onRetry();
          }
          retries.current = 0; // Reset on success
        } catch (error) {
          retries.current++;

          if (retries.current < maxRetries) {
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, retryDelay * retries.current));
            return attemptRetry();
          } else {
            // Max retries reached
            throw error;
          }
        }
      };

      try {
        await attemptRetry();
      } catch (error) {
        const normalizedError = await handle(error, { action: 'retry' });
        throw normalizedError;
      }
    },
    [onRetry, retryCount, retryDelay, handle]
  );

  const isRetryable = useCallback((error: unknown): boolean => {
    const normalizedError = ErrorNormalizer.normalize(error);
    return ErrorNormalizer.isRetryable(normalizedError);
  }, []);

  return {
    handle,
    retry,
    isRetryable,
    retries: retries.current,
  };
}