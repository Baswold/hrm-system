import { prisma } from '../config/database';
import logger from '../config/logger';
import { IAuditLog } from '../types';
import { Prisma } from '@prisma/client';

export class AuditService {
  /**
   * Log an action
   */
  async log(data: IAuditLog) {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          userId: data.userId,
          userEmail: data.userEmail,
          action: data.action,
          entity: data.entity,
          entityId: data.entityId,
          oldValue: data.oldValue as any,
          newValue: data.newValue as any,
          ipAddress: data.ipAddress,
          userAgent: data.userAgent,
        },
      });

      logger.debug('Audit log created:', auditLog.id);

      return auditLog;
    } catch (error) {
      logger.error('Audit log error:', error);
      // Don't throw - audit logging should not break main functionality
    }
  }

  /**
   * Get audit logs
   */
  async getAuditLogs(params: any = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        userId,
        entity,
        entityId,
        action,
        startDate,
        endDate,
        sortOrder = 'desc',
      } = params;

      const where: Prisma.AuditLogWhereInput = {};

      if (userId) where.userId = userId;
      if (entity) where.entity = entity;
      if (entityId) where.entityId = entityId;
      if (action) where.action = action;

      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const skip = (page - 1) * limit;
      const total = await prisma.auditLog.count({ where });

      const logs = await prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: sortOrder as any },
      });

      return {
        data: logs,
        pagination: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
        },
      };
    } catch (error) {
      logger.error('Get audit logs error:', error);
      throw error;
    }
  }

  /**
   * Get audit log statistics
   */
  async getAuditStatistics() {
    try {
      const total = await prisma.auditLog.count();

      const byAction = await prisma.auditLog.groupBy({
        by: ['action'],
        _count: true,
      });

      const byEntity = await prisma.auditLog.groupBy({
        by: ['entity'],
        _count: true,
      });

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const todayCount = await prisma.auditLog.count({
        where: { timestamp: { gte: today } },
      });

      return {
        total,
        today: todayCount,
        byAction: Object.fromEntries(byAction.map((a) => [a.action, a._count])),
        byEntity: Object.fromEntries(byEntity.map((e) => [e.entity, e._count])),
      };
    } catch (error) {
      logger.error('Get audit statistics error:', error);
      throw error;
    }
  }

  /**
   * Clean old audit logs (data retention)
   */
  async cleanOldLogs(daysToKeep: number = 90) {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

      const result = await prisma.auditLog.deleteMany({
        where: {
          timestamp: { lt: cutoffDate },
        },
      });

      logger.info(`Cleaned ${result.count} old audit logs`);

      return result.count;
    } catch (error) {
      logger.error('Clean old logs error:', error);
      throw error;
    }
  }
}

export default new AuditService();
