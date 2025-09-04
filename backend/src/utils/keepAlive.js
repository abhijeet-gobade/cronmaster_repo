const logger = require('./logger');

class KeepAliveService {
  constructor() {
    this.interval = null;
    this.isEnabled = process.env.KEEP_ALIVE_ENABLED === 'true';
    this.intervalTime = parseInt(process.env.KEEP_ALIVE_INTERVAL) || 14 * 60 * 1000; // 14 minutes default
    this.pingCount = 0;
  }

  start() {
    if (!this.isEnabled) {
      logger.info('⏰ Keep-alive service is disabled');
      return;
    }

    if (this.interval) {
      logger.warn('⚠️  Keep-alive service is already running');
      return;
    }

    logger.info(`🔄 Starting keep-alive service (interval: ${this.intervalTime / 1000}s)`);
    
    // Start the interval
    this.interval = setInterval(() => {
      this.ping();
    }, this.intervalTime);

    // Initial ping
    this.ping();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      logger.info('⏹️  Keep-alive service stopped');
    }
  }

  async ping() {
    try {
      this.pingCount++;
      const startTime = Date.now();
      
      // Log keep-alive ping
      logger.info(`💗 Keep-alive ping #${this.pingCount}`, {
        timestamp: new Date().toISOString(),
        uptime: `${Math.floor(process.uptime())}s`,
        memoryUsage: {
          used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024 * 100) / 100}MB`,
          total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024 * 100) / 100}MB`
        },
        pingCount: this.pingCount,
        nextPing: `${this.intervalTime / 1000}s`
      });

      // Perform internal health check
      await this.performHealthCheck();

      const duration = Date.now() - startTime;
      logger.debug(`✅ Keep-alive ping completed in ${duration}ms`);

    } catch (error) {
      logger.error('❌ Keep-alive ping failed:', {
        error: error.message,
        stack: error.stack,
        pingCount: this.pingCount
      });
    }
  }

  async performHealthCheck() {
    // Basic health checks
    const checks = {
      memory: this.checkMemoryUsage(),
      uptime: this.checkUptime(),
      environment: this.checkEnvironment()
    };

    // Log any issues
    Object.entries(checks).forEach(([check, result]) => {
      if (!result.healthy) {
        logger.warn(`⚠️  Health check failed: ${check}`, result);
      }
    });

    return checks;
  }

  checkMemoryUsage() {
    const memUsage = process.memoryUsage();
    const heapUsedMB = memUsage.heapUsed / 1024 / 1024;
    const heapTotalMB = memUsage.heapTotal / 1024 / 1024;
    const usagePercent = (heapUsedMB / heapTotalMB) * 100;

    return {
      healthy: usagePercent < 90, // Alert if using more than 90% of heap
      heapUsed: `${Math.round(heapUsedMB * 100) / 100}MB`,
      heapTotal: `${Math.round(heapTotalMB * 100) / 100}MB`,
      usagePercent: `${Math.round(usagePercent * 100) / 100}%`
    };
  }

  checkUptime() {
    const uptimeSeconds = process.uptime();
    const uptimeHours = uptimeSeconds / 3600;

    return {
      healthy: uptimeSeconds > 60, // Healthy if running for more than 1 minute
      uptime: uptimeSeconds,
      uptimeFormatted: this.formatUptime(uptimeSeconds),
      continuous: uptimeHours > 1 // Flag for continuous operation
    };
  }

  checkEnvironment() {
    const requiredEnvVars = [
      'DATABASE_URL',
      'JWT_SECRET',
      'JWT_REFRESH_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

    return {
      healthy: missingVars.length === 0,
      nodeEnv: process.env.NODE_ENV,
      missingVars: missingVars,
      port: process.env.PORT || 3001
    };
  }

  formatUptime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    } else {
      return `${secs}s`;
    }
  }

  getStatus() {
    return {
      enabled: this.isEnabled,
      running: this.interval !== null,
      intervalTime: this.intervalTime,
      pingCount: this.pingCount,
      nextPingIn: this.interval ? this.intervalTime : null
    };
  }
}

// Export singleton instance
module.exports = new KeepAliveService();