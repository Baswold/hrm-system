import { Router } from 'express';
import leaveController from '../controllers/leave.controller';
import { validate, validateParams } from '../middleware/validation.middleware';
import { authenticate, isManagerOrAbove } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { writeLimiter } from '../middleware/rateLimit.middleware';
import { uuidSchema } from '../utils/validators';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/leaves
 * @desc    Get all leave requests
 * @access  Private
 */
router.get('/', asyncHandler(leaveController.getAllLeaves.bind(leaveController)));

/**
 * @route   GET /api/v1/leaves/stats
 * @desc    Get leave statistics
 * @access  Private (Manager/HR/Admin)
 */
router.get(
  '/stats',
  isManagerOrAbove,
  asyncHandler(leaveController.getLeaveStatistics.bind(leaveController))
);

/**
 * @route   GET /api/v1/leaves/my-balance
 * @desc    Get current user's leave balance
 * @access  Private
 */
router.get(
  '/my-balance',
  asyncHandler(leaveController.getMyLeaveBalance.bind(leaveController))
);

/**
 * @route   GET /api/v1/leaves/:id
 * @desc    Get leave request by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(z.object({ id: uuidSchema })),
  asyncHandler(leaveController.getLeaveById.bind(leaveController))
);

/**
 * @route   POST /api/v1/leaves
 * @desc    Create a new leave request
 * @access  Private
 */
router.post(
  '/',
  writeLimiter,
  asyncHandler(leaveController.createLeave.bind(leaveController))
);

/**
 * @route   PUT /api/v1/leaves/:id
 * @desc    Update leave request
 * @access  Private
 */
router.put(
  '/:id',
  writeLimiter,
  validateParams(z.object({ id: uuidSchema })),
  asyncHandler(leaveController.updateLeave.bind(leaveController))
);

/**
 * @route   POST /api/v1/leaves/:id/approve
 * @desc    Approve leave request
 * @access  Private (Manager/HR/Admin)
 */
router.post(
  '/:id/approve',
  isManagerOrAbove,
  writeLimiter,
  validateParams(z.object({ id: uuidSchema })),
  asyncHandler(leaveController.approveLeave.bind(leaveController))
);

/**
 * @route   POST /api/v1/leaves/:id/reject
 * @desc    Reject leave request
 * @access  Private (Manager/HR/Admin)
 */
router.post(
  '/:id/reject',
  isManagerOrAbove,
  writeLimiter,
  validateParams(z.object({ id: uuidSchema })),
  asyncHandler(leaveController.rejectLeave.bind(leaveController))
);

/**
 * @route   POST /api/v1/leaves/:id/cancel
 * @desc    Cancel leave request
 * @access  Private
 */
router.post(
  '/:id/cancel',
  writeLimiter,
  validateParams(z.object({ id: uuidSchema })),
  asyncHandler(leaveController.cancelLeave.bind(leaveController))
);

/**
 * @route   GET /api/v1/leaves/balance/:employeeId
 * @desc    Get leave balance for specific employee
 * @access  Private (Manager/HR/Admin)
 */
router.get(
  '/balance/:employeeId',
  isManagerOrAbove,
  validateParams(z.object({ employeeId: uuidSchema })),
  asyncHandler(leaveController.getLeaveBalance.bind(leaveController))
);

/**
 * @route   DELETE /api/v1/leaves/:id
 * @desc    Delete leave request
 * @access  Private (HR/Admin)
 */
router.delete(
  '/:id',
  isManagerOrAbove,
  writeLimiter,
  validateParams(z.object({ id: uuidSchema })),
  asyncHandler(leaveController.deleteLeave.bind(leaveController))
);

export default router;
