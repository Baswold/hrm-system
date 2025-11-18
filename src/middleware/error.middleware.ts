import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import logger from '../config/logger';
import { sendError, sendNotFound } from '../utils/response';
import { HTTP_STATUS } from '../config/constants';

/**
 * Custom error class
 */
export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number = HTTP_STATUS.INTERNAL_SERVER_ERROR) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Handle 404 errors for undefined routes
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  logger.warn(`Route not found: ${req.method} ${req.originalUrl}`);
  sendNotFound(res, `Route ${req.originalUrl} not found`);
};

/**
 * Global error handler
 */
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Log error
  logger.error('Error occurred:', {
    message: err.message,
    stack: err.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    user: req.user?.email,
  });

  // Default error
  let statusCode = HTTP_STATUS.INTERNAL_SERVER_ERROR;
  let message = 'An unexpected error occurred';

  // Handle specific error types
  if (err instanceof AppError) {
    // Custom application errors
    statusCode = err.statusCode;
    message = err.message;
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    // Prisma errors
    ({ statusCode, message } = handlePrismaError(err));
  } else if (err instanceof Prisma.PrismaClientValidationError) {
    // Prisma validation errors
    statusCode = HTTP_STATUS.BAD_REQUEST;
    message = 'Invalid data provided';
  } else if (err.name === 'ValidationError') {
    // Validation errors (e.g., from Joi or Zod)
    statusCode = HTTP_STATUS.UNPROCESSABLE_ENTITY;
    message = err.message;
  } else if (err.name === 'JsonWebTokenError') {
    // JWT errors
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Invalid token';
  } else if (err.name === 'TokenExpiredError') {
    // JWT expired
    statusCode = HTTP_STATUS.UNAUTHORIZED;
    message = 'Token expired';
  } else if (err.message) {
    // Generic errors with message
    message = err.message;
  }

  // Send error response
  sendError(res, message, statusCode, process.env.NODE_ENV === 'development' ? [err.stack] : undefined);
};

/**
 * Handle Prisma-specific errors
 */
const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError
): { statusCode: number; message: string } => {
  switch (error.code) {
    case 'P2002':
      // Unique constraint violation
      const field = (error.meta?.target as string[])?.join(', ') || 'field';
      return {
        statusCode: HTTP_STATUS.CONFLICT,
        message: `A record with this ${field} already exists`,
      };

    case 'P2025':
      // Record not found
      return {
        statusCode: HTTP_STATUS.NOT_FOUND,
        message: 'Record not found',
      };

    case 'P2003':
      // Foreign key constraint violation
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Invalid reference to related record',
      };

    case 'P2014':
      // Required relation violation
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Required relation is missing',
      };

    case 'P2011':
      // Null constraint violation
      const nullField = error.meta?.column_name || 'field';
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: `${nullField} cannot be null`,
      };

    case 'P2016':
      // Query interpretation error
      return {
        statusCode: HTTP_STATUS.BAD_REQUEST,
        message: 'Query interpretation error',
      };

    case 'P2021':
      // Table does not exist
      return {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: 'Database table does not exist',
      };

    case 'P2024':
      // Connection timeout
      return {
        statusCode: HTTP_STATUS.SERVICE_UNAVAILABLE,
        message: 'Database connection timeout',
      };

    default:
      return {
        statusCode: HTTP_STATUS.INTERNAL_SERVER_ERROR,
        message: 'A database error occurred',
      };
  }
};

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Validate request using middleware
 */
export const validateRequest = (schema: any, property: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const { error, value } = schema.validate(req[property], {
        abortEarly: false,
        stripUnknown: true,
      });

      if (error) {
        const errors = error.details.map((detail: any) => ({
          field: detail.path.join('.'),
          message: detail.message,
        }));

        sendError(res, 'Validation error', HTTP_STATUS.UNPROCESSABLE_ENTITY, errors);
        return;
      }

      // Replace request property with validated value
      req[property] = value;
      next();
    } catch (err) {
      next(err);
    }
  };
};
