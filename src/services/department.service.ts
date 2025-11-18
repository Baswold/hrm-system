import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/error.middleware';
import { HTTP_STATUS } from '../config/constants';

export interface ICreateDepartment {
  name: string;
  code: string;
  description?: string;
  headId?: string;
  budget?: number;
  location?: string;
}

export interface ICreatePosition {
  title: string;
  code: string;
  description?: string;
  department: string;
  minSalary?: number;
  maxSalary?: number;
  requirements?: string;
}

export class DepartmentService {
  /**
   * Get all departments
   */
  async getAllDepartments(params: any = {}) {
    try {
      const { page = 1, limit = 50, search, isActive } = params;

      const where: Prisma.DepartmentWhereInput = {};

      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const skip = (page - 1) * limit;
      const total = await prisma.department.count({ where });

      const departments = await prisma.department.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
      });

      return {
        data: departments,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get all departments error:', error);
      throw error;
    }
  }

  /**
   * Get department by ID
   */
  async getDepartmentById(id: string) {
    try {
      const department = await prisma.department.findUnique({
        where: { id },
      });

      if (!department) {
        throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
      }

      // Get employee count for this department
      const employeeCount = await prisma.employee.count({
        where: { department: department.name, status: 'ACTIVE' },
      });

      return {
        ...department,
        employeeCount,
      };
    } catch (error) {
      logger.error('Get department by ID error:', error);
      throw error;
    }
  }

  /**
   * Create department
   */
  async createDepartment(data: ICreateDepartment) {
    try {
      const existing = await prisma.department.findFirst({
        where: {
          OR: [{ name: data.name }, { code: data.code }],
        },
      });

      if (existing) {
        throw new AppError('Department with this name or code already exists', HTTP_STATUS.CONFLICT);
      }

      const department = await prisma.department.create({
        data: {
          name: data.name,
          code: data.code,
          description: data.description,
          headId: data.headId,
          budget: data.budget,
          location: data.location,
        },
      });

      logger.info(`Department created: ${department.name}`);

      return department;
    } catch (error) {
      logger.error('Create department error:', error);
      throw error;
    }
  }

  /**
   * Update department
   */
  async updateDepartment(id: string, data: Partial<ICreateDepartment>) {
    try {
      const existing = await prisma.department.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
      }

      const department = await prisma.department.update({
        where: { id },
        data,
      });

      logger.info(`Department updated: ${id}`);

      return department;
    } catch (error) {
      logger.error('Update department error:', error);
      throw error;
    }
  }

  /**
   * Delete department
   */
  async deleteDepartment(id: string) {
    try {
      const department = await prisma.department.findUnique({
        where: { id },
      });

      if (!department) {
        throw new AppError('Department not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check if department has employees
      const employeeCount = await prisma.employee.count({
        where: { department: department.name, status: 'ACTIVE' },
      });

      if (employeeCount > 0) {
        throw new AppError('Cannot delete department with active employees', HTTP_STATUS.BAD_REQUEST);
      }

      await prisma.department.update({
        where: { id },
        data: { isActive: false },
      });

      logger.info(`Department deactivated: ${id}`);
    } catch (error) {
      logger.error('Delete department error:', error);
      throw error;
    }
  }

  /**
   * Get all positions
   */
  async getAllPositions(params: any = {}) {
    try {
      const { page = 1, limit = 50, search, department, isActive } = params;

      const where: Prisma.PositionWhereInput = {};

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { code: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (department) {
        where.department = { contains: department, mode: 'insensitive' };
      }

      if (isActive !== undefined) {
        where.isActive = isActive === 'true';
      }

      const skip = (page - 1) * limit;
      const total = await prisma.position.count({ where });

      const positions = await prisma.position.findMany({
        where,
        skip,
        take: limit,
        orderBy: { title: 'asc' },
      });

      return {
        data: positions,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get all positions error:', error);
      throw error;
    }
  }

  /**
   * Get position by ID
   */
  async getPositionById(id: string) {
    try {
      const position = await prisma.position.findUnique({
        where: { id },
      });

      if (!position) {
        throw new AppError('Position not found', HTTP_STATUS.NOT_FOUND);
      }

      // Get employee count for this position
      const employeeCount = await prisma.employee.count({
        where: { position: position.title, status: 'ACTIVE' },
      });

      return {
        ...position,
        employeeCount,
      };
    } catch (error) {
      logger.error('Get position by ID error:', error);
      throw error;
    }
  }

  /**
   * Create position
   */
  async createPosition(data: ICreatePosition) {
    try {
      const existing = await prisma.position.findFirst({
        where: {
          OR: [{ title: data.title }, { code: data.code }],
        },
      });

      if (existing) {
        throw new AppError('Position with this title or code already exists', HTTP_STATUS.CONFLICT);
      }

      const position = await prisma.position.create({
        data,
      });

      logger.info(`Position created: ${position.title}`);

      return position;
    } catch (error) {
      logger.error('Create position error:', error);
      throw error;
    }
  }

  /**
   * Update position
   */
  async updatePosition(id: string, data: Partial<ICreatePosition>) {
    try {
      const existing = await prisma.position.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError('Position not found', HTTP_STATUS.NOT_FOUND);
      }

      const position = await prisma.position.update({
        where: { id },
        data,
      });

      logger.info(`Position updated: ${id}`);

      return position;
    } catch (error) {
      logger.error('Update position error:', error);
      throw error;
    }
  }

  /**
   * Delete position
   */
  async deletePosition(id: string) {
    try {
      const position = await prisma.position.findUnique({
        where: { id },
      });

      if (!position) {
        throw new AppError('Position not found', HTTP_STATUS.NOT_FOUND);
      }

      // Check if position has employees
      const employeeCount = await prisma.employee.count({
        where: { position: position.title, status: 'ACTIVE' },
      });

      if (employeeCount > 0) {
        throw new AppError('Cannot delete position with active employees', HTTP_STATUS.BAD_REQUEST);
      }

      await prisma.position.update({
        where: { id },
        data: { isActive: false },
      });

      logger.info(`Position deactivated: ${id}`);
    } catch (error) {
      logger.error('Delete position error:', error);
      throw error;
    }
  }
}

export default new DepartmentService();
