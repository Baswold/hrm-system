import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { ITokenPayload, IRefreshTokenPayload } from '../types';
import { JWT_CONFIG, PASSWORD_CONFIG } from '../config/constants';

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (password: string): Promise<string> => {
  return await bcrypt.hash(password, PASSWORD_CONFIG.SALT_ROUNDS);
};

/**
 * Compare a password with its hash
 */
export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return await bcrypt.compare(password, hash);
};

/**
 * Generate a JWT access token
 */
export const generateAccessToken = (payload: ITokenPayload): string => {
  return jwt.sign(payload, JWT_CONFIG.SECRET, {
    expiresIn: JWT_CONFIG.EXPIRES_IN,
    algorithm: JWT_CONFIG.ALGORITHM,
  });
};

/**
 * Generate a JWT refresh token
 */
export const generateRefreshToken = (payload: IRefreshTokenPayload): string => {
  return jwt.sign(payload, JWT_CONFIG.REFRESH_SECRET, {
    expiresIn: JWT_CONFIG.REFRESH_EXPIRES_IN,
    algorithm: JWT_CONFIG.ALGORITHM,
  });
};

/**
 * Verify a JWT access token
 */
export const verifyAccessToken = (token: string): ITokenPayload => {
  try {
    return jwt.verify(token, JWT_CONFIG.SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as ITokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired token');
  }
};

/**
 * Verify a JWT refresh token
 */
export const verifyRefreshToken = (token: string): IRefreshTokenPayload => {
  try {
    return jwt.verify(token, JWT_CONFIG.REFRESH_SECRET, {
      algorithms: [JWT_CONFIG.ALGORITHM],
    }) as IRefreshTokenPayload;
  } catch (error) {
    throw new Error('Invalid or expired refresh token');
  }
};

/**
 * Decode a JWT token without verification
 */
export const decodeToken = (token: string): any => {
  return jwt.decode(token);
};

/**
 * Generate a random token string
 */
export const generateRandomToken = (length: number = 32): string => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < PASSWORD_CONFIG.MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_CONFIG.MIN_LENGTH} characters long`);
  }

  if (password.length > PASSWORD_CONFIG.MAX_LENGTH) {
    errors.push(`Password must not exceed ${PASSWORD_CONFIG.MAX_LENGTH} characters`);
  }

  if (PASSWORD_CONFIG.REQUIRE_UPPERCASE && !/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }

  if (PASSWORD_CONFIG.REQUIRE_LOWERCASE && !/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }

  if (PASSWORD_CONFIG.REQUIRE_NUMBER && !/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }

  if (PASSWORD_CONFIG.REQUIRE_SPECIAL && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Generate a strong random password
 */
export const generateStrongPassword = (length: number = 16): string => {
  const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const lowercase = 'abcdefghijklmnopqrstuvwxyz';
  const numbers = '0123456789';
  const special = '!@#$%^&*()_+-=[]{};\':"|,.<>/?';
  const all = uppercase + lowercase + numbers + special;

  let password = '';

  // Ensure at least one character from each category
  password += uppercase[Math.floor(Math.random() * uppercase.length)];
  password += lowercase[Math.floor(Math.random() * lowercase.length)];
  password += numbers[Math.floor(Math.random() * numbers.length)];
  password += special[Math.floor(Math.random() * special.length)];

  // Fill the rest randomly
  for (let i = password.length; i < length; i++) {
    password += all[Math.floor(Math.random() * all.length)];
  }

  // Shuffle the password
  return password.split('').sort(() => Math.random() - 0.5).join('');
};
