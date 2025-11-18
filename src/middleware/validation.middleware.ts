import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { sendValidationError } from '../utils/response';
import { formatZodErrors } from '../utils/validators';
import logger from '../config/logger';

/**
 * Validate request data using Zod schema
 */
export const validate = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate request body
      const validatedData = await schema.parseAsync(req.body);

      // Replace request body with validated data
      req.body = validatedData;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        logger.warn('Validation error:', { errors, body: req.body });
        sendValidationError(res, 'Validation failed', errors);
        return;
      }

      logger.error('Unexpected validation error:', error);
      next(error);
    }
  };
};

/**
 * Validate query parameters using Zod schema
 */
export const validateQuery = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate query parameters
      const validatedData = await schema.parseAsync(req.query);

      // Replace request query with validated data
      req.query = validatedData as any;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        logger.warn('Query validation error:', { errors, query: req.query });
        sendValidationError(res, 'Invalid query parameters', errors);
        return;
      }

      logger.error('Unexpected query validation error:', error);
      next(error);
    }
  };
};

/**
 * Validate route parameters using Zod schema
 */
export const validateParams = (schema: z.ZodSchema) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate route parameters
      const validatedData = await schema.parseAsync(req.params);

      // Replace request params with validated data
      req.params = validatedData as any;

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        logger.warn('Params validation error:', { errors, params: req.params });
        sendValidationError(res, 'Invalid route parameters', errors);
        return;
      }

      logger.error('Unexpected params validation error:', error);
      next(error);
    }
  };
};

/**
 * Sanitize input to prevent XSS attacks
 */
export const sanitizeInput = (req: Request, res: Response, next: NextFunction): void => {
  // Basic sanitization - remove common XSS patterns
  const sanitize = (obj: any): any => {
    if (typeof obj === 'string') {
      return obj
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '')
        .replace(/on\w+\s*=/gi, '');
    }

    if (Array.isArray(obj)) {
      return obj.map(sanitize);
    }

    if (typeof obj === 'object' && obj !== null) {
      const sanitized: any = {};
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          sanitized[key] = sanitize(obj[key]);
        }
      }
      return sanitized;
    }

    return obj;
  };

  req.body = sanitize(req.body);
  req.query = sanitize(req.query);
  req.params = sanitize(req.params);

  next();
};

/**
 * Validate UUID parameter
 */
export const validateUUID = (paramName: string = 'id') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const schema = z.object({
      [paramName]: z.string().uuid(`Invalid ${paramName} format`),
    });

    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = formatZodErrors(error);
        sendValidationError(res, 'Invalid parameter format', errors);
        return;
      }
      next(error);
    }
  };
};
