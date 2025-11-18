import { prisma } from '../config/database';
import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  validatePasswordStrength,
} from '../utils/crypto';
import {
  ICreateUser,
  ILoginCredentials,
  IAuthTokens,
  IUserWithEmployee,
} from '../types';
import logger from '../config/logger';
import { AppError } from '../middleware/error.middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';

export class AuthService {
  /**
   * Register a new user
   */
  async register(userData: ICreateUser & { firstName?: string; lastName?: string }): Promise<{
    user: IUserWithEmployee;
    tokens: IAuthTokens;
  }> {
    try {
      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: userData.email },
      });

      if (existingUser) {
        throw new AppError(ERROR_MESSAGES.USER_EXISTS, HTTP_STATUS.CONFLICT);
      }

      // Validate password strength
      const passwordValidation = validatePasswordStrength(userData.password);
      if (!passwordValidation.isValid) {
        throw new AppError(
          passwordValidation.errors.join('; '),
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Hash password
      const hashedPassword = await hashPassword(userData.password);

      // Create user
      const user = await prisma.user.create({
        data: {
          email: userData.email,
          password: hashedPassword,
          role: userData.role || 'EMPLOYEE',
        },
        include: {
          employee: true,
        },
      });

      logger.info(`User registered: ${user.email}`);

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      logger.error('Registration error:', error);
      throw error;
    }
  }

  /**
   * Login user
   */
  async login(credentials: ILoginCredentials): Promise<{
    user: IUserWithEmployee;
    tokens: IAuthTokens;
  }> {
    try {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: credentials.email },
        include: {
          employee: true,
        },
      });

      if (!user) {
        throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
      }

      // Check if user is active
      if (!user.isActive) {
        throw new AppError('Account is deactivated', HTTP_STATUS.FORBIDDEN);
      }

      // Verify password
      const isPasswordValid = await comparePassword(credentials.password, user.password);

      if (!isPasswordValid) {
        throw new AppError(ERROR_MESSAGES.INVALID_CREDENTIALS, HTTP_STATUS.UNAUTHORIZED);
      }

      logger.info(`User logged in: ${user.email}`);

      // Generate tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Update last login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return {
        user: userWithoutPassword,
        tokens,
      };
    } catch (error) {
      logger.error('Login error:', error);
      throw error;
    }
  }

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<IAuthTokens> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(refreshToken);

      // Check if refresh token exists and is not revoked
      const storedToken = await prisma.refreshToken.findUnique({
        where: { token: refreshToken },
      });

      if (!storedToken || storedToken.isRevoked) {
        throw new AppError('Invalid refresh token', HTTP_STATUS.UNAUTHORIZED);
      }

      // Check if token is expired
      if (new Date() > storedToken.expiresAt) {
        throw new AppError('Refresh token expired', HTTP_STATUS.UNAUTHORIZED);
      }

      // Get user
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
      });

      if (!user || !user.isActive) {
        throw new AppError('User not found or inactive', HTTP_STATUS.UNAUTHORIZED);
      }

      // Generate new tokens
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      // Revoke old refresh token
      await prisma.refreshToken.update({
        where: { id: storedToken.id },
        data: { isRevoked: true, revokedAt: new Date() },
      });

      logger.info(`Token refreshed for user: ${user.email}`);

      return tokens;
    } catch (error) {
      logger.error('Token refresh error:', error);
      throw error;
    }
  }

  /**
   * Logout user
   */
  async logout(refreshToken: string): Promise<void> {
    try {
      // Revoke refresh token
      await prisma.refreshToken.updateMany({
        where: { token: refreshToken },
        data: { isRevoked: true, revokedAt: new Date() },
      });

      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout error:', error);
      throw error;
    }
  }

  /**
   * Change password
   */
  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    try {
      // Get user
      const user = await prisma.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Verify current password
      const isPasswordValid = await comparePassword(currentPassword, user.password);

      if (!isPasswordValid) {
        throw new AppError('Current password is incorrect', HTTP_STATUS.BAD_REQUEST);
      }

      // Validate new password strength
      const passwordValidation = validatePasswordStrength(newPassword);
      if (!passwordValidation.isValid) {
        throw new AppError(
          passwordValidation.errors.join('; '),
          HTTP_STATUS.BAD_REQUEST
        );
      }

      // Hash new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password
      await prisma.user.update({
        where: { id: userId },
        data: { password: hashedPassword },
      });

      // Revoke all refresh tokens
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true, revokedAt: new Date() },
      });

      logger.info(`Password changed for user: ${user.email}`);
    } catch (error) {
      logger.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   */
  async getProfile(userId: string): Promise<IUserWithEmployee> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          employee: true,
        },
      });

      if (!user) {
        throw new AppError('User not found', HTTP_STATUS.NOT_FOUND);
      }

      // Remove password from response
      const { password, ...userWithoutPassword } = user;

      return userWithoutPassword;
    } catch (error) {
      logger.error('Get profile error:', error);
      throw error;
    }
  }

  /**
   * Generate access and refresh tokens
   */
  private async generateTokens(
    userId: string,
    email: string,
    role: any
  ): Promise<IAuthTokens> {
    // Generate access token
    const accessToken = generateAccessToken({ userId, email, role });

    // Create refresh token record
    const refreshTokenRecord = await prisma.refreshToken.create({
      data: {
        userId,
        token: '',
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // Generate refresh token with token ID
    const refreshToken = generateRefreshToken({
      userId,
      tokenId: refreshTokenRecord.id,
    });

    // Update refresh token record with generated token
    await prisma.refreshToken.update({
      where: { id: refreshTokenRecord.id },
      data: { token: refreshToken },
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Revoke all tokens for a user
   */
  async revokeAllTokens(userId: string): Promise<void> {
    try {
      await prisma.refreshToken.updateMany({
        where: { userId },
        data: { isRevoked: true, revokedAt: new Date() },
      });

      logger.info(`All tokens revoked for user ID: ${userId}`);
    } catch (error) {
      logger.error('Revoke tokens error:', error);
      throw error;
    }
  }
}

export default new AuthService();
