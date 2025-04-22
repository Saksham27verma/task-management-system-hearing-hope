/**
 * Global Error Handler for API Routes
 * 
 * This module provides utilities for consistent error handling across API routes
 * and integration with Sentry for error tracking.
 */

import { NextRequest, NextResponse } from 'next/server';
import * as Sentry from '@sentry/nextjs';

/**
 * Error types for consistent error codes and messages
 */
export const ErrorTypes = {
  BAD_REQUEST: { status: 400, code: 'BAD_REQUEST', message: 'Bad request' },
  UNAUTHORIZED: { status: 401, code: 'UNAUTHORIZED', message: 'Unauthorized' },
  FORBIDDEN: { status: 403, code: 'FORBIDDEN', message: 'Forbidden' },
  NOT_FOUND: { status: 404, code: 'NOT_FOUND', message: 'Resource not found' },
  VALIDATION_ERROR: { status: 422, code: 'VALIDATION_ERROR', message: 'Validation error' },
  INTERNAL_ERROR: { status: 500, code: 'INTERNAL_ERROR', message: 'Internal server error' },
  SERVICE_UNAVAILABLE: { status: 503, code: 'SERVICE_UNAVAILABLE', message: 'Service unavailable' },
};

/**
 * API Error class with standard structure
 */
export class ApiError extends Error {
  status: number;
  code: string;
  details?: any;

  constructor({ status, code, message }: { status: number; code: string; message: string }, details?: any) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.details = details;
  }

  static badRequest(message?: string, details?: any) {
    return new ApiError({ ...ErrorTypes.BAD_REQUEST, message: message || ErrorTypes.BAD_REQUEST.message }, details);
  }

  static unauthorized(message?: string, details?: any) {
    return new ApiError({ ...ErrorTypes.UNAUTHORIZED, message: message || ErrorTypes.UNAUTHORIZED.message }, details);
  }

  static forbidden(message?: string, details?: any) {
    return new ApiError({ ...ErrorTypes.FORBIDDEN, message: message || ErrorTypes.FORBIDDEN.message }, details);
  }

  static notFound(message?: string, details?: any) {
    return new ApiError({ ...ErrorTypes.NOT_FOUND, message: message || ErrorTypes.NOT_FOUND.message }, details);
  }

  static validationError(message?: string, details?: any) {
    return new ApiError({ ...ErrorTypes.VALIDATION_ERROR, message: message || ErrorTypes.VALIDATION_ERROR.message }, details);
  }

  static internalError(message?: string, details?: any) {
    return new ApiError({ ...ErrorTypes.INTERNAL_ERROR, message: message || ErrorTypes.INTERNAL_ERROR.message }, details);
  }

  static serviceUnavailable(message?: string, details?: any) {
    return new ApiError({ ...ErrorTypes.SERVICE_UNAVAILABLE, message: message || ErrorTypes.SERVICE_UNAVAILABLE.message }, details);
  }
}

/**
 * Handle API errors with Sentry integration
 * 
 * @param error The error to handle
 * @param request Optional NextRequest for context
 * @returns A formatted NextResponse with appropriate status code
 */
export function handleApiError(error: unknown, request?: NextRequest): NextResponse {
  console.error('API Error:', error);
  
  // Default to internal server error
  let apiError = ErrorTypes.INTERNAL_ERROR;
  let details = undefined;
  
  // Process known error types
  if (error instanceof ApiError) {
    apiError = {
      status: error.status,
      code: error.code,
      message: error.message
    };
    details = error.details;
    
    // Only log 5xx errors to Sentry (client errors aren't as important)
    if (error.status >= 500) {
      Sentry.captureException(error);
    }
  } else if (error instanceof Error) {
    // For standard errors, capture in Sentry
    apiError = {
      ...ErrorTypes.INTERNAL_ERROR,
      message: process.env.NODE_ENV === 'development' ? error.message : ErrorTypes.INTERNAL_ERROR.message
    };
    Sentry.captureException(error);
    
    // Add request info for better context
    if (request) {
      Sentry.setContext("request", {
        url: request.url,
        method: request.method,
        headers: Object.fromEntries(request.headers.entries())
      });
    }
  }
  
  // Return formatted response
  return NextResponse.json(
    { 
      success: false, 
      error: apiError.code,
      message: apiError.message,
      ...(details && process.env.NODE_ENV === 'development' ? { details } : {})
    },
    { status: apiError.status }
  );
}

/**
 * API Route wrapper for consistent error handling
 */
export function withErrorHandling(
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    try {
      return await handler(request);
    } catch (error) {
      return handleApiError(error, request);
    }
  };
} 