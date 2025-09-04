const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

// Create Prisma client with logging configuration
const prisma = new PrismaClient({
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
  errorFormat: 'colorless',
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e) => {
    logger.debug('Database Query:', {
      query: e.query,
      params: e.params,
      duration: `${e.duration}ms`,
      timestamp: e.timestamp
    });
  });
}

// Log database errors
prisma.$on('error', (e) => {
  logger.error('Database Error:', {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp
  });
});

// Log database info and warnings
prisma.$on('info', (e) => {
  logger.info('Database Info:', {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp
  });
});

prisma.$on('warn', (e) => {
  logger.warn('Database Warning:', {
    message: e.message,
    target: e.target,
    timestamp: e.timestamp
  });
});

// Database connection check
const checkDatabaseConnection = async () => {
  try {
    await prisma.$connect();
    logger.info('✅ Database connected successfully');
    return true;
  } catch (error) {
    logger.error('❌ Database connection failed:', error);
    return false;
  }
};

// Graceful disconnect
const disconnectDatabase = async () => {
  try {
    await prisma.$disconnect();
    logger.info('🔌 Database disconnected successfully');
  } catch (error) {
    logger.error('❌ Database disconnect failed:', error);
  }
};

// Database health check
const getDatabaseHealth = async () => {
  try {
    const startTime = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    const responseTime = Date.now() - startTime;
    
    return {
      status: 'healthy',
      responseTime: `${responseTime}ms`,
      connected: true,
      timestamp: new Date().toISOString()
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      connected: false,
      error: error.message,
      timestamp: new Date().toISOString()
    };
  }
};

// Initialize database connection
checkDatabaseConnection();

// Handle process termination
process.on('beforeExit', async () => {
  await disconnectDatabase();
});

process.on('SIGTERM', async () => {
  await disconnectDatabase();
});

process.on('SIGINT', async () => {
  await disconnectDatabase();
});

module.exports = {
  prisma,
  checkDatabaseConnection,
  disconnectDatabase,
  getDatabaseHealth
};