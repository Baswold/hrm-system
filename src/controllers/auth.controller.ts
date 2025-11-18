import { Request, Response } from 'express';
import authService from '../services/auth.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { IAuthRequest } from '../types';
import logger from '../config/logger';
import { SUCCESS_MESSAGES } from '../config/constants';

export class AuthController {
  /**
   * Register a new user
   */
  async register(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.register(req.body);

      logger.info(`User registered successfully: ${req.body.email}`);

      sendCreated(res, result, SUCCESS_MESSAGES.USER_CREATED);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(req: Request, res: Response): Promise<void> {
    try {
      const result = await authService.login(req.body);

      logger.info(`User logged in successfully: ${req.body.email}`);

      sendSuccess(res, result, SUCCESS_MESSAGES.LOGIN_SUCCESS);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      const tokens = await authService.refreshToken(refreshToken);

      logger.info('Token refreshed successfully');

      sendSuccess(res, { tokens }, 'Token refreshed successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      await authService.logout(refreshToken);

      logger.info('User logged out successfully');

      sendSuccess(res, null, SUCCESS_MESSAGES.LOGOUT_SUCCESS);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current user profile
   */
  async getProfile(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const profile = await authService.getProfile(req.user.userId);

      sendSuccess(res, { user: profile });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { currentPassword, newPassword } = req.body;

      await authService.changePassword(req.user.userId, currentPassword, newPassword);

      logger.info(`Password changed successfully for user: ${req.user.email}`);

      sendSuccess(res, null, SUCCESS_MESSAGES.PASSWORD_CHANGED);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Revoke all tokens for current user
   */
  async revokeAllTokens(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      await authService.revokeAllTokens(req.user.userId);

      logger.info(`All tokens revoked for user: ${req.user.email}`);

      sendSuccess(res, null, 'All tokens revoked successfully');
    } catch (error) {
      throw error;
    }
  }
}

export default new AuthController();
