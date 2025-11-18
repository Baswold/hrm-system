import { Prisma, LeaveStatus } from '@prisma/client';
import { prisma } from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/error.middleware';
import { HTTP_STATUS } from '../config/constants';

export interface ICreateLeave {
  employeeId: string;
  leaveType: any;
  startDate: Date | string;
  endDate: Date | string;
  reason: string;
  documents?: string[];
}

export interface IUpdateLeave {
  leaveType?: any;
  startDate?: Date | string;
  endDate?: Date | string;
  reason?: string;
  status?: LeaveStatus;
  rejectionReason?: string;
}

export interface ILeaveQueryParams {
  page?: number;
  limit?: number;
  employeeId?: string;
  status?: LeaveStatus;
  leaveType?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class LeaveService {
  /**
   * Get all leaves with pagination and filtering
   */
  async getAllLeaves(params: ILeaveQueryParams) {
    try {
      const {
        page = 1,
        limit = 10,
        employeeId,
        status,
        leaveType,
        startDate,
        endDate,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = params;

      const where: Prisma.LeaveWhereInput = {};

      if (employeeId) {
        where.employeeId = employeeId;
      }

      if (status) {
        where.status = status;
      }

      if (leaveType) {
        where.leaveType = leaveType as any;
      }

      if (startDate || endDate) {
        where.AND = [];
        if (startDate) {
          where.AND.push({
            startDate: { gte: new Date(startDate) },
          });
        }
        if (endDate) {
          where.AND.push({
            endDate: { lte: new Date(endDate) },
          });
        }
      }

      const skip = (page - 1) * limit;
      const total = await prisma.leave.count({ where });

      const leaves = await prisma.leave.findMany({
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
          requestedBy: {
            select: {
              id: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      return {
        data: leaves,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get all leaves error:', error);
      throw error;
    }
  }

  /**
   * Get leave by ID
   */
  async getLeaveById(id: string) {
    try {
      const leave = await prisma.leave.findUnique({
        where: { id },
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
          requestedBy: {
            select: {
              id: true,
              email: true,
            },
          },
          approvedBy: {
            select: {
              id: true,
              email: true,
            },
          },
        },
      });

      if (!leave) {
        throw new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND);
      }

      return leave;
    } catch (error) {
      logger.error('Get leave by ID error:', error);
      throw error;
    }
  }

  /**
   * Create leave request
   */
  async createLeave(data: ICreateLeave, requestedById: string) {
    try {
      // Calculate days
      const startDate = new Date(data.startDate);
      const endDate = new Date(data.endDate);
      const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

      if (days <= 0) {
        throw new AppError('End date must be after start date', HTTP_STATUS.BAD_REQUEST);
      }

      // Check for overlapping leaves
      const overlapping = await prisma.leave.findFirst({
        where: {
          employeeId: data.employeeId,
          status: { in: ['PENDING', 'APPROVED'] },
          OR: [
            {
              AND: [
                { startDate: { lte: startDate } },
                { endDate: { gte: startDate } },
              ],
            },
            {
              AND: [
                { startDate: { lte: endDate } },
                { endDate: { gte: endDate } },
              ],
            },
            {
              AND: [
                { startDate: { gte: startDate } },
                { endDate: { lte: endDate } },
              ],
            },
          ],
        },
      });

      if (overlapping) {
        throw new AppError('Leave request overlaps with existing leave', HTTP_STATUS.CONFLICT);
      }

      const leave = await prisma.leave.create({
        data: {
          employeeId: data.employeeId,
          leaveType: data.leaveType,
          startDate,
          endDate,
          days,
          reason: data.reason,
          documents: data.documents || [],
          requestedById,
          status: 'PENDING',
        },
        include: {
          employee: {
            select: {
              id: true,
              employeeId: true,
              firstName: true,
              lastName: true,
            },
          },
        },
      });

      logger.info(`Leave request created: ${leave.id}`);

      return leave;
    } catch (error) {
      logger.error('Create leave error:', error);
      throw error;
    }
  }

  /**
   * Update leave request
   */
  async updateLeave(id: string, data: IUpdateLeave) {
    try {
      const existingLeave = await prisma.leave.findUnique({
        where: { id },
      });

      if (!existingLeave) {
        throw new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND);
      }

      // Only pending leaves can be updated
      if (existingLeave.status !== 'PENDING' && data.status === undefined) {
        throw new AppError('Only pending leave requests can be modified', HTTP_STATUS.BAD_REQUEST);
      }

      const updateData: Prisma.LeaveUpdateInput = {};

      if (data.leaveType) updateData.leaveType = data.leaveType;
      if (data.reason) updateData.reason = data.reason;
      if (data.status) updateData.status = data.status;
      if (data.rejectionReason) updateData.rejectionReason = data.rejectionReason;

      if (data.startDate || data.endDate) {
        const startDate = data.startDate ? new Date(data.startDate) : existingLeave.startDate;
        const endDate = data.endDate ? new Date(data.endDate) : existingLeave.endDate;
        const days = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;

        if (data.startDate) updateData.startDate = startDate;
        if (data.endDate) updateData.endDate = endDate;
        updateData.days = days;
      }

      const leave = await prisma.leave.update({
        where: { id },
        data: updateData,
        include: {
          employee: true,
        },
      });

      logger.info(`Leave request updated: ${leave.id}`);

      return leave;
    } catch (error) {
      logger.error('Update leave error:', error);
      throw error;
    }
  }

  /**
   * Approve leave request
   */
  async approveLeave(id: string, approvedById: string) {
    try {
      const leave = await prisma.leave.findUnique({
        where: { id },
      });

      if (!leave) {
        throw new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND);
      }

      if (leave.status !== 'PENDING') {
        throw new AppError('Only pending leave requests can be approved', HTTP_STATUS.BAD_REQUEST);
      }

      const updatedLeave = await prisma.leave.update({
        where: { id },
        data: {
          status: 'APPROVED',
          approvedById,
          approvedAt: new Date(),
        },
        include: {
          employee: true,
          approvedBy: true,
        },
      });

      logger.info(`Leave request approved: ${id} by user: ${approvedById}`);

      return updatedLeave;
    } catch (error) {
      logger.error('Approve leave error:', error);
      throw error;
    }
  }

  /**
   * Reject leave request
   */
  async rejectLeave(id: string, approvedById: string, rejectionReason: string) {
    try {
      const leave = await prisma.leave.findUnique({
        where: { id },
      });

      if (!leave) {
        throw new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND);
      }

      if (leave.status !== 'PENDING') {
        throw new AppError('Only pending leave requests can be rejected', HTTP_STATUS.BAD_REQUEST);
      }

      const updatedLeave = await prisma.leave.update({
        where: { id },
        data: {
          status: 'REJECTED',
          approvedById,
          approvedAt: new Date(),
          rejectionReason,
        },
        include: {
          employee: true,
          approvedBy: true,
        },
      });

      logger.info(`Leave request rejected: ${id} by user: ${approvedById}`);

      return updatedLeave;
    } catch (error) {
      logger.error('Reject leave error:', error);
      throw error;
    }
  }

  /**
   * Cancel leave request
   */
  async cancelLeave(id: string, userId: string) {
    try {
      const leave = await prisma.leave.findUnique({
        where: { id },
        include: { employee: true },
      });

      if (!leave) {
        throw new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND);
      }

      // Only the requester can cancel
      if (leave.requestedById !== userId) {
        throw new AppError('Only the requester can cancel this leave', HTTP_STATUS.FORBIDDEN);
      }

      // Can't cancel approved leaves (would need manager approval)
      if (leave.status === 'APPROVED') {
        throw new AppError('Approved leaves cannot be cancelled directly', HTTP_STATUS.BAD_REQUEST);
      }

      const updatedLeave = await prisma.leave.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });

      logger.info(`Leave request cancelled: ${id}`);

      return updatedLeave;
    } catch (error) {
      logger.error('Cancel leave error:', error);
      throw error;
    }
  }

  /**
   * Get leave balance for employee
   */
  async getLeaveBalance(employeeId: string) {
    try {
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);

      const leaves = await prisma.leave.findMany({
        where: {
          employeeId,
          status: 'APPROVED',
          startDate: { gte: yearStart, lte: yearEnd },
        },
      });

      const totalDays = leaves.reduce((sum, leave) => sum + leave.days, 0);

      const byType = leaves.reduce((acc: any, leave) => {
        if (!acc[leave.leaveType]) {
          acc[leave.leaveType] = 0;
        }
        acc[leave.leaveType] += leave.days;
        return acc;
      }, {});

      // Typical leave allowances (could be customized per employee)
      const allowances = {
        VACATION: 20,
        SICK: 10,
        PERSONAL: 5,
        MATERNITY: 90,
        PATERNITY: 14,
        UNPAID: Infinity,
        BEREAVEMENT: 5,
        COMPENSATORY: 10,
      };

      const balance: any = {};
      for (const [type, allowed] of Object.entries(allowances)) {
        const used = byType[type] || 0;
        balance[type] = {
          allowed,
          used,
          remaining: allowed === Infinity ? Infinity : allowed - used,
        };
      }

      return {
        year: currentYear,
        totalUsed: totalDays,
        balance,
      };
    } catch (error) {
      logger.error('Get leave balance error:', error);
      throw error;
    }
  }

  /**
   * Get leave statistics
   */
  async getLeaveStatistics() {
    try {
      const total = await prisma.leave.count();

      const byStatus = await prisma.leave.groupBy({
        by: ['status'],
        _count: true,
      });

      const byType = await prisma.leave.groupBy({
        by: ['leaveType'],
        _count: true,
        _sum: { days: true },
      });

      const currentMonth = new Date();
      currentMonth.setDate(1);

      const thisMonth = await prisma.leave.count({
        where: {
          createdAt: { gte: currentMonth },
        },
      });

      return {
        total,
        thisMonth,
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
        byType: Object.fromEntries(
          byType.map((t) => [t.leaveType, { count: t._count, totalDays: t._sum.days || 0 }])
        ),
      };
    } catch (error) {
      logger.error('Get leave statistics error:', error);
      throw error;
    }
  }

  /**
   * Delete leave request
   */
  async deleteLeave(id: string) {
    try {
      const leave = await prisma.leave.findUnique({
        where: { id },
      });

      if (!leave) {
        throw new AppError('Leave request not found', HTTP_STATUS.NOT_FOUND);
      }

      // Can only delete rejected or cancelled leaves
      if (!['REJECTED', 'CANCELLED'].includes(leave.status)) {
        throw new AppError('Only rejected or cancelled leaves can be deleted', HTTP_STATUS.BAD_REQUEST);
      }

      await prisma.leave.delete({
        where: { id },
      });

      logger.info(`Leave request deleted: ${id}`);
    } catch (error) {
      logger.error('Delete leave error:', error);
      throw error;
    }
  }
}

export default new LeaveService();
