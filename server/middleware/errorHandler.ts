/**
 * Consistent Error Handling Middleware
 * Provides standardized error responses across all API endpoints
 */

import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public readonly errorCode: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    errorCode: string = 'INTERNAL_ERROR',
    isOperational: boolean = true,
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.errorCode = errorCode;
    this.details = details;

    Object.setPrototypeOf(this, AppError.prototype);
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: any) {
    super(message, 400, 'VALIDATION_ERROR', true, details);
  }
}

export class AuthenticationError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR', true);
  }
}

export class AuthorizationError extends AppError {
  constructor(message: string = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR', true);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND', true);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409, 'CONFLICT_ERROR', true);
  }
}

export class RateLimitError extends AppError {
  constructor(retryAfter?: number) {
    super('Rate limit exceeded', 429, 'RATE_LIMIT_ERROR', true, { retryAfter });
  }
}

export class ExternalServiceError extends AppError {
  constructor(service: string, originalError?: Error) {
    super(
      `External service error: ${service}`,
      502,
      'EXTERNAL_SERVICE_ERROR',
      true,
      { service, originalMessage: originalError?.message }
    );
  }
}

// Error response interface
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
    requestId: string;
    timestamp: string;
  };
}

/**
 * Format error for response
 */
function formatError(
  error: Error | AppError,
  requestId: string,
  isDevelopment: boolean
): ErrorResponse {
  const timestamp = new Date().toISOString();

  if (error instanceof AppError) {
    return {
      success: false,
      error: {
        code: error.errorCode,
        message: error.message,
        details: isDevelopment ? error.details : undefined,
        requestId,
        timestamp,
      },
    };
  }

  if (error instanceof ZodError) {
    return {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        details: isDevelopment
          ? error.errors.map((e) => ({
              field: e.path.join('.'),
              message: e.message,
            }))
          : undefined,
        requestId,
        timestamp,
      },
    };
  }

  // Generic error
  return {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isDevelopment ? error.message : 'An unexpected error occurred',
      details: isDevelopment ? { stack: error.stack } : undefined,
      requestId,
      timestamp,
    },
  };
}

/**
 * Async error wrapper for route handlers
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Request ID middleware - adds unique ID to each request
 */
export function requestIdMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = req.headers['x-request-id'] as string || uuidv4();
  (req as any).requestId = requestId;
  res.setHeader('X-Request-ID', requestId);
  next();
}

/**
 * Not found handler - for undefined routes
 */
export function notFoundHandler(req: Request, res: Response, next: NextFunction) {
  next(new NotFoundError(`Route ${req.method} ${req.path}`));
}

/**
 * Global error handler middleware
 */
export function globalErrorHandler(
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const isDevelopment = process.env.NODE_ENV === 'development';
  const requestId = (req as any).requestId || uuidv4();

  // Log error
  const logData = {
    requestId,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: (req as any).user?.id,
    error: {
      name: error.name,
      message: error.message,
      stack: isDevelopment ? error.stack : undefined,
    },
  };

  if (error instanceof AppError && error.isOperational) {
    console.warn('[OPERATIONAL ERROR]', JSON.stringify(logData));
  } else {
    console.error('[UNHANDLED ERROR]', JSON.stringify(logData));
  }

  // Determine status code
  let statusCode = 500;
  if (error instanceof AppError) {
    statusCode = error.statusCode;
  } else if ((error as any).statusCode) {
    statusCode = (error as any).statusCode;
  } else if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
  }

  // Format and send response
  const errorResponse = formatError(error, requestId, isDevelopment);
  res.status(statusCode).json(errorResponse);
}

/**
 * Unhandled rejection handler
 */
export function setupUnhandledRejectionHandler() {
  process.on('unhandledRejection', (reason: any) => {
    console.error('[UNHANDLED REJECTION]', {
      timestamp: new Date().toISOString(),
      reason: reason?.message || reason,
      stack: reason?.stack,
    });
  });

  process.on('uncaughtException', (error: Error) => {
    console.error('[UNCAUGHT EXCEPTION]', {
      timestamp: new Date().toISOString(),
      error: error.message,
      stack: error.stack,
    });
    // Give time for logging before exit
    setTimeout(() => process.exit(1), 1000);
  });
}

export default {
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError,
  ExternalServiceError,
  asyncHandler,
  requestIdMiddleware,
  notFoundHandler,
  globalErrorHandler,
  setupUnhandledRejectionHandler,
};
