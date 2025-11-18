import { Router } from 'express';
import authRoutes from './auth.routes';
import employeeRoutes from './employee.routes';
import leaveRoutes from './leave.routes';
import attendanceRoutes from './attendance.routes';
import { databaseHealthCheck } from '../config/database';
import { sendSuccess, sendServiceUnavailable } from '../utils/response';

const router = Router();

/**
 * Health check endpoint
 */
router.get('/health', async (req, res) => {
  try {
    const dbHealthy = await databaseHealthCheck();

    if (!dbHealthy) {
      return sendServiceUnavailable(res, 'Database is not available');
    }

    sendSuccess(res, {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: '1.0.0',
      database: 'connected',
    });
  } catch (error) {
    sendServiceUnavailable(res, 'Service health check failed');
  }
});

/**
 * API version info
 */
router.get('/version', (req, res) => {
  sendSuccess(res, {
    version: '1.0.0',
    apiVersion: 'v1',
    name: 'HRM System API',
  });
});

/**
 * Mount route modules
 */
router.use('/auth', authRoutes);
router.use('/employees', employeeRoutes);
router.use('/leaves', leaveRoutes);
router.use('/attendance', attendanceRoutes);

/**
 * API documentation route
 */
router.get('/', (req, res) => {
  sendSuccess(res, {
    message: 'Welcome to HRM System API',
    version: '1.0.0',
    documentation: '/api/v1/docs',
    endpoints: {
      auth: '/api/v1/auth',
      employees: '/api/v1/employees',
      leaves: '/api/v1/leaves',
      attendance: '/api/v1/attendance',
      health: '/api/v1/health',
    },
  });
});

export default router;
