import { Router } from 'express';
import authController from '../controllers/auth.controller';
import { validate } from '../middleware/validation.middleware';
import { authenticate } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/error.middleware';
import { authLimiter } from '../middleware/rateLimit.middleware';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from '../utils/validators';

const router = Router();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post(
  '/register',
  authLimiter,
  validate(registerSchema),
  asyncHandler(authController.register.bind(authController))
);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post(
  '/login',
  authLimiter,
  validate(loginSchema),
  asyncHandler(authController.login.bind(authController))
);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh access token
 * @access  Public
 */
router.post(
  '/refresh',
  asyncHandler(authController.refreshToken.bind(authController))
);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Public
 */
router.post(
  '/logout',
  asyncHandler(authController.logout.bind(authController))
);

/**
 * @route   GET /api/v1/auth/profile
 * @desc    Get current user profile
 * @access  Private
 */
router.get(
  '/profile',
  authenticate,
  asyncHandler(authController.getProfile.bind(authController))
);

/**
 * @route   PUT /api/v1/auth/change-password
 * @desc    Change password
 * @access  Private
 */
router.put(
  '/change-password',
  authenticate,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword.bind(authController))
);

/**
 * @route   POST /api/v1/auth/revoke-tokens
 * @desc    Revoke all tokens for current user
 * @access  Private
 */
router.post(
  '/revoke-tokens',
  authenticate,
  asyncHandler(authController.revokeAllTokens.bind(authController))
);

export default router;
