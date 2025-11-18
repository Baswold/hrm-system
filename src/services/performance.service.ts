import { Prisma } from '@prisma/client';
import { prisma } from '../config/database';
import logger from '../config/logger';
import { AppError } from '../middleware/error.middleware';
import { HTTP_STATUS } from '../config/constants';

export interface ICreatePerformanceReview {
  employeeId: string;
  reviewPeriodStart: Date | string;
  reviewPeriodEnd: Date | string;
  technicalSkills?: number;
  communication?: number;
  teamwork?: number;
  leadership?: number;
  productivity?: number;
  initiative?: number;
  strengths?: string;
  areasOfImprovement?: string;
  goals?: string;
  managerComments?: string;
  employeeComments?: string;
}

export interface IUpdatePerformanceReview {
  technicalSkills?: number;
  communication?: number;
  teamwork?: number;
  leadership?: number;
  productivity?: number;
  initiative?: number;
  strengths?: string;
  areasOfImprovement?: string;
  goals?: string;
  managerComments?: string;
  employeeComments?: string;
  isCompleted?: boolean;
}

export class PerformanceService {
  /**
   * Get all performance reviews
   */
  async getAllReviews(params: any) {
    try {
      const {
        page = 1,
        limit = 10,
        employeeId,
        isCompleted,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = params;

      const where: Prisma.PerformanceReviewWhereInput = {};

      if (employeeId) where.employeeId = employeeId;
      if (isCompleted !== undefined) where.isCompleted = isCompleted === 'true';

      const skip = (page - 1) * limit;
      const total = await prisma.performanceReview.count({ where });

      const reviews = await prisma.performanceReview.findMany({
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
        data: reviews,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get all reviews error:', error);
      throw error;
    }
  }

  /**
   * Get review by ID
   */
  async getReviewById(id: string) {
    try {
      const review = await prisma.performanceReview.findUnique({
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
        },
      });

      if (!review) {
        throw new AppError('Performance review not found', HTTP_STATUS.NOT_FOUND);
      }

      return review;
    } catch (error) {
      logger.error('Get review by ID error:', error);
      throw error;
    }
  }

  /**
   * Create performance review
   */
  async createReview(data: ICreatePerformanceReview) {
    try {
      // Calculate overall rating if individual ratings are provided
      let overallRating;
      const ratings = [
        data.technicalSkills,
        data.communication,
        data.teamwork,
        data.leadership,
        data.productivity,
        data.initiative,
      ].filter((r) => r !== undefined) as number[];

      if (ratings.length > 0) {
        overallRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      }

      const review = await prisma.performanceReview.create({
        data: {
          employeeId: data.employeeId,
          reviewPeriodStart: new Date(data.reviewPeriodStart),
          reviewPeriodEnd: new Date(data.reviewPeriodEnd),
          technicalSkills: data.technicalSkills,
          communication: data.communication,
          teamwork: data.teamwork,
          leadership: data.leadership,
          productivity: data.productivity,
          initiative: data.initiative,
          overallRating,
          strengths: data.strengths,
          areasOfImprovement: data.areasOfImprovement,
          goals: data.goals,
          managerComments: data.managerComments,
          employeeComments: data.employeeComments,
          isCompleted: false,
        },
      });

      logger.info(`Performance review created for employee: ${data.employeeId}`);

      return review;
    } catch (error) {
      logger.error('Create review error:', error);
      throw error;
    }
  }

  /**
   * Update performance review
   */
  async updateReview(id: string, data: IUpdatePerformanceReview) {
    try {
      const existing = await prisma.performanceReview.findUnique({
        where: { id },
      });

      if (!existing) {
        throw new AppError('Performance review not found', HTTP_STATUS.NOT_FOUND);
      }

      // Recalculate overall rating if any rating is updated
      let overallRating = existing.overallRating;
      const ratings = [
        data.technicalSkills ?? existing.technicalSkills,
        data.communication ?? existing.communication,
        data.teamwork ?? existing.teamwork,
        data.leadership ?? existing.leadership,
        data.productivity ?? existing.productivity,
        data.initiative ?? existing.initiative,
      ].filter((r) => r !== null && r !== undefined) as number[];

      if (ratings.length > 0) {
        overallRating = ratings.reduce((sum, r) => sum + r, 0) / ratings.length;
      }

      const updateData: any = { ...data, overallRating };

      if (data.isCompleted && !existing.isCompleted) {
        updateData.completedAt = new Date();
      }

      const review = await prisma.performanceReview.update({
        where: { id },
        data: updateData,
      });

      logger.info(`Performance review updated: ${id}`);

      return review;
    } catch (error) {
      logger.error('Update review error:', error);
      throw error;
    }
  }

  /**
   * Delete performance review
   */
  async deleteReview(id: string) {
    try {
      await prisma.performanceReview.delete({
        where: { id },
      });

      logger.info(`Performance review deleted: ${id}`);
    } catch (error) {
      logger.error('Delete review error:', error);
      throw error;
    }
  }

  /**
   * Get review statistics
   */
  async getReviewStatistics() {
    try {
      const total = await prisma.performanceReview.count();
      const completed = await prisma.performanceReview.count({
        where: { isCompleted: true },
      });
      const pending = total - completed;

      const averages = await prisma.performanceReview.aggregate({
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

      return {
        total,
        completed,
        pending,
        averageRatings: {
          overall: Number(averages._avg.overallRating) || 0,
          technicalSkills: Number(averages._avg.technicalSkills) || 0,
          communication: Number(averages._avg.communication) || 0,
          teamwork: Number(averages._avg.teamwork) || 0,
          leadership: Number(averages._avg.leadership) || 0,
          productivity: Number(averages._avg.productivity) || 0,
          initiative: Number(averages._avg.initiative) || 0,
        },
      };
    } catch (error) {
      logger.error('Get review statistics error:', error);
      throw error;
    }
  }
}

export default new PerformanceService();
