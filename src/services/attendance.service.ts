import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/error.middleware';
import { HTTP_STATUS } from '../config/constants';

export interface ICheckIn {
  employeeId: string;
  checkInLocation?: string;
}

export interface ICheckOut {
  checkOutLocation?: string;
}

export interface IAttendanceQueryParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  startDate?: string;
  endDate?: string;
  isPresent?: boolean;
  isLate?: boolean;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface ICreateAttendance {
  employeeId: string;
  date: Date | string;
  checkIn?: Date | string;
  checkOut?: Date | string;
  isPresent?: boolean;
  isLate?: boolean;
  isHalfDay?: boolean;
  notes?: string;
}

export class AttendanceService {
  /**
   * Check in
   */
  async checkIn(data: ICheckIn) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Check if already checked in today
      const existingAttendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: data.employeeId,
            date: today,
          },
        },
      });

      if (existingAttendance && existingAttendance.checkIn) {
        throw new AppError('Already checked in today', HTTP_STATUS.CONFLICT);
      }

      const checkInTime = new Date();

      // Check if late (after 9:00 AM)
      const nineAM = new Date(today);
      nineAM.setHours(9, 0, 0, 0);
      const isLate = checkInTime > nineAM;

      const attendance = await prisma.attendance.upsert({
        where: {
          employeeId_date: {
            employeeId: data.employeeId,
            date: today,
          },
        },
        update: {
          checkIn: checkInTime,
          checkInLocation: data.checkInLocation,
          isLate,
          isPresent: true,
        },
        create: {
          employeeId: data.employeeId,
          date: today,
          checkIn: checkInTime,
          checkInLocation: data.checkInLocation,
          isLate,
          isPresent: true,
        },
      });

      logger.info(`Employee ${data.employeeId} checked in at ${checkInTime}`);

      return attendance;
    } catch (error) {
      logger.error('Check in error:', error);
      throw error;
    }
  }

  /**
   * Check out
   */
  async checkOut(employeeId: string, data: ICheckOut) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const attendance = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId,
            date: today,
          },
        },
      });

      if (!attendance) {
        throw new AppError('No check-in record found for today', HTTP_STATUS.NOT_FOUND);
      }

      if (attendance.checkOut) {
        throw new AppError('Already checked out today', HTTP_STATUS.CONFLICT);
      }

      const checkOutTime = new Date();

      // Calculate work hours
      let workHours = 0;
      let overtimeHours = 0;

      if (attendance.checkIn) {
        const diff = checkOutTime.getTime() - attendance.checkIn.getTime();
        const hours = diff / (1000 * 60 * 60);
        workHours = Math.max(0, hours);

        // Standard work day is 8 hours
        if (workHours > 8) {
          overtimeHours = workHours - 8;
          workHours = 8;
        }

        // Check if half day (less than 4 hours)
        if (hours < 4) {
          attendance.isHalfDay = true;
        }
      }

      const updatedAttendance = await prisma.attendance.update({
        where: {
          id: attendance.id,
        },
        data: {
          checkOut: checkOutTime,
          checkOutLocation: data.checkOutLocation,
          workHours,
          overtimeHours,
          isHalfDay: attendance.isHalfDay || workHours < 4,
        },
      });

      logger.info(`Employee ${employeeId} checked out at ${checkOutTime}`);

      return updatedAttendance;
    } catch (error) {
      logger.error('Check out error:', error);
      throw error;
    }
  }

  /**
   * Get all attendance records
   */
  async getAllAttendance(params: IAttendanceQueryParams) {
    try {
      const {
        page = 1,
        limit = 10,
        employeeId,
        startDate,
        endDate,
        isPresent,
        isLate,
        sortBy = 'date',
        sortOrder = 'desc',
      } = params;

      const where: Prisma.AttendanceWhereInput = {};

      if (employeeId) {
        where.employeeId = employeeId;
      }

      if (isPresent !== undefined) {
        where.isPresent = isPresent;
      }

      if (isLate !== undefined) {
        where.isLate = isLate;
      }

      if (startDate || endDate) {
        where.date = {};
        if (startDate) {
          where.date.gte = new Date(startDate);
        }
        if (endDate) {
          where.date.lte = new Date(endDate);
        }
      }

      const skip = (page - 1) * limit;
      const total = await prisma.attendance.count({ where });

      const attendances = await prisma.attendance.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              department: true,
              position: true,
            },
          },
        },
      });

      return {
        data: attendances,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get all attendance error:', error);
      throw error;
    }
  }

  /**
   * Get attendance by ID
   */
  async getAttendanceById(id: string) {
    try {
      const attendance = await prisma.attendance.findUnique({
        where: { id },
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
              department: true,
            },
          },
        },
      });

      if (!attendance) {
        throw new AppError('Attendance record not found', HTTP_STATUS.NOT_FOUND);
      }

      return attendance;
    } catch (error) {
      logger.error('Get attendance by ID error:', error);
      throw error;
    }
  }

  /**
   * Create attendance record manually (for admins)
   */
  async createAttendance(data: ICreateAttendance) {
    try {
      const date = new Date(data.date);
      date.setHours(0, 0, 0, 0);

      // Check if record already exists
      const existing = await prisma.attendance.findUnique({
        where: {
          employeeId_date: {
            employeeId: data.employeeId,
            date,
          },
        },
      });

      if (existing) {
        throw new AppError('Attendance record already exists for this date', HTTP_STATUS.CONFLICT);
      }

      // Calculate work hours if both check in and out are provided
      let workHours;
      let overtimeHours;

      if (data.checkIn && data.checkOut) {
        const checkIn = new Date(data.checkIn);
        const checkOut = new Date(data.checkOut);
        const diff = checkOut.getTime() - checkIn.getTime();
        const hours = diff / (1000 * 60 * 60);
        workHours = Math.min(hours, 8);
        overtimeHours = Math.max(0, hours - 8);
      }

      const attendance = await prisma.attendance.create({
        data: {
          employeeId: data.employeeId,
          date,
          checkIn: data.checkIn ? new Date(data.checkIn) : null,
          checkOut: data.checkOut ? new Date(data.checkOut) : null,
          workHours,
          overtimeHours,
          isPresent: data.isPresent ?? true,
          isLate: data.isLate ?? false,
          isHalfDay: data.isHalfDay ?? false,
          notes: data.notes,
        },
      });

      logger.info(`Attendance record created for employee: ${data.employeeId}`);

      return attendance;
    } catch (error) {
      logger.error('Create attendance error:', error);
      throw error;
    }
  }

  /**
   * Update attendance record
   */
  async updateAttendance(id: string, data: Partial<ICreateAttendance>) {
    try {
      const existing = await prisma.attendance.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError('Attendance record not found', HTTP_STATUS.NOT_FOUND);
      }

      const updateData: Prisma.AttendanceUpdateInput = {};

      if (data.checkIn !== undefined) {
        updateData.checkIn = data.checkIn ? new Date(data.checkIn) : null;
      }

      if (data.checkOut !== undefined) {
        updateData.checkOut = data.checkOut ? new Date(data.checkOut) : null;
      }

      if (data.isPresent !== undefined) updateData.isPresent = data.isPresent;
      if (data.isLate !== undefined) updateData.isLate = data.isLate;
      if (data.isHalfDay !== undefined) updateData.isHalfDay = data.isHalfDay;
      if (data.notes !== undefined) updateData.notes = data.notes;

      // Recalculate work hours if check in/out changed
      const checkIn = data.checkIn ? new Date(data.checkIn) : existing.checkIn;
      const checkOut = data.checkOut ? new Date(data.checkOut) : existing.checkOut;

      if (checkIn && checkOut) {
        const diff = checkOut.getTime() - checkIn.getTime();
        const hours = diff / (1000 * 60 * 60);
        updateData.workHours = Math.min(hours, 8);
        updateData.overtimeHours = Math.max(0, hours - 8);
      }

      const attendance = await prisma.attendance.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Attendance record updated: ${id}`);

      return attendance;
    } catch (error) {
      logger.error('Update attendance error:', error);
      throw error;
    }
  }

  /**
   * Delete attendance record
   */
  async deleteAttendance(id: string) {
    try {
      const attendance = await prisma.attendance.findUnique({
        where: { id },
      });

      if (!attendance) {
        throw new AppError('Attendance record not found', HTTP_STATUS.NOT_FOUND);
      }

      await prisma.attendance.delete({
        where: { id },
      });

      logger.info(`Attendance record deleted: ${id}`);
    } catch (error) {
      logger.error('Delete attendance error:', error);
      throw error;
    }
  }

  /**
   * Get attendance summary for employee
   */
  async getAttendanceSummary(employeeId: string, month?: number, year?: number) {
    try {
      const now = new Date();
      const targetMonth = month ?? now.getMonth();
      const targetYear = year ?? now.getFullYear();

      const startDate = new Date(targetYear, targetMonth, 1);
      const endDate = new Date(targetYear, targetMonth + 1, 0);

      const attendances = await prisma.attendance.findMany({
        where: {
          employeeId,
          date: {
            gte: startDate,
            lte: endDate,
          },
        },
      });

      const summary = {
        month: targetMonth + 1,
        year: targetYear,
        totalDays: attendances.length,
        presentDays: attendances.filter((a) => a.isPresent).length,
        absentDays: attendances.filter((a) => !a.isPresent).length,
        lateDays: attendances.filter((a) => a.isLate).length,
        halfDays: attendances.filter((a) => a.isHalfDay).length,
        totalWorkHours: attendances.reduce(
          (sum, a) => sum + (Number(a.workHours) || 0),
          0
        ),
        totalOvertimeHours: attendances.reduce(
          (sum, a) => sum + (Number(a.overtimeHours) || 0),
          0
        ),
      };

      return summary;
    } catch (error) {
      logger.error('Get attendance summary error:', error);
      throw error;
    }
  }

  /**
   * Get attendance statistics
   */
  async getAttendanceStatistics() {
    try {
      const total = await prisma.attendance.count();

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayAttendance = await prisma.attendance.count({
        where: { date: today, isPresent: true },
      });

      const lateToday = await prisma.attendance.count({
        where: { date: today, isLate: true },
      });

      const thisMonth = new Date();
      thisMonth.setDate(1);
      thisMonth.setHours(0, 0, 0, 0);

      const monthlyStats = await prisma.attendance.aggregate({
        where: {
          date: { gte: thisMonth },
        },
        _avg: {
          workHours: true,
          overtimeHours: true,
        },
        _sum: {
          workHours: true,
          overtimeHours: true,
        },
      });

      return {
        total,
        today: {
          present: todayAttendance,
          late: lateToday,
        },
        thisMonth: {
          averageWorkHours: Number(monthlyStats._avg.workHours) || 0,
          averageOvertimeHours: Number(monthlyStats._avg.overtimeHours) || 0,
          totalWorkHours: Number(monthlyStats._sum.workHours) || 0,
          totalOvertimeHours: Number(monthlyStats._sum.overtimeHours) || 0,
        },
      };
    } catch (error) {
      logger.error('Get attendance statistics error:', error);
      throw error;
    }
  }
}

export default new AttendanceService();
