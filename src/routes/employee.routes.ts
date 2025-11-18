import { Router } from 'express';
import employeeController from '../controllers/employee.controller';
import { validate, validateQuery, validateParams } from '../middleware/validation.middleware';
import { authenticate, isHROrAdmin, canAccessEmployee } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { writeLimiter } from '../middleware/rateLimit.middleware';
import {
  createEmployeeSchema,
  updateEmployeeSchema,
  employeeQuerySchema,
  uuidSchema,
} from '../utils/validators';
import { z } from 'zod';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * @route   GET /api/v1/employees
 * @desc    Get all employees with pagination and filtering
 * @access  Private (All authenticated users)
 */
router.get(
  '/',
  validateQuery(employeeQuerySchema),
  asyncHandler(employeeController.getAllEmployees.bind(employeeController))
);

/**
 * @route   GET /api/v1/employees/stats/overview
 * @desc    Get employee statistics
 * @access  Private (HR/Admin only)
 */
router.get(
  '/stats/overview',
  isHROrAdmin,
  asyncHandler(employeeController.getEmployeeStats.bind(employeeController))
);

/**
 * @route   GET /api/v1/employees/me
 * @desc    Get current employee's profile
 * @access  Private
 */
router.get(
  '/me',
  asyncHandler(employeeController.getCurrentEmployeeProfile.bind(employeeController))
);

/**
 * @route   GET /api/v1/employees/:id
 * @desc    Get employee by ID
 * @access  Private
 */
router.get(
  '/:id',
  validateParams(z.object({ id: uuidSchema })),
  canAccessEmployee,
  asyncHandler(employeeController.getEmployeeById.bind(employeeController))
);

/**
 * @route   POST /api/v1/employees
 * @desc    Create a new employee
 * @access  Private (HR/Admin only)
 */
router.post(
  '/',
  isHROrAdmin,
  writeLimiter,
  validate(createEmployeeSchema),
  asyncHandler(employeeController.createEmployee.bind(employeeController))
);

/**
 * @route   PUT /api/v1/employees/:id
 * @desc    Update employee
 * @access  Private (HR/Admin only)
 */
router.put(
  '/:id',
  isHROrAdmin,
  writeLimiter,
  validateParams(z.object({ id: uuidSchema })),
  validate(updateEmployeeSchema),
  asyncHandler(employeeController.updateEmployee.bind(employeeController))
);

/**
 * @route   DELETE /api/v1/employees/:id
 * @desc    Delete employee (soft delete)
 * @access  Private (HR/Admin only)
 */
router.delete(
  '/:id',
  isHROrAdmin,
  writeLimiter,
  validateParams(z.object({ id: uuidSchema })),
  asyncHandler(employeeController.deleteEmployee.bind(employeeController))
);

/**
 * @route   GET /api/v1/employees/employee-id/:employeeId
 * @desc    Get employee by employee ID
 * @access  Private
 */
router.get(
  '/employee-id/:employeeId',
  asyncHandler(employeeController.getEmployeeByEmployeeId.bind(employeeController))
);

export default router;
