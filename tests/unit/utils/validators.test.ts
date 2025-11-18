import {
  emailSchema,
  passwordSchema,
  phoneSchema,
  addressSchema,
  registerSchema,
  loginSchema,
  createEmployeeSchema,
  validateData,
  formatZodErrors,
} from '../../../src/utils/validators';
import { ZodError } from 'zod';

describe('Validators', () => {
  describe('Email Schema', () => {
    it('should validate correct email', () => {
      const result = emailSchema.safeParse('test@example.com');
      expect(result.success).toBe(true);
    });

    it('should reject invalid email', () => {
      const result = emailSchema.safeParse('invalid-email');
      expect(result.success).toBe(false);
    });

    it('should reject email without domain', () => {
      const result = emailSchema.safeParse('test@');
      expect(result.success).toBe(false);
    });
  });

  describe('Password Schema', () => {
    it('should validate strong password', () => {
      const result = passwordSchema.safeParse('StrongPass123!');
      expect(result.success).toBe(true);
    });

    it('should reject short password', () => {
      const result = passwordSchema.safeParse('Short1!');
      expect(result.success).toBe(false);
    });

    it('should reject password without uppercase', () => {
      const result = passwordSchema.safeParse('lowercase123!');
      expect(result.success).toBe(false);
    });

    it('should reject password without special character', () => {
      const result = passwordSchema.safeParse('Password123');
      expect(result.success).toBe(false);
    });
  });

  describe('Phone Schema', () => {
    it('should validate correct phone number', () => {
      const validPhones = [
        '+1234567890',
        '1234567890',
        '+1 (234) 567-8900',
        '123-456-7890',
      ];

      validPhones.forEach(phone => {
        const result = phoneSchema.safeParse(phone);
        expect(result.success).toBe(true);
      });
    });

    it('should reject invalid phone number', () => {
      const result = phoneSchema.safeParse('abc123');
      expect(result.success).toBe(false);
    });
  });

  describe('Address Schema', () => {
    it('should validate complete address', () => {
      const address = {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      };

      const result = addressSchema.safeParse(address);
      expect(result.success).toBe(true);
    });

    it('should reject incomplete address', () => {
      const address = {
        street: '123 Main St',
        city: 'New York',
      };

      const result = addressSchema.safeParse(address);
      expect(result.success).toBe(false);
    });
  });

  describe('Register Schema', () => {
    it('should validate complete registration data', () => {
      const data = {
        email: 'test@example.com',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(true);
    });

    it('should reject registration with invalid email', () => {
      const data = {
        email: 'invalid-email',
        password: 'StrongPass123!',
        firstName: 'John',
        lastName: 'Doe',
      };

      const result = registerSchema.safeParse(data);
      expect(result.success).toBe(false);
    });
  });

  describe('Login Schema', () => {
    it('should validate login credentials', () => {
      const credentials = {
        email: 'test@example.com',
        password: 'password123',
      };

      const result = loginSchema.safeParse(credentials);
      expect(result.success).toBe(true);
    });

    it('should reject empty password', () => {
      const credentials = {
        email: 'test@example.com',
        password: '',
      };

      const result = loginSchema.safeParse(credentials);
      expect(result.success).toBe(false);
    });
  });

  describe('Create Employee Schema', () => {
    const validEmployeeData = {
      employeeId: 'EMP001',
      email: 'employee@company.com',
      firstName: 'Jane',
      lastName: 'Smith',
      dateOfBirth: '1990-05-15',
      gender: 'FEMALE',
      phone: '+1234567890',
      address: {
        street: '123 Main St',
        city: 'New York',
        state: 'NY',
        zipCode: '10001',
        country: 'USA',
      },
      department: 'Engineering',
      position: 'Software Engineer',
      employmentType: 'FULL_TIME',
      startDate: '2024-01-15',
      salary: 120000,
    };

    it('should validate complete employee data', () => {
      const result = createEmployeeSchema.safeParse(validEmployeeData);
      expect(result.success).toBe(true);
    });

    it('should reject negative salary', () => {
      const data = {
        ...validEmployeeData,
        salary: -1000,
      };

      const result = createEmployeeSchema.safeParse(data);
      expect(result.success).toBe(false);
    });

    it('should set default values', () => {
      const result = createEmployeeSchema.safeParse(validEmployeeData);
      if (result.success) {
        expect(result.data.currency).toBe('USD');
        expect(result.data.status).toBe('ACTIVE');
      }
    });
  });

  describe('Utility Functions', () => {
    it('should validate data successfully', () => {
      const data = { email: 'test@example.com' };
      const result = validateData(emailSchema, data.email);

      expect(result.success).toBe(true);
      expect(result.data).toBe(data.email);
    });

    it('should return errors for invalid data', () => {
      const result = validateData(emailSchema, 'invalid-email');

      expect(result.success).toBe(false);
      expect(result.errors).toBeDefined();
    });

    it('should format Zod errors correctly', () => {
      try {
        emailSchema.parse('invalid-email');
      } catch (error) {
        if (error instanceof ZodError) {
          const formatted = formatZodErrors(error);

          expect(Array.isArray(formatted)).toBe(true);
          expect(formatted.length).toBeGreaterThan(0);
          expect(formatted[0]).toHaveProperty('field');
          expect(formatted[0]).toHaveProperty('message');
        }
      }
    });
  });
});
