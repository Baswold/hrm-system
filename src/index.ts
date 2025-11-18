import dotenv from 'dotenv';
import createApp from './app';
import { APP_CONFIG } from './config/constants';
import logger from './config/logger';
import { disconnectDatabase } from './config/database';

// Load environment variables
dotenv.config();

/**
 * Start the server
 */
const startServer = async () => {
  try {
    // Create Express app
    const app = createApp();

    // Start listening
    const server = app.listen(APP_CONFIG.PORT, () => {
      logger.info(`
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   ${APP_CONFIG.NAME} - ${APP_CONFIG.VERSION}                        ║
║                                                           ║
║   Environment: ${APP_CONFIG.ENV.padEnd(40)}║
║   Port:        ${APP_CONFIG.PORT.toString().padEnd(40)}║
║   URL:         http://localhost:${APP_CONFIG.PORT}${' '.repeat(22)}║
║   API:         http://localhost:${APP_CONFIG.PORT}/api/${APP_CONFIG.VERSION}${' '.repeat(15)}║
║   Health:      http://localhost:${APP_CONFIG.PORT}/api/${APP_CONFIG.VERSION}/health${' '.repeat(8)}║
║                                                           ║
║   Status:      ✓ Server is running                       ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
      `);

      logger.info('Server started successfully');
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received. Starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        // Close database connection
        await disconnectDatabase();

        logger.info('Graceful shutdown completed');
        process.exit(0);
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('Forcing shutdown after timeout');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    // Handle unhandled promise rejections
    process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();
