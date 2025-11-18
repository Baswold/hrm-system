import { Request, Response, NextFunction } from 'express';
import { IAuthRequest } from '../types';
import auditService from '../services/audit.service';

/**
 * Middleware to log actions to audit log
 */
export const auditLog = (action: string, entity: string) => {
  return async (req: IAuthRequest, res: Response, next: NextFunction) => {
    // Store original send
    const originalSend = res.send;

    // Override send to capture response
    res.send = function (data: any): Response {
      // Only log successful operations (2xx status codes)
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        // Extract entity ID from params or body
        const entityId = req.params.id || req.body?.id || 'N/A';

        // Capture old value (for UPDATE/DELETE operations)
        const oldValue = (req as any).oldValue || null;

        // Capture new value (for CREATE/UPDATE operations)
        let newValue = null;
        if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
          try {
            const responseData = JSON.parse(data.toString());
            newValue = responseData.data || null;
          } catch (e) {
            // Ignore JSON parse errors
          }
        }

        // Log asynchronously without blocking response
        auditService.log({
          userId: req.user.userId,
          userEmail: req.user.email,
          action,
          entity,
          entityId,
          oldValue,
          newValue,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        }).catch((error) => {
          // Log error but don't fail the request
          console.error('Audit logging failed:', error);
        });
      }

      // Call original send
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Capture old value middleware (for updates/deletes)
 */
export const captureOldValue = (model: any, idParam: string = 'id') => {
  return async (req: IAuthRequest, res: Response, next: NextFunction) => {
    try {
      const id = req.params[idParam];
      if (id && model.findUnique) {
        const oldValue = await model.findUnique({ where: { id } });
        (req as any).oldValue = oldValue;
      }
    } catch (error) {
      // Don't fail the request if we can't capture old value
      console.error('Failed to capture old value:', error);
    }
    next();
  };
};
