export const APP_CONFIG = {
  NAME: process.env.APP_NAME || 'HRM System',
  VERSION: process.env.API_VERSION || 'v1',
  PORT: parseInt(process.env.PORT || '3000', 10),
  ENV: process.env.NODE_ENV || 'development',
} as const;

export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_SECRET: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  ALGORITHM: 'HS256' as const,
} as const;

export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000', 10), // 15 minutes
  MAX_REQUESTS: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
} as const;

export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 10,
  MAX_LIMIT: 100,
} as const;

export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  MAX_LENGTH: 128,
  SALT_ROUNDS: 12,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
} as const;

export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE: parseInt(process.env.MAX_FILE_SIZE || '5242880', 10), // 5MB
  ALLOWED_TYPES: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ],
  UPLOAD_PATH: process.env.UPLOAD_PATH || './uploads',
} as const;

export const CORS_CONFIG = {
  ORIGIN: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
  CREDENTIALS: true,
  METHODS: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  ALLOWED_HEADERS: ['Content-Type', 'Authorization'],
} as const;

export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

export const ERROR_MESSAGES = {
  UNAUTHORIZED: 'Unauthorized access',
  FORBIDDEN: 'Forbidden resource',
  NOT_FOUND: 'Resource not found',
  VALIDATION_ERROR: 'Validation error',
  INTERNAL_ERROR: 'Internal server error',
  INVALID_CREDENTIALS: 'Invalid email or password',
  USER_EXISTS: 'User already exists',
  EMPLOYEE_EXISTS: 'Employee already exists',
  INVALID_TOKEN: 'Invalid or expired token',
  PASSWORD_WEAK: 'Password does not meet security requirements',
} as const;

export const SUCCESS_MESSAGES = {
  USER_CREATED: 'User created successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
  EMPLOYEE_CREATED: 'Employee created successfully',
  EMPLOYEE_UPDATED: 'Employee updated successfully',
  EMPLOYEE_DELETED: 'Employee deleted successfully',
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  PASSWORD_CHANGED: 'Password changed successfully',
} as const;

export const EMPLOYEE_STATUS = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
  ON_LEAVE: 'ON_LEAVE',
  TERMINATED: 'TERMINATED',
  SUSPENDED: 'SUSPENDED',
} as const;

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
  HR: 'HR',
  EMPLOYEE: 'EMPLOYEE',
} as const;

export const EMPLOYMENT_TYPES = {
  FULL_TIME: 'FULL_TIME',
  PART_TIME: 'PART_TIME',
  CONTRACT: 'CONTRACT',
  INTERN: 'INTERN',
  TEMPORARY: 'TEMPORARY',
} as const;
