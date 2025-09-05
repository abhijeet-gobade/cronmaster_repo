require('dotenv').config();
const app = require('./src/app');
const { checkDatabaseConnection, disconnectDatabase } = require('./src/models');
const jobWorker = require('./src/services/jobWorker');
const logger = require('./src/utils/logger');
const keepAlive = require('./src/utils/keepAlive');

const PORT = process.env.PORT || 3001;

async function startServer() {
  try {
    // Check database connection
    const isDbConnected = await checkDatabaseConnection();
    if (!isDbConnected) {
      throw new Error('Database connection failed');
    }

    // Start the HTTP server
    const server = app.listen(PORT, () => {
      logger.info(`🚀 CronMaster API Server running on port ${PORT}`);
      logger.info(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
      logger.info(`🌐 API URL: http://localhost:${PORT}`);
      logger.info(`📊 Health check available at http://localhost:${PORT}/health`);
    });

    // Start keep-alive service to prevent Render from sleeping
    if (process.env.NODE_ENV === 'production') {
      keepAlive.start();
    }

    // Start the job worker service
    await jobWorker.start();

    // Graceful shutdown handlers
    const gracefulShutdown = async (signal) => {
      logger.info(`🛑 Received ${signal}, starting graceful shutdown...`);

      // Stop accepting new connections
      server.close(async () => {
        logger.info('📪 HTTP server closed');

        try {
          // Stop keep-alive service
          if (process.env.NODE_ENV === 'production') {
            keepAlive.stop();
          }

          // Stop job worker
          await jobWorker.stop();
          
          // Close database connections
          await disconnectDatabase();

          logger.info('✅ Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('❌ Error during shutdown:', error);
          process.exit(1);
        }
      });

      // Force shutdown after 30 seconds
      setTimeout(() => {
        logger.error('❌ Forced shutdown - server did not close gracefully');
        process.exit(1);
      }, 30000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', error);
      gracefulShutdown('uncaughtException');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      gracefulShutdown('unhandledRejection');
    });

  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer();