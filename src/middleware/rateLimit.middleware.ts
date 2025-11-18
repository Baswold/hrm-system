import rateLimit from 'express-rate-limit';
import { RATE_LIMIT_CONFIG, HTTP_STATUS } from '../config/constants';
import logger from '../config/logger';

/**
 * General rate limiter for all routes
 */
export const generalLimiter = rateLimit({
  windowMs: RATE_LIMIT_CONFIG.WINDOW_MS,
  max: RATE_LIMIT_CONFIG.MAX_REQUESTS,
  message: {
    success: false,
    message: 'Too many requests from this IP, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many requests, please try again later',
    });
  },
});

/**
 * Strict rate limiter for authentication routes
 */
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  skipSuccessfulRequests: true,
  message: {
    success: false,
    message: 'Too many login attempts, please try again later',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Auth rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      email: req.body?.email,
    });
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many authentication attempts, please try again after 15 minutes',
    });
  },
});

/**
 * Moderate rate limiter for write operations
 */
export const writeLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20, // 20 requests per minute
  message: {
    success: false,
    message: 'Too many write requests, please slow down',
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Write rate limit exceeded for IP: ${req.ip}`, {
      path: req.path,
      user: req.user?.email,
    });
    res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Too many requests, please try again in a minute',
    });
  },
});

/**
 * API key rate limiter (if API keys are implemented)
 */
export const apiKeyLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 1000, // 1000 requests per hour
  keyGenerator: (req) => {
    return req.headers['x-api-key'] as string || req.ip;
  },
  message: {
    success: false,
    message: 'API rate limit exceeded',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Custom rate limiter factory
 */
export const createRateLimiter = (options: {
  windowMs: number;
  max: number;
  message?: string;
}) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      message: options.message || 'Rate limit exceeded',
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      logger.warn(`Custom rate limit exceeded for IP: ${req.ip}`);
      res.status(HTTP_STATUS.TOO_MANY_REQUESTS).json({
        success: false,
        message: options.message || 'Too many requests, please try again later',
      });
    },
  });
};
