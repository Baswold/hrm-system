import { PrismaClient } from '@prisma/client';
import logger from './logger';

// Singleton pattern for Prisma Client
class DatabaseConnection {
  private static instance: PrismaClient;

  private constructor() {}

  public static getInstance(): PrismaClient {
    if (!DatabaseConnection.instance) {
      DatabaseConnection.instance = new PrismaClient({
        log: [
          {
            emit: 'event',
            level: 'query',
          },
          {
            emit: 'event',
            level: 'error',
          },
          {
            emit: 'event',
            level: 'info',
          },
          {
            emit: 'event',
            level: 'warn',
          },
        ],
      });

      // Log queries in development
      if (process.env.NODE_ENV === 'development') {
        DatabaseConnection.instance.$on('query' as never, (e: any) => {
          logger.debug('Query:', {
            query: e.query,
            params: e.params,
            duration: `${e.duration}ms`,
          });
        });
      }

      // Log errors
      DatabaseConnection.instance.$on('error' as never, (e: any) => {
        logger.error('Database error:', e);
      });

      // Log warnings
      DatabaseConnection.instance.$on('warn' as never, (e: any) => {
        logger.warn('Database warning:', e);
      });

      logger.info('Database connection established');
    }

    return DatabaseConnection.instance;
  }

  public static async disconnect(): Promise<void> {
    if (DatabaseConnection.instance) {
      await DatabaseConnection.instance.$disconnect();
      logger.info('Database connection closed');
    }
  }

  public static async healthCheck(): Promise<boolean> {
    try {
      const instance = DatabaseConnection.getInstance();
      await instance.$queryRaw`SELECT 1`;
      return true;
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }
}

export const prisma = DatabaseConnection.getInstance();
export const disconnectDatabase = DatabaseConnection.disconnect;
export const databaseHealthCheck = DatabaseConnection.healthCheck;
