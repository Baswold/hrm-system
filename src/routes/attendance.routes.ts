import { Router } from 'express';
import attendanceController from '../controllers/attendance.controller';
import { validateParams } from '../middleware/validation.middleware';
import { authenticate, isHROrAdmin, isManagerOrAbove } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { writeLimiter } from '../middleware/rateLimit.middleware';
import { uuidSchema } from '../utils/validators';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/v1/attendance/check-in
 * @desc    Check in
 * @access  Private
 */
router.post(
  '/check-in',
  writeLimiter,
  asyncHandler(attendanceController.checkIn.bind(attendanceController))
);

/**
 * @route   POST /api/v1/attendance/:employeeId/check-out
 * @desc    Check out
 * @access  Private
 */
router.post(
  '/:employeeId/check-out',
  writeLimiter,
  validateParams(z.object({ employeeId: uuidSchema })),
  asyncHandler(attendanceController.checkOut.bind(attendanceController))
);

/**
 * @route   GET /api/v1/attendance
 * @desc    Get all attendance records
 * @access  Private
 */
router.get('/', asyncHandler(attendanceController.getAllAttendance.bind(attendanceController)));

/**
 * @route   GET /api/v1/attendance/stats
 * @desc    Get attendance statistics
 * @access  Private (Manager/HR/Admin)
 */
router.get(
  '/stats',
  isManagerOrAbove,
  asyncHandler(attendanceController.getAttendanceStatistics.bind(attendanceController))
);

/**
 * @route   GET /api/v1/attendance/summary/:employeeId
 * @desc    Get attendance summary for employee
 * @access  Private
 */
router.get(
  '/summary/:employeeId',
  validateParams(z.object({ employeeId: uuidSchema })),
  asyncHandler(attendanceController.getAttendanceSummary.bind(attendanceController))
);

/**
 * @route   GET /api/v1/attendance/:id
 * @desc    Get attendance record by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(z.object({ id: uuidSchema })),
  asyncHandler(attendanceController.getAttendanceById.bind(attendanceController))
);

/**
 * @route   POST /api/v1/attendance
 * @desc    Create attendance record (manual entry)
 * @access  Private (HR/Admin)
 */
router.post(
  '/',
  isHROrAdmin,
  writeLimiter,
  asyncHandler(attendanceController.createAttendance.bind(attendanceController))
);

/**
 * @route   PUT /api/v1/attendance/:id
 * @desc    Update attendance record
 * @access  Private (HR/Admin)
 */
router.put(
  '/:id',
  isHROrAdmin,
  writeLimiter,
  validateParams(z.object({ id: uuidSchema })),
  asyncHandler(attendanceController.updateAttendance.bind(attendanceController))
);

/**
 * @route   DELETE /api/v1/attendance/:id
 * @desc    Delete attendance record
 * @access  Private (HR/Admin)
 */
router.delete(
  '/:id',
  isHROrAdmin,
  writeLimiter,
  validateParams(z.object({ id: uuidSchema })),
  asyncHandler(attendanceController.deleteAttendance.bind(attendanceController))
);

export default router;
