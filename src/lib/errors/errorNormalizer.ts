/**
 * Normalize errors from various sources
 * Converts API errors, network errors, validation errors, etc. to AppError
 */

import { AppError, ErrorCode } from './AppError';
import { AxiosError } from 'axios';

export interface NormalizedError {
  code: ErrorCode;
  message: string;
  statusCode: number;
  field?: string;
  details?: Record<string, any>;
  isRetryable: boolean;
  shouldLogout?: boolean;
}

export class ErrorNormalizer {
  /**
   * Normalize any error to AppError
   */
  static normalize(error: unknown, requestId?: string): AppError {
    // Already an AppError
    if (error instanceof AppError) {
      return error;
    }

    // Axios error (API response)
    if (this.isAxiosError(error)) {
      return this.normalizeAxiosError(error, requestId);
    }

    // Network error
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return AppError.offline('Network request failed', { requestId, originalError: error });
    }

    // Timeout
    if (error instanceof DOMException && error.name === 'AbortError') {
      return AppError.timeout('Request timeout', { requestId, originalError: error });
    }

    // Generic error
    if (error instanceof Error) {
      return new AppError(
        error.message,
        ErrorCode.UNKNOWN,
        500,
        { originalError: error, requestId }
      );
    }

    // Unknown error
    return new AppError(
      'An unexpected error occurred',
      ErrorCode.UNKNOWN,
      500,
      { originalError: error, requestId }
    );
  }

  /**
   * Normalize Axios/HTTP errors
   */
  private static normalizeAxiosError(error: any, requestId?: string): AppError {
    const status = error.response?.status;
    const data = error.response?.data;

    // Server returned error response
    if (data?.error) {
      return new AppError(
        data.error.message || 'Server error',
        (data.error.code as ErrorCode) || ErrorCode.SERVER_ERROR,
        status || 500,
        {
          field: data.error.field,
          details: data.error.details,
          originalError: error,
          requestId,
        }
      );
    }

    // Map HTTP status to error code
    switch (status) {
      case 400:
        return new AppError(
          data?.message || 'Invalid request',
          ErrorCode.VALIDATION_ERROR,
          400,
          {
            details: data?.details,
            originalError: error,
            requestId,
          }
        );

      case 401:
        return AppError.unauthorized('Session expired or invalid', {
          originalError: error,
          requestId,
        });

      case 403:
        return AppError.forbidden('You do not have permission', {
          originalError: error,
          requestId,
        });

      case 404:
        return AppError.notFound('Resource not found', {
          originalError: error,
          requestId,
        });

      case 409:
        return AppError.conflict(data?.message || 'Resource already exists', {
          details: data?.details || data,
          originalError: error,
          requestId,
        });

      case 429:
        return AppError.rateLimited(
          data?.message || 'Too many requests',
          { originalError: error, requestId }
        );

      case 500:
      case 502:
      case 503:
      case 504:
        return AppError.server(
          data?.message || 'Server error',
          { originalError: error, requestId }
        );

      default:
        return new AppError(
          data?.message || error.message || 'Request failed',
          ErrorCode.UNKNOWN,
          status || 500,
          { originalError: error, requestId }
        );
    }
  }

  /**
   * Check if error is retryable
   */
  static isRetryable(error: AppError): boolean {
    const retryableCodes = [
      ErrorCode.TIMEOUT,
      ErrorCode.OFFLINE,
      ErrorCode.RATE_LIMITED,
      ErrorCode.CONNECTION_LOST,
      ErrorCode.AI_UNAVAILABLE,
      ErrorCode.AI_RATE_LIMITED,
    ];

    // Also retry on 5xx server errors
    return retryableCodes.includes(error.code) || error.statusCode >= 500;
  }

  /**
   * Check if error requires logout
   */
  static shouldLogout(error: AppError): boolean {
    return (
      error.code === ErrorCode.UNAUTHORIZED ||
      error.code === ErrorCode.SESSION_EXPIRED ||
      error.code === ErrorCode.INVALID_TOKEN
    );
  }

  /**
   * Get user-friendly error message
   */
  static getMessage(error: AppError): string {
    const messages: Record<ErrorCode, string> = {
      [ErrorCode.UNAUTHORIZED]: 'Please log in again',
      [ErrorCode.FORBIDDEN]: 'You do not have permission to do this',
      [ErrorCode.SESSION_EXPIRED]: 'Your session has expired',
      [ErrorCode.INVALID_TOKEN]: 'Invalid authentication token',
      [ErrorCode.VALIDATION_ERROR]: 'Please check your input',
      [ErrorCode.REQUIRED_FIELD]: 'This field is required',
      [ErrorCode.INVALID_FORMAT]: 'Invalid format',
      [ErrorCode.NOT_FOUND]: 'Resource not found',
      [ErrorCode.RESOURCE_NOT_FOUND]: 'The requested resource does not exist',
      [ErrorCode.CONFLICT]: 'Resource already exists',
      [ErrorCode.DUPLICATE]: 'This resource already exists',
      [ErrorCode.ALREADY_EXISTS]: 'Resource already exists',
      [ErrorCode.INTERNAL_ERROR]: 'An error occurred. Please try again',
      [ErrorCode.SERVER_ERROR]: 'Server error. Please try again later',
      [ErrorCode.UNHANDLED_ERROR]: 'An unexpected error occurred',
      [ErrorCode.NETWORK_ERROR]: 'Network connection failed',
      [ErrorCode.TIMEOUT]: 'Request took too long. Please try again',
      [ErrorCode.OFFLINE]: 'No internet connection',
      [ErrorCode.CONNECTION_LOST]: 'Connection lost. Please check your internet',
      [ErrorCode.RATE_LIMITED]: 'Too many requests. Please wait a moment',
      [ErrorCode.TOO_MANY_REQUESTS]: 'Too many requests. Please try again later',
      [ErrorCode.PAYMENT_FAILED]: 'Payment failed. Please try again',
      [ErrorCode.INSUFFICIENT_CREDITS]: 'Insufficient credits. Please add more',
      [ErrorCode.AI_ERROR]: 'AI service error. Please try again',
      [ErrorCode.AI_UNAVAILABLE]: 'AI service is temporarily unavailable',
      [ErrorCode.AI_RATE_LIMITED]: 'AI rate limited. Please try again later',
      [ErrorCode.UNKNOWN]: 'An unexpected error occurred',
    };

    return error.message || messages[error.code] || 'An error occurred';
  }

  private static isAxiosError(error: any): error is AxiosError {
    return error && error.isAxiosError === true;
  }
}

/**
 * Functional convenience wrapper around `ErrorNormalizer.normalize`, used by
 * `httpClient` and other consumers that just need a normalized `AppError`.
 */
export function normalizeError(error: unknown, requestId?: string): AppError {
  return ErrorNormalizer.normalize(error, requestId);
}
