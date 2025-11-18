import { Request, Response } from 'express';
import attendanceService from '../services/attendance.service';
import { sendSuccess, sendCreated } from '../utils/response';
import { IAuthRequest } from '../types';
import logger from '../config/logger';

export class AttendanceController {
  /**
   * Check in
   */
  async checkIn(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { employeeId, checkInLocation } = req.body;

      const attendance = await attendanceService.checkIn({
        employeeId,
        checkInLocation,
      });

      logger.info(`Check-in recorded by user: ${req.user.email}`);

      sendCreated(res, { attendance }, 'Checked in successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check out
   */
  async checkOut(req: IAuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        throw new Error('User not authenticated');
      }

      const { employeeId } = req.params;
      const { checkOutLocation } = req.body;

      const attendance = await attendanceService.checkOut(employeeId, {
        checkOutLocation,
      });

      logger.info(`Check-out recorded by user: ${req.user.email}`);

      sendSuccess(res, { attendance }, 'Checked out successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get all attendance records
   */
  async getAllAttendance(req: Request, res: Response): Promise<void> {
    try {
      const result = await attendanceService.getAllAttendance(req.query as any);
      sendSuccess(res, result);
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get attendance by ID
   */
  async getAttendanceById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const attendance = await attendanceService.getAttendanceById(id);
      sendSuccess(res, { attendance });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Create attendance record
   */
  async createAttendance(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const attendance = await attendanceService.createAttendance(req.body);

      logger.info(`Attendance record created by user: ${req.user?.email}`);

      sendCreated(res, { attendance }, 'Attendance record created successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Update attendance record
   */
  async updateAttendance(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const attendance = await attendanceService.updateAttendance(id, req.body);

      logger.info(`Attendance record updated by user: ${req.user?.email}`);

      sendSuccess(res, { attendance }, 'Attendance record updated successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Delete attendance record
   */
  async deleteAttendance(req: IAuthRequest, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await attendanceService.deleteAttendance(id);

      logger.info(`Attendance record deleted by user: ${req.user?.email}`);

      sendSuccess(res, null, 'Attendance record deleted successfully');
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get attendance summary
   */
  async getAttendanceSummary(req: Request, res: Response): Promise<void> {
    try {
      const { employeeId } = req.params;
      const { month, year } = req.query;

      const summary = await attendanceService.getAttendanceSummary(
        employeeId,
        month ? parseInt(month as string) - 1 : undefined,
        year ? parseInt(year as string) : undefined
      );

      sendSuccess(res, { summary });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Get attendance statistics
   */
  async getAttendanceStatistics(req: Request, res: Response): Promise<void> {
    try {
      const stats = await attendanceService.getAttendanceStatistics();
      sendSuccess(res, { stats });
    } catch (error) {
      throw error;
    }
  }
}

export default new AttendanceController();
