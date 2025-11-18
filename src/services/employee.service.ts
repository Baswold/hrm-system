import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import {
  IEmployee,
  ICreateEmployee,
  IUpdateEmployee,
  IEmployeeQueryParams,
  IPaginatedResponse,
  IEmployeeStats,
} from '../types';
import { hashPassword } from '../utils/crypto';
import logger from '../config/logger';
import { AppError } from '../middleware/error.middleware';
import { HTTP_STATUS, ERROR_MESSAGES } from '../config/constants';

export class EmployeeService {
  /**
   * Get all employees with pagination and filtering
   */
  async getAllEmployees(
    params: IEmployeeQueryParams
  ): Promise<IPaginatedResponse<IEmployee>> {
    try {
      const {
        page = 1,
        limit = 10,
        search,
        department,
        position,
        status,
        employmentType,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = params;

      // Build where clause
      const where: Prisma.EmployeeWhereInput = {};

      // Search across multiple fields
      if (search) {
        where.OR = [
          { firstName: { contains: search, mode: 'insensitive' } },
          { lastName: { contains: search, mode: 'insensitive' } },
          { employeeId: { contains: search, mode: 'insensitive' } },
          { user: { email: { contains: search, mode: 'insensitive' } } },
          { phone: { contains: search } },
        ];
      }

      // Filter by department
      if (department) {
        where.department = { contains: department, mode: 'insensitive' };
      }

      // Filter by position
      if (position) {
        where.position = { contains: position, mode: 'insensitive' };
      }

      // Filter by status
      if (status) {
        where.status = status;
      }

      // Filter by employment type
      if (employmentType) {
        where.employmentType = employmentType;
      }

      // Calculate skip value
      const skip = (page - 1) * limit;

      // Get total count
      const total = await prisma.employee.count({ where });

      // Get employees
      const employees = await prisma.employee.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
              lastLogin: true,
            },
          },
          manager: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      logger.info(`Retrieved ${employees.length} employees`);

      return {
        data: employees as any,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get all employees error:', error);
      throw error;
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(id: string): Promise<IEmployee> {
    try {
      const employee = await prisma.employee.findUnique({
        where: { id },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              role: true,
              isActive: true,
              lastLogin: true,
              createdAt: true,
              updatedAt: true,
            },
          },
          manager: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              position: true,
            },
          },
          subordinates: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              position: true,
            },
          },
        },
      });

      if (!employee) {
        throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);
      }

      logger.info(`Retrieved employee: ${employee.employeeId}`);

      return employee as any;
    } catch (error) {
      logger.error('Get employee by ID error:', error);
      throw error;
    }
  }

  /**
   * Get employee by employee ID (not UUID)
   */
  async getEmployeeByEmployeeId(employeeId: string): Promise<IEmployee> {
    try {
      const employee = await prisma.employee.findUnique({
        where: { employeeId },
        include: {
          user: true,
          manager: true,
        },
      });

      if (!employee) {
        throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);
      }

      return employee as any;
    } catch (error) {
      logger.error('Get employee by employee ID error:', error);
      throw error;
    }
  }

  /**
   * Create a new employee
   */
  async createEmployee(data: ICreateEmployee): Promise<IEmployee> {
    try {
      // Check if employee ID already exists
      const existingEmployee = await prisma.employee.findUnique({
        where: { employeeId: data.employeeId },
      });

      if (existingEmployee) {
        throw new AppError(ERROR_MESSAGES.EMPLOYEE_EXISTS, HTTP_STATUS.CONFLICT);
      }

      // Check if user email already exists
      const existingUser = await prisma.user.findUnique({
        where: { email: data.email },
      });

      if (existingUser) {
        throw new AppError(ERROR_MESSAGES.USER_EXISTS, HTTP_STATUS.CONFLICT);
      }

      // Hash password if provided, otherwise generate one
      const password = data.password || this.generateTemporaryPassword();
      const hashedPassword = await hashPassword(password);

      // Create user and employee in a transaction
      const employee = await prisma.$transaction(async (tx) => {
        // Create user
        const user = await tx.user.create({
          data: {
            email: data.email,
            password: hashedPassword,
            role: 'EMPLOYEE',
          },
        });

        // Create employee
        const newEmployee = await tx.employee.create({
          data: {
            employeeId: data.employeeId,
            userId: user.id,
            firstName: data.firstName,
            middleName: data.middleName,
            lastName: data.lastName,
            dateOfBirth: new Date(data.dateOfBirth),
            gender: data.gender,
            phone: data.phone,
            alternatePhone: data.alternatePhone,
            personalEmail: data.personalEmail,
            address: data.address,
            department: data.department,
            position: data.position,
            employmentType: data.employmentType,
            startDate: new Date(data.startDate),
            endDate: data.endDate ? new Date(data.endDate) : null,
            managerId: data.managerId,
            salary: data.salary,
            currency: data.currency || 'USD',
            status: data.status || 'ACTIVE',
            emergencyContact: data.emergencyContact,
            notes: data.notes,
          },
          include: {
            user: true,
            manager: true,
          },
        });

        return newEmployee;
      });

      logger.info(`Employee created: ${employee.employeeId}`);

      return employee as any;
    } catch (error) {
      logger.error('Create employee error:', error);
      throw error;
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(id: string, data: IUpdateEmployee): Promise<IEmployee> {
    try {
      // Check if employee exists
      const existingEmployee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!existingEmployee) {
        throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);
      }

      // Prepare update data
      const updateData: Prisma.EmployeeUpdateInput = {};

      if (data.firstName) updateData.firstName = data.firstName;
      if (data.middleName !== undefined) updateData.middleName = data.middleName;
      if (data.lastName) updateData.lastName = data.lastName;
      if (data.dateOfBirth) updateData.dateOfBirth = new Date(data.dateOfBirth);
      if (data.gender) updateData.gender = data.gender;
      if (data.phone) updateData.phone = data.phone;
      if (data.alternatePhone !== undefined) updateData.alternatePhone = data.alternatePhone;
      if (data.personalEmail !== undefined) updateData.personalEmail = data.personalEmail;
      if (data.address) updateData.address = data.address as any;
      if (data.department) updateData.department = data.department;
      if (data.position) updateData.position = data.position;
      if (data.employmentType) updateData.employmentType = data.employmentType;
      if (data.endDate !== undefined) updateData.endDate = data.endDate ? new Date(data.endDate) : null;
      if (data.salary) updateData.salary = data.salary;
      if (data.currency) updateData.currency = data.currency;
      if (data.status) updateData.status = data.status;
      if (data.emergencyContact !== undefined) updateData.emergencyContact = data.emergencyContact as any;
      if (data.notes !== undefined) updateData.notes = data.notes;
      if (data.profilePicture !== undefined) updateData.profilePicture = data.profilePicture;

      // Handle manager update
      if (data.managerId !== undefined) {
        if (data.managerId === null) {
          updateData.manager = { disconnect: true };
        } else {
          updateData.manager = { connect: { id: data.managerId } };
        }
      }

      // Update employee
      const employee = await prisma.employee.update({
        where: { id },
        data: updateData,
        include: {
          user: true,
          manager: true,
        },
      });

      logger.info(`Employee updated: ${employee.employeeId}`);

      return employee as any;
    } catch (error) {
      logger.error('Update employee error:', error);
      throw error;
    }
  }

  /**
   * Delete employee (soft delete by marking as TERMINATED)
   */
  async deleteEmployee(id: string): Promise<void> {
    try {
      // Check if employee exists
      const employee = await prisma.employee.findUnique({
        where: { id },
      });

      if (!employee) {
        throw new AppError('Employee not found', HTTP_STATUS.NOT_FOUND);
      }

      // Soft delete by updating status and end date
      await prisma.employee.update({
        where: { id },
        data: {
          status: 'TERMINATED',
          endDate: new Date(),
        },
      });

      // Deactivate user account
      await prisma.user.update({
        where: { id: employee.userId },
        data: { isActive: false },
      });

      logger.info(`Employee deleted: ${employee.employeeId}`);
    } catch (error) {
      logger.error('Delete employee error:', error);
      throw error;
    }
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats(): Promise<IEmployeeStats> {
    try {
      // Get total count
      const total = await prisma.employee.count();

      // Get count by status
      const statusCounts = await prisma.employee.groupBy({
        by: ['status'],
        _count: true,
      });

      // Get count by department
      const departmentCounts = await prisma.employee.groupBy({
        by: ['department'],
        _count: true,
      });

      // Get count by employment type
      const employmentTypeCounts = await prisma.employee.groupBy({
        by: ['employmentType'],
        _count: true,
      });

      // Get average salary
      const salaryAggregate = await prisma.employee.aggregate({
        _avg: {
          salary: true,
        },
      });

      // Get recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentHires = await prisma.employee.count({
        where: {
          startDate: {
            gte: thirtyDaysAgo,
          },
        },
      });

      // Transform data
      const stats: IEmployeeStats = {
        total,
        active: statusCounts.find((s) => s.status === 'ACTIVE')?._count || 0,
        inactive: statusCounts.find((s) => s.status === 'INACTIVE')?._count || 0,
        onLeave: statusCounts.find((s) => s.status === 'ON_LEAVE')?._count || 0,
        terminated: statusCounts.find((s) => s.status === 'TERMINATED')?._count || 0,
        byDepartment: Object.fromEntries(
          departmentCounts.map((d) => [d.department, d._count])
        ),
        byEmploymentType: Object.fromEntries(
          employmentTypeCounts.map((e) => [e.employmentType, e._count])
        ),
        averageSalary: Number(salaryAggregate._avg.salary) || 0,
        recentHires,
      };

      logger.info('Employee statistics retrieved');

      return stats;
    } catch (error) {
      logger.error('Get employee stats error:', error);
      throw error;
    }
  }

  /**
   * Generate a temporary password
   */
  private generateTemporaryPassword(): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  }
}

export default new EmployeeService();
