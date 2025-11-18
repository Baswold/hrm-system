import { z } from 'zod';
import {
  Role,
  Gender,
  EmploymentType,
  EmploymentStatus,
  LeaveType,
  LeaveStatus,
  DocumentType
} from '@prisma/client';

// Common validators
export const emailSchema = z.string().email('Invalid email address');

export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password must not exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/\d/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character');

export const uuidSchema = z.string().uuid('Invalid UUID format');

export const dateSchema = z.union([
  z.string().datetime(),
  z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  z.date(),
]).transform((val) => {
  if (typeof val === 'string') {
    return new Date(val);
  }
  return val;
});

export const phoneSchema = z.string().regex(
  /^\+?[\d\s\-()]+$/,
  'Invalid phone number format'
);

// Address schema
export const addressSchema = z.object({
  street: z.string().min(1, 'Street is required'),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  zipCode: z.string().min(1, 'Zip code is required'),
  country: z.string().min(1, 'Country is required'),
});

// Emergency contact schema
export const emergencyContactSchema = z.object({
  name: z.string().min(1, 'Emergency contact name is required'),
  relationship: z.string().min(1, 'Relationship is required'),
  phone: phoneSchema,
  alternatePhone: phoneSchema.optional(),
});

// Auth schemas
export const registerSchema = z.object({
  email: emailSchema,
  password: passwordSchema,
  firstName: z.string().min(1, 'First name is required').max(50),
  lastName: z.string().min(1, 'Last name is required').max(50),
  role: z.nativeEnum(Role).optional().default('EMPLOYEE' as Role),
});

export const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, 'Password is required'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: passwordSchema,
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Employee schemas
export const createEmployeeSchema = z.object({
  employeeId: z.string().min(1, 'Employee ID is required').max(50),
  email: emailSchema,
  password: passwordSchema.optional(),
  firstName: z.string().min(1, 'First name is required').max(50),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1, 'Last name is required').max(50),
  dateOfBirth: dateSchema,
  gender: z.nativeEnum(Gender),
  phone: phoneSchema,
  alternatePhone: phoneSchema.optional(),
  personalEmail: emailSchema.optional(),
  address: addressSchema,
  department: z.string().min(1, 'Department is required').max(100),
  position: z.string().min(1, 'Position is required').max(100),
  employmentType: z.nativeEnum(EmploymentType),
  startDate: dateSchema,
  endDate: dateSchema.optional(),
  managerId: uuidSchema.optional(),
  salary: z.number().positive('Salary must be a positive number'),
  currency: z.string().length(3).optional().default('USD'),
  status: z.nativeEnum(EmploymentStatus).optional().default('ACTIVE' as EmploymentStatus),
  emergencyContact: emergencyContactSchema.optional(),
  notes: z.string().max(1000).optional(),
});

export const updateEmployeeSchema = z.object({
  firstName: z.string().min(1).max(50).optional(),
  middleName: z.string().max(50).optional(),
  lastName: z.string().min(1).max(50).optional(),
  dateOfBirth: dateSchema.optional(),
  gender: z.nativeEnum(Gender).optional(),
  phone: phoneSchema.optional(),
  alternatePhone: phoneSchema.optional(),
  personalEmail: emailSchema.optional(),
  address: addressSchema.optional(),
  department: z.string().min(1).max(100).optional(),
  position: z.string().min(1).max(100).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  endDate: dateSchema.optional(),
  managerId: uuidSchema.optional(),
  salary: z.number().positive().optional(),
  currency: z.string().length(3).optional(),
  status: z.nativeEnum(EmploymentStatus).optional(),
  emergencyContact: emergencyContactSchema.optional(),
  notes: z.string().max(1000).optional(),
  profilePicture: z.string().url().optional(),
});

export const employeeQuerySchema = z.object({
  page: z.string().optional().transform((val) => (val ? parseInt(val, 10) : 1)),
  limit: z.string().optional().transform((val) => (val ? Math.min(parseInt(val, 10), 100) : 10)),
  search: z.string().optional(),
  department: z.string().optional(),
  position: z.string().optional(),
  status: z.nativeEnum(EmploymentStatus).optional(),
  employmentType: z.nativeEnum(EmploymentType).optional(),
  sortBy: z.string().optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Leave schemas
export const createLeaveSchema = z.object({
  employeeId: uuidSchema,
  leaveType: z.nativeEnum(LeaveType),
  startDate: dateSchema,
  endDate: dateSchema,
  reason: z.string().min(10, 'Reason must be at least 10 characters').max(500),
  documents: z.array(z.string().url()).optional().default([]),
}).refine((data) => data.endDate >= data.startDate, {
  message: 'End date must be after or equal to start date',
  path: ['endDate'],
});

export const updateLeaveSchema = z.object({
  leaveType: z.nativeEnum(LeaveType).optional(),
  startDate: dateSchema.optional(),
  endDate: dateSchema.optional(),
  reason: z.string().min(10).max(500).optional(),
  status: z.nativeEnum(LeaveStatus).optional(),
  rejectionReason: z.string().max(500).optional(),
});

// Document schemas
export const createDocumentSchema = z.object({
  employeeId: uuidSchema,
  documentType: z.nativeEnum(DocumentType),
  title: z.string().min(1).max(200),
  description: z.string().max(500).optional(),
  expiryDate: dateSchema.optional(),
});

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().positive().optional().default(1),
  limit: z.number().int().positive().max(100).optional().default(10),
});

// Utility functions for validation
export const validateData = <T>(schema: z.ZodSchema<T>, data: unknown): {
  success: boolean;
  data?: T;
  errors?: z.ZodError;
} => {
  try {
    const validatedData = schema.parse(data);
    return { success: true, data: validatedData };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { success: false, errors: error };
    }
    throw error;
  }
};

export const formatZodErrors = (error: z.ZodError): Array<{ field: string; message: string }> => {
  return error.errors.map((err) => ({
    field: err.path.join('.'),
    message: err.message,
  }));
};
