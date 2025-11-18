import { Request, Response } from 'express';
import employeeService from '../services/employee.service';
import { sendSuccess, sendCreated, sendNoContent } from '../utils/response';
import { IEmployeeQueryParams, IAuthRequest } from '../types';
import logger from '../config/logger';
import { SUCCESS_MESSAGES } from '../config/constants';

export class EmployeeController {
  /**
   * Get all employees
   */
  async getAllEmployees(req: Request, res: Response): Promise<void> {
    try {
      const queryParams = req.query as unknown as IEmployeeQueryParams;

      const result = await employeeService.getAllEmployees(queryParams);

      sendSuccess(res, result);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get employee by ID
   */
  async getEmployeeById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const employee = await employeeService.getEmployeeById(id);

      sendSuccess(res, { employee });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get employee by employee ID
   */
  async getEmployeeByEmployeeId(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;

      const employee = await employeeService.getEmployeeByEmployeeId(employeeId);

      sendSuccess(res, { employee });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create a new employee
   */
  async createEmployee(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const employee = await employeeService.createEmployee(req.body);

      logger.info(`Employee created by user: ${req.user?.email}`);

      sendCreated(res, { employee }, SUCCESS_MESSAGES.EMPLOYEE_CREATED);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update employee
   */
  async updateEmployee(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const employee = await employeeService.updateEmployee(id, req.body);

      logger.info(`Employee updated by user: ${req.user?.email}`);

      sendSuccess(res, { employee }, SUCCESS_MESSAGES.EMPLOYEE_UPDATED);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete employee
   */
  async deleteEmployee(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      await employeeService.deleteEmployee(id);

      logger.info(`Employee deleted by user: ${req.user?.email}`);

      sendSuccess(res, null, SUCCESS_MESSAGES.EMPLOYEE_DELETED);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get employee statistics
   */
  async getEmployeeStats(req: Request, res: Response): Promise<void> {
    try {
      const stats = await employeeService.getEmployeeStats();

      sendSuccess(res, { stats });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get current employee's profile
   */
  async getCurrentEmployeeProfile(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      // Find employee by user ID
      const profile = await employeeService.getAllEmployees({
        page: 1,
        limit: 1,
      });

      sendSuccess(res, { employee: profile.data[0] || null });
    } catch (error) {
      throw error;
    }
  }
}

export default new EmployeeController();
