import {
  hashPassword,
  comparePassword,
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  validatePasswordStrength,
  generateStrongPassword,
} from '../../../src/utils/crypto';

describe('Crypto Utils', () => {
  describe('Password Hashing', () => {
    it('should hash a password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });

    it('should verify correct password', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(password, hash);

      expect(isValid).toBe(true);
    });

    it('should reject incorrect password', async () => {
      const password = 'TestPassword123!';
      const wrongPassword = 'WrongPassword123!';
      const hash = await hashPassword(password);
      const isValid = await comparePassword(wrongPassword, hash);

      expect(isValid).toBe(false);
    });
  });

  describe('JWT Tokens', () => {
    const payload = {
      userId: 'user-123',
      email: 'test@example.com',
      role: 'EMPLOYEE' as any,
    };

    it('should generate access token', () => {
      const token = generateAccessToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should generate refresh token', () => {
      const refreshPayload = {
        userId: 'user-123',
        tokenId: 'token-123',
      };
      const token = generateRefreshToken(refreshPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('should verify valid access token', () => {
      const token = generateAccessToken(payload);
      const decoded = verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(payload.userId);
      expect(decoded.email).toBe(payload.email);
      expect(decoded.role).toBe(payload.role);
    });

    it('should throw error for invalid access token', () => {
      expect(() => {
        verifyAccessToken('invalid-token');
      }).toThrow('Invalid or expired token');
    });

    it('should verify valid refresh token', () => {
      const refreshPayload = {
        userId: 'user-123',
        tokenId: 'token-123',
      };
      const token = generateRefreshToken(refreshPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded).toBeDefined();
      expect(decoded.userId).toBe(refreshPayload.userId);
      expect(decoded.tokenId).toBe(refreshPayload.tokenId);
    });
  });

  describe('Password Strength Validation', () => {
    it('should accept strong password', () => {
      const result = validatePasswordStrength('StrongPass123!');

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject short password', () => {
      const result = validatePasswordStrength('Short1!');

      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('at least');
    });

    it('should reject password without uppercase', () => {
      const result = validatePasswordStrength('noupppercase123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one uppercase letter');
    });

    it('should reject password without lowercase', () => {
      const result = validatePasswordStrength('NOLOWERCASE123!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one lowercase letter');
    });

    it('should reject password without number', () => {
      const result = validatePasswordStrength('NoNumberHere!');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one number');
    });

    it('should reject password without special character', () => {
      const result = validatePasswordStrength('NoSpecialChar123');

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Password must contain at least one special character');
    });
  });

  describe('Generate Strong Password', () => {
    it('should generate password with default length', () => {
      const password = generateStrongPassword();

      expect(password).toBeDefined();
      expect(password.length).toBe(16);
    });

    it('should generate password with custom length', () => {
      const length = 24;
      const password = generateStrongPassword(length);

      expect(password.length).toBe(length);
    });

    it('should generate valid strong password', () => {
      const password = generateStrongPassword();
      const result = validatePasswordStrength(password);

      expect(result.isValid).toBe(true);
    });

    it('should generate different passwords each time', () => {
      const password1 = generateStrongPassword();
      const password2 = generateStrongPassword();

      expect(password1).not.toBe(password2);
    });
  });
});
