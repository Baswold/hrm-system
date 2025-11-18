import { prisma } from '../config/database';
import logger from '../config/logger';

export class AnalyticsService {
  /**
   * Get dashboard overview
   */
  async getDashboardOverview() {
    try {
      // Employee statistics
      const totalEmployees = await prisma.employee.count();
      const activeEmployees = await prisma.employee.count({
        where: { status: 'ACTIVE' },
      });

      // Recent hires (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentHires = await prisma.employee.count({
        where: {
          startDate: { gte: thirtyDaysAgo },
        },
      });

      // Department breakdown
      const departmentBreakdown = await prisma.employee.groupBy({
        by: ['department'],
        where: { status: 'ACTIVE' },
        _count: true,
      });

      // Leave requests pending approval
      const pendingLeaves = await prisma.leave.count({
        where: { status: 'PENDING' },
      });

      // Today's attendance
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayAttendance = await prisma.attendance.count({
        where: { date: today, isPresent: true },
      });

      const todayLate = await prisma.attendance.count({
        where: { date: today, isLate: true },
      });

      // Pending performance reviews
      const pendingReviews = await prisma.performanceReview.count({
        where: { isCompleted: false },
      });

      return {
        employees: {
          total: totalEmployees,
          active: activeEmployees,
          inactive: totalEmployees - activeEmployees,
          recentHires,
        },
        departments: departmentBreakdown.map((d) => ({
          name: d.department,
          count: d._count,
        })),
        leaves: {
          pendingApproval: pendingLeaves,
        },
        attendance: {
          today: {
            present: todayAttendance,
            late: todayLate,
            attendanceRate:
              activeEmployees > 0
                ? ((todayAttendance / activeEmployees) * 100).toFixed(2)
                : 0,
          },
        },
        reviews: {
          pending: pendingReviews,
        },
      };
    } catch (error) {
      logger.error('Get dashboard overview error:', error);
      throw error;
    }
  }

  /**
   * Get employee trends
   */
  async getEmployeeTrends(months: number = 6) {
    try {
      const trends = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

        const hired = await prisma.employee.count({
          where: {
            startDate: {
              gte: date,
              lt: nextMonth,
            },
          },
        });

        const terminated = await prisma.employee.count({
          where: {
            status: 'TERMINATED',
            endDate: {
              gte: date,
              lt: nextMonth,
            },
          },
        });

        trends.push({
          month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
          hired,
          terminated,
          netChange: hired - terminated,
        });
      }

      return trends;
    } catch (error) {
      logger.error('Get employee trends error:', error);
      throw error;
    }
  }

  /**
   * Get salary analytics
   */
  async getSalaryAnalytics() {
    try {
      const salaryStats = await prisma.employee.aggregate({
        where: { status: 'ACTIVE' },
        _avg: { salary: true },
        _min: { salary: true },
        _max: { salary: true },
        _sum: { salary: true },
      });

      // Salary by department
      const byDepartment = await prisma.employee.groupBy({
        by: ['department'],
        where: { status: 'ACTIVE' },
        _avg: { salary: true },
        _count: true,
      });

      // Salary by position
      const byPosition = await prisma.employee.groupBy({
        by: ['position'],
        where: { status: 'ACTIVE' },
        _avg: { salary: true },
        _count: true,
      });

      return {
        overall: {
          average: Number(salaryStats._avg.salary) || 0,
          minimum: Number(salaryStats._min.salary) || 0,
          maximum: Number(salaryStats._max.salary) || 0,
          total: Number(salaryStats._sum.salary) || 0,
        },
        byDepartment: byDepartment.map((d) => ({
          department: d.department,
          averageSalary: Number(d._avg.salary) || 0,
          employeeCount: d._count,
        })),
        byPosition: byPosition.map((p) => ({
          position: p.position,
          averageSalary: Number(p._avg.salary) || 0,
          employeeCount: p._count,
        })),
      };
    } catch (error) {
      logger.error('Get salary analytics error:', error);
      throw error;
    }
  }

  /**
   * Get attendance analytics
   */
  async getAttendanceAnalytics(months: number = 3) {
    try {
      const analytics = [];
      const currentDate = new Date();

      for (let i = months - 1; i >= 0; i--) {
        const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
        const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1);

        const stats = await prisma.attendance.aggregate({
          where: {
            date: {
              gte: date,
              lt: nextMonth,
            },
          },
          _count: {
            _all: true,
          },
          _avg: {
            workHours: true,
            overtimeHours: true,
          },
        });

        const lateCount = await prisma.attendance.count({
          where: {
            date: {
              gte: date,
              lt: nextMonth,
            },
            isLate: true,
          },
        });

        analytics.push({
          month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
          totalRecords: stats._count._all,
          averageWorkHours: Number(stats._avg.workHours) || 0,
          averageOvertimeHours: Number(stats._avg.overtimeHours) || 0,
          lateCount,
        });
      }

      return analytics;
    } catch (error) {
      logger.error('Get attendance analytics error:', error);
      throw error;
    }
  }

  /**
   * Get leave analytics
   */
  async getLeaveAnalytics() {
    try {
      const currentYear = new Date().getFullYear();
      const yearStart = new Date(currentYear, 0, 1);
      const yearEnd = new Date(currentYear, 11, 31);

      // Leave by type
      const byType = await prisma.leave.groupBy({
        by: ['leaveType'],
        where: {
          startDate: { gte: yearStart, lte: yearEnd },
          status: 'APPROVED',
        },
        _sum: { days: true },
        _count: true,
      });

      // Leave by status
      const byStatus = await prisma.leave.groupBy({
        by: ['status'],
        where: {
          startDate: { gte: yearStart, lte: yearEnd },
        },
        _count: true,
      });

      // Monthly leave trend
      const monthlyTrend = [];
      for (let month = 0; month < 12; month++) {
        const monthStart = new Date(currentYear, month, 1);
        const monthEnd = new Date(currentYear, month + 1, 0);

        const count = await prisma.leave.count({
          where: {
            startDate: { gte: monthStart, lte: monthEnd },
            status: 'APPROVED',
          },
        });

        monthlyTrend.push({
          month: monthStart.toLocaleString('default', { month: 'short' }),
          count,
        });
      }

      return {
        byType: byType.map((t) => ({
          type: t.leaveType,
          totalDays: t._sum.days || 0,
          count: t._count,
        })),
        byStatus: Object.fromEntries(byStatus.map((s) => [s.status, s._count])),
        monthlyTrend,
      };
    } catch (error) {
      logger.error('Get leave analytics error:', error);
      throw error;
    }
  }

  /**
   * Get performance analytics
   */
  async getPerformanceAnalytics() {
    try {
      const averages = await prisma.performanceReview.aggregate({
        where: { isCompleted: true },
        _avg: {
          overallRating: true,
          technicalSkills: true,
          communication: true,
          teamwork: true,
          leadership: true,
          productivity: true,
          initiative: true,
        },
      });

      // Performance distribution
      const distribution = await prisma.performanceReview.groupBy({
        by: ['overallRating'],
        where: {
          isCompleted: true,
          overallRating: { not: null },
        },
        _count: true,
      });

      // Map to rating ranges
      const ranges = {
        excellent: 0, // 4.5-5
        good: 0, // 3.5-4.49
        average: 0, // 2.5-3.49
        belowAverage: 0, // 1.5-2.49
        poor: 0, // 0-1.49
      };

      distribution.forEach((d) => {
        const rating = Number(d.overallRating);
        if (rating >= 4.5) ranges.excellent += d._count;
        else if (rating >= 3.5) ranges.good += d._count;
        else if (rating >= 2.5) ranges.average += d._count;
        else if (rating >= 1.5) ranges.belowAverage += d._count;
        else ranges.poor += d._count;
      });

      return {
        averageRatings: {
          overall: Number(averages._avg.overallRating) || 0,
          technicalSkills: Number(averages._avg.technicalSkills) || 0,
          communication: Number(averages._avg.communication) || 0,
          teamwork: Number(averages._avg.teamwork) || 0,
          leadership: Number(averages._avg.leadership) || 0,
          productivity: Number(averages._avg.productivity) || 0,
          initiative: Number(averages._avg.initiative) || 0,
        },
        distribution: ranges,
      };
    } catch (error) {
      logger.error('Get performance analytics error:', error);
      throw error;
    }
  }
}

export default new AnalyticsService();
