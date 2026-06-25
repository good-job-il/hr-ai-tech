/**
 * Base application error class
 * All errors in the system inherit from this
 */

export enum ErrorCode {
  // Auth errors
  UNAUTHORIZED = 'UNAUTHORIZED',
  FORBIDDEN = 'FORBIDDEN',
  SESSION_EXPIRED = 'SESSION_EXPIRED',
  INVALID_TOKEN = 'INVALID_TOKEN',

  // Validation errors
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  REQUIRED_FIELD = 'REQUIRED_FIELD',
  INVALID_FORMAT = 'INVALID_FORMAT',

  // Not found
  NOT_FOUND = 'NOT_FOUND',
  RESOURCE_NOT_FOUND = 'RESOURCE_NOT_FOUND',

  // Conflict
  CONFLICT = 'CONFLICT',
  DUPLICATE = 'DUPLICATE',
  ALREADY_EXISTS = 'ALREADY_EXISTS',

  // Server errors
  INTERNAL_ERROR = 'INTERNAL_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNHANDLED_ERROR = 'UNHANDLED_ERROR',

  // Network errors
  NETWORK_ERROR = 'NETWORK_ERROR',
  TIMEOUT = 'TIMEOUT',
  OFFLINE = 'OFFLINE',
  CONNECTION_LOST = 'CONNECTION_LOST',

  // Rate limiting
  RATE_LIMITED = 'RATE_LIMITED',
  TOO_MANY_REQUESTS = 'TOO_MANY_REQUESTS',

  // Payment/Billing
  PAYMENT_FAILED = 'PAYMENT_FAILED',
  INSUFFICIENT_CREDITS = 'INSUFFICIENT_CREDITS',

  // AI errors
  AI_ERROR = 'AI_ERROR',
  AI_UNAVAILABLE = 'AI_UNAVAILABLE',
  AI_RATE_LIMITED = 'AI_RATE_LIMITED',

  // Generic
  UNKNOWN = 'UNKNOWN',
}

export interface ErrorContext {
  code: ErrorCode;
  message: string;
  statusCode?: number;
  field?: string;
  details?: Record<string, any>;
  originalError?: Error | unknown;
  timestamp: string;
  requestId?: string;
  userId?: string;
  path?: string;
  method?: string;
}

export class AppError extends Error {
  public code: ErrorCode;
  public statusCode: number;
  public field?: string;
  public details?: Record<string, any>;
  public originalError?: Error | unknown;
  public timestamp: string;
  public requestId?: string;
  public userId?: string;
  public path?: string;
  public method?: string;

  constructor(
    message: string,
    code: ErrorCode = ErrorCode.UNKNOWN,
    statusCode: number = 500,
    context?: Partial<ErrorContext>
  ) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.statusCode = statusCode;
    this.timestamp = new Date().toISOString();
    this.field = context?.field;
    this.details = context?.details;
    this.originalError = context?.originalError;
    this.requestId = context?.requestId;
    this.userId = context?.userId;
    this.path = context?.path;
    this.method = context?.method;

    // Maintain proper stack trace
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON(): ErrorContext {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      field: this.field,
      details: this.details,
      timestamp: this.timestamp,
      requestId: this.requestId,
      userId: this.userId,
      path: this.path,
      method: this.method,
    };
  }

  static unauthorized(message?: string, context?: Partial<ErrorContext>) {
    return new AppError(
      message || 'Authentication required',
      ErrorCode.UNAUTHORIZED,
      401,
      context
    );
  }

  static forbidden(message?: string, context?: Partial<ErrorContext>) {
    return new AppError(
      message || 'Access denied',
      ErrorCode.FORBIDDEN,
      403,
      context
    );
  }

  static notFound(resource?: string, context?: Partial<ErrorContext>) {
    return new AppError(
      `${resource || 'Resource'} not found`,
      ErrorCode.NOT_FOUND,
      404,
      context
    );
  }

  static validation(field?: string, message?: string, context?: Partial<ErrorContext>) {
    return new AppError(
      message || `Invalid ${field || 'value'}`,
      ErrorCode.VALIDATION_ERROR,
      400,
      { ...context, field }
    );
  }

  static conflict(message?: string, context?: Partial<ErrorContext>) {
    return new AppError(
      message || 'Resource already exists',
      ErrorCode.CONFLICT,
      409,
      context
    );
  }

  static timeout(message?: string, context?: Partial<ErrorContext>) {
    return new AppError(
      message || 'Request timeout',
      ErrorCode.TIMEOUT,
      408,
      context
    );
  }

  static offline(message?: string, context?: Partial<ErrorContext>) {
    return new AppError(
      message || 'No internet connection',
      ErrorCode.OFFLINE,
      0,
      context
    );
  }

  static server(message?: string, context?: Partial<ErrorContext>) {
    return new AppError(
      message || 'Internal server error',
      ErrorCode.SERVER_ERROR,
      500,
      context
    );
  }

  static rateLimited(message?: string, context?: Partial<ErrorContext>) {
    return new AppError(
      message || 'Too many requests. Please try again later.',
      ErrorCode.RATE_LIMITED,
      429,
      context
    );
  }
}