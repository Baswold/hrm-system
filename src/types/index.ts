import { Request } from 'express';
import { Role, EmploymentStatus, EmploymentType, Gender } from '@prisma/client';

// User types
export interface IUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  lastLogin?: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface IUserWithEmployee extends IUser {
  employee?: IEmployee | null;
}

export interface ICreateUser {
  email: string;
  password: string;
  role?: Role;
}

export interface IUpdateUser {
  email?: string;
  role?: Role;
  isActive?: boolean;
}

// Employee types
export interface IAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface IEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
  alternatePhone?: string;
}

export interface IEmployee {
  id: string;
  employeeId: string;
  userId: string;
  firstName: string;
  middleName?: string | null;
  lastName: string;
  dateOfBirth: Date;
  gender: Gender;
  phone: string;
  alternatePhone?: string | null;
  personalEmail?: string | null;
  address: IAddress;
  department: string;
  position: string;
  employmentType: EmploymentType;
  startDate: Date;
  endDate?: Date | null;
  managerId?: string | null;
  salary: number;
  currency: string;
  status: EmploymentStatus;
  emergencyContact?: IEmergencyContact | null;
  notes?: string | null;
  profilePicture?: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface ICreateEmployee {
  employeeId: string;
  email: string;
  password?: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: Date | string;
  gender: Gender;
  phone: string;
  alternatePhone?: string;
  personalEmail?: string;
  address: IAddress;
  department: string;
  position: string;
  employmentType: EmploymentType;
  startDate: Date | string;
  endDate?: Date | string;
  managerId?: string;
  salary: number;
  currency?: string;
  status?: EmploymentStatus;
  emergencyContact?: IEmergencyContact;
  notes?: string;
}

export interface IUpdateEmployee {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  dateOfBirth?: Date | string;
  gender?: Gender;
  phone?: string;
  alternatePhone?: string;
  personalEmail?: string;
  address?: IAddress;
  department?: string;
  position?: string;
  employmentType?: EmploymentType;
  endDate?: Date | string;
  managerId?: string;
  salary?: number;
  currency?: string;
  status?: EmploymentStatus;
  emergencyContact?: IEmergencyContact;
  notes?: string;
  profilePicture?: string;
}

// Query types
export interface IPaginationParams {
  page: number;
  limit: number;
}

export interface IEmployeeQueryParams extends IPaginationParams {
  search?: string;
  department?: string;
  position?: string;
  status?: EmploymentStatus;
  employmentType?: EmploymentType;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

// Auth types
export interface ILoginCredentials {
  email: string;
  password: string;
}

export interface IAuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface ITokenPayload {
  userId: string;
  email: string;
  role: Role;
}

export interface IRefreshTokenPayload {
  userId: string;
  tokenId: string;
}

// Request types
export interface IAuthRequest extends Request {
  user?: ITokenPayload;
}

// Response types
export interface IApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: any[];
}

export interface IErrorResponse {
  success: false;
  message: string;
  errors?: any[];
  stack?: string;
}

// Statistics types
export interface IEmployeeStats {
  total: number;
  active: number;
  inactive: number;
  onLeave: number;
  terminated: number;
  byDepartment: Record<string, number>;
  byEmploymentType: Record<string, number>;
  averageSalary: number;
  recentHires: number;
}

// Validation types
export interface IValidationError {
  field: string;
  message: string;
}

// Service response types
export type ServiceResponse<T = any> = {
  success: true;
  data: T;
} | {
  success: false;
  error: string;
  statusCode?: number;
};

// Audit log types
export interface IAuditLog {
  userId: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  oldValue?: any;
  newValue?: any;
  ipAddress?: string;
  userAgent?: string;
}
