import { Request, Response } from 'express';
import leaveService from '../services/leave.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { IAuthRequest } from '../types';
import logger from '../config/logger';

export class LeaveController {
  /**
   * Get all leaves
   */
  async getAllLeaves(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const result = await leaveService.getAllLeaves(req.query as any);
      sendSuccess(res, result);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get leave by ID
   */
  async getLeaveById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const leave = await leaveService.getLeaveById(id);
      sendSuccess(res, { leave });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create leave request
   */
  async createLeave(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const leave = await leaveService.createLeave(req.body, req.user.userId);

      logger.info(`Leave request created by user: ${req.user.email}`);

      sendCreated(res, { leave }, 'Leave request created successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update leave request
   */
  async updateLeave(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const leave = await leaveService.updateLeave(id, req.body);

      logger.info(`Leave request updated by user: ${req.user?.email}`);

      sendSuccess(res, { leave }, 'Leave request updated successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Approve leave request
   */
  async approveLeave(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const leave = await leaveService.approveLeave(id, req.user.userId);

      logger.info(`Leave request approved by user: ${req.user.email}`);

      sendSuccess(res, { leave }, 'Leave request approved successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Reject leave request
   */
  async rejectLeave(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const { rejectionReason } = req.body;

      const leave = await leaveService.rejectLeave(id, req.user.userId, rejectionReason);

      logger.info(`Leave request rejected by user: ${req.user.email}`);

      sendSuccess(res, { leave }, 'Leave request rejected');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Cancel leave request
   */
  async cancelLeave(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { id } = req.params;
      const leave = await leaveService.cancelLeave(id, req.user.userId);

      logger.info(`Leave request cancelled by user: ${req.user.email}`);

      sendSuccess(res, { leave }, 'Leave request cancelled');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get leave balance for employee
   */
  async getLeaveBalance(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const balance = await leaveService.getLeaveBalance(employeeId);

      sendSuccess(res, { balance });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get my leave balance
   */
  async getMyLeaveBalance(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      // Need to get employee ID from user ID
      // For now, using userId as employeeId (would need proper lookup)
      const balance = await leaveService.getLeaveBalance(req.user.userId);

      sendSuccess(res, { balance });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get leave statistics
   */
  async getLeaveStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await leaveService.getLeaveStatistics();
      sendSuccess(res, { stats });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete leave request
   */
  async deleteLeave(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await leaveService.deleteLeave(id);

      logger.info(`Leave request deleted by user: ${req.user?.email}`);

      sendSuccess(res, null, 'Leave request deleted successfully');
    } catch (error) {
      throw error;
    }
  }
}

export default new LeaveController();
