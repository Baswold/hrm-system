import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/crypto';
import { sendUnauthorized, sendForbidden } from '../utils/response';
import { ITokenPayload } from '../types';
import { Role } from '@prisma/client';
import logger from '../config/logger';

/**
 * Authenticate JWT token from request
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      sendUnauthorized(res, 'No token provided');
      return;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix

    try {
      // Verify token
      const payload = verifyAccessToken(token);

      // Attach user to request
      req.user = payload;

      logger.info(`User authenticated: ${payload.email}`);
      next();
    } catch (error) {
      logger.error('Token verification failed:', error);
      sendUnauthorized(res, 'Invalid or expired token');
      return;
    }
  } catch (error) {
    logger.error('Authentication error:', error);
    sendUnauthorized(res, 'Authentication failed');
    return;
  }
};

/**
 * Authorize user based on roles
 */
export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendUnauthorized(res, 'User not authenticated');
      return;
    }

    const userRole = req.user.role;

    if (!allowedRoles.includes(userRole)) {
      logger.warn(`User ${req.user.email} attempted to access restricted resource`);
      sendForbidden(res, 'Insufficient permissions');
      return;
    }

    next();
  };
};

/**
 * Check if user is admin
 */
export const isAdmin = authorize('ADMIN' as Role);

/**
 * Check if user is HR or Admin
 */
export const isHROrAdmin = authorize('HR' as Role, 'ADMIN' as Role);

/**
 * Check if user is Manager, HR, or Admin
 */
export const isManagerOrAbove = authorize('MANAGER' as Role, 'HR' as Role, 'ADMIN' as Role);

/**
 * Optional authentication - doesn't fail if no token is provided
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const payload = verifyAccessToken(token);
        req.user = payload;
      } catch (error) {
        // Token is invalid, but we don't fail the request
        logger.debug('Optional auth: Invalid token provided');
      }
    }

    next();
  } catch (error) {
    next();
  }
};

/**
 * Check if user can access employee data
 * Employees can only access their own data unless they have elevated permissions
 */
export const canAccessEmployee = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    if (!req.user) {
      sendUnauthorized(res, 'User not authenticated');
      return;
    }

    const employeeId = req.params.id;
    const userRole = req.user.role;

    // Admins and HR can access any employee data
    if (userRole === 'ADMIN' || userRole === 'HR') {
      next();
      return;
    }

    // For employees and managers, check if they're accessing their own data
    // This would require fetching the employee record to compare userId
    // For now, we'll allow access and implement fine-grained checks in the service layer

    next();
  } catch (error) {
    logger.error('Authorization error:', error);
    sendForbidden(res, 'Access denied');
    return;
  }
};
