import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed') {
    super(message, 400);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized') {
    super(message, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden') {
    super(message, 403);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource already exists') {
    super(message, 409);
  }
}

// Global error handler middleware
export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      message: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // JWT TokenExpiredError
  if (err.name === 'TokenExpiredError') {
    const response: ApiResponse = {
      success: false,
      message: 'Token has expired',
    };
    res.status(401).json(response);
    return;
  }

  // JWT JsonWebTokenError (invalid token, malformed, etc.)
  if (err.name === 'JsonWebTokenError') {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid token',
    };
    res.status(401).json(response);
    return;
  }

  // JSON SyntaxError (malformed JSON in request body)
  if (err instanceof SyntaxError && (err as any).status === 400 && 'body' in err) {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid JSON',
    };
    res.status(400).json(response);
    return;
  }

  // Mongoose CastError (invalid ObjectId format)
  if (err.name === 'CastError') {
    const response: ApiResponse = {
      success: false,
      message: 'Invalid ID format',
    };
    res.status(400).json(response);
    return;
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const response: ApiResponse = {
      success: false,
      message: 'Validation failed',
      errors: Object.values((err as any).errors).map((e: any) => e.message),
    };
    res.status(400).json(response);
    return;
  }

  // Mongoose duplicate key error
  if ((err as any).code === 11000) {
    const response: ApiResponse = {
      success: false,
      message: 'Duplicate entry found',
    };
    res.status(409).json(response);
    return;
  }

  // Unknown error
  console.error('❌ Unhandled error:', err);
  const response: ApiResponse = {
    success: false,
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'Internal server error',
  };
  res.status(500).json(response);
};
