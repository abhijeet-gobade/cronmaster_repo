// backend/src/services/jobWorker.js
const cron = require('node-cron');
const axios = require('axios');
const { prisma } = require('../models');
const logger = require('../utils/logger');
const { getNextExecutionTime } = require('../utils/cronUtils');

class JobWorkerService {
  constructor() {
    this.scheduledJobs = new Map();
    this.isRunning = false;
  }

  /**
   * Start the job worker service
   */
  async start() {
    if (this.isRunning) {
      logger.warn('Job worker is already running');
      return;
    }

    this.isRunning = true;
    logger.info('🚀 Starting Job Worker Service...');

    // Load and schedule all active jobs
    await this.loadAndScheduleJobs();

    // Start periodic cleanup and rescheduling
    this.startMaintenanceTasks();

    logger.info('✅ Job Worker Service started successfully');
  }

  /**
   * Stop the job worker service
   */
  async stop() {
    if (!this.isRunning) return;

    logger.info('🛑 Stopping Job Worker Service...');
    
    // Stop all scheduled jobs
    for (const [jobId, task] of this.scheduledJobs) {
      if (task && task.destroy) {
        task.destroy();
      }
    }
    
    this.scheduledJobs.clear();
    this.isRunning = false;
    
    logger.info('✅ Job Worker Service stopped');
  }

  /**
   * Load all active jobs from database and schedule them
   */
  async loadAndScheduleJobs() {
    try {
      const activeJobs = await prisma.cronJob.findMany({
        where: { 
          status: 'active',
          next_execution: {
            not: null
          }
        },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      logger.info(`📋 Loading ${activeJobs.length} active jobs`);

      for (const job of activeJobs) {
        await this.scheduleJob(job);
      }

      logger.info(`⏰ Scheduled ${this.scheduledJobs.size} jobs`);
    } catch (error) {
      logger.error('❌ Failed to load jobs:', error);
    }
  }

  /**
   * Schedule a single job
   */
  async scheduleJob(job) {
    try {
      // Remove existing scheduled job if it exists
      if (this.scheduledJobs.has(job.id)) {
        const existingTask = this.scheduledJobs.get(job.id);
        if (existingTask && existingTask.destroy) {
          existingTask.destroy();
        }
      }

      // Create cron task
      const task = cron.schedule(job.cron_expression, async () => {
        await this.executeJob(job);
      }, {
        scheduled: true,
        timezone: job.timezone || 'UTC'
      });

      this.scheduledJobs.set(job.id, task);
      
      logger.debug(`⏰ Scheduled job: ${job.name} (${job.cron_expression})`);
    } catch (error) {
      logger.error(`❌ Failed to schedule job ${job.id}:`, error);
    }
  }

  /**
   * Execute a job
   */
  async executeJob(job) {
    const startTime = Date.now();
    let execution = null;

    try {
      logger.info(`🚀 Executing job: ${job.name} (ID: ${job.id})`);

      // Create execution record
      execution = await prisma.jobExecution.create({
        data: {
          job_id: job.id,
          status: 'running',
          triggered_by: 'cron'
        }
      });

      // Prepare request options
      const requestOptions = {
        method: job.method,
        url: job.url,
        timeout: 30000, // 30 second timeout
        headers: {
          'User-Agent': 'CronMaster/1.0',
          ...job.headers
        },
        validateStatus: () => true // Don't throw on any status code
      };

      // Add body for POST/PUT/PATCH requests
      if (['POST', 'PUT', 'PATCH'].includes(job.method) && job.body) {
        try {
          requestOptions.data = JSON.parse(job.body);
        } catch (e) {
          requestOptions.data = job.body;
        }
      }

      // Execute HTTP request
      const response = await axios(requestOptions);
      const duration = Date.now() - startTime;

      // Determine if execution was successful (2xx status codes)
      const isSuccess = response.status >= 200 && response.status < 300;

      // Update execution record
      await prisma.jobExecution.update({
        where: { id: execution.id },
        data: {
          status: isSuccess ? 'success' : 'failed',
          duration,
          response_code: response.status,
          response_body: JSON.stringify(response.data).substring(0, 10000), // Limit to 10KB
          response_headers: response.headers
        }
      });

      // Update job statistics
      const updateData = {
        last_execution: new Date(),
        next_execution: getNextExecutionTime(job.cron_expression, job.timezone)
      };

      if (isSuccess) {
        updateData.success_count = { increment: 1 };
      } else {
        updateData.failure_count = { increment: 1 };
      }

      await prisma.cronJob.update({
        where: { id: job.id },
        data: updateData
      });

      logger.info(`✅ Job executed successfully: ${job.name} (${response.status}) in ${duration}ms`);

    } catch (error) {
      const duration = Date.now() - startTime;

      logger.error(`❌ Job execution failed: ${job.name}`, error);

      if (execution) {
        // Update execution record with error
        await prisma.jobExecution.update({
          where: { id: execution.id },
          data: {
            status: 'failed',
            duration,
            error_message: error.message,
            response_code: error.response?.status || null
          }
        });
      }

      // Update job failure count
      await prisma.cronJob.update({
        where: { id: job.id },
        data: {
          failure_count: { increment: 1 },
          last_execution: new Date(),
          next_execution: getNextExecutionTime(job.cron_expression, job.timezone)
        }
      });
    }
  }

  /**
   * Add or update a job in the scheduler
   */
  async addJob(jobId) {
    try {
      const job = await prisma.cronJob.findUnique({
        where: { id: jobId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (job && job.status === 'active') {
        await this.scheduleJob(job);
        logger.info(`➕ Added job to scheduler: ${job.name}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to add job ${jobId} to scheduler:`, error);
    }
  }

  /**
   * Remove a job from the scheduler
   */
  removeJob(jobId) {
    try {
      if (this.scheduledJobs.has(jobId)) {
        const task = this.scheduledJobs.get(jobId);
        if (task && task.destroy) {
          task.destroy();
        }
        this.scheduledJobs.delete(jobId);
        logger.info(`➖ Removed job from scheduler: ${jobId}`);
      }
    } catch (error) {
      logger.error(`❌ Failed to remove job ${jobId} from scheduler:`, error);
    }
  }

  /**
   * Manually trigger a job execution
   */
  async triggerJob(jobId) {
    try {
      const job = await prisma.cronJob.findUnique({
        where: { id: jobId },
        include: {
          user: {
            select: { id: true, name: true, email: true }
          }
        }
      });

      if (!job) {
        throw new Error('Job not found');
      }

      // Execute job immediately
      await this.executeJob(job);
      
      return { success: true, message: 'Job triggered successfully' };
    } catch (error) {
      logger.error(`❌ Failed to trigger job ${jobId}:`, error);
      throw error;
    }
  }

  /**
   * Start maintenance tasks (cleanup, health checks, etc.)
   */
  startMaintenanceTasks() {
    // Cleanup old executions every hour
    cron.schedule('0 * * * *', async () => {
      await this.cleanupOldExecutions();
    });

    // Reload jobs every 5 minutes to catch database changes
    cron.schedule('*/5 * * * *', async () => {
      await this.reloadJobs();
    });

    // Health check every minute
    cron.schedule('* * * * *', async () => {
      await this.healthCheck();
    });
  }

  /**
   * Cleanup old job executions (keep last 1000 per job)
   */
  async cleanupOldExecutions() {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - 30); // Keep 30 days

      const deletedCount = await prisma.jobExecution.deleteMany({
        where: {
          executed_at: { lt: cutoffDate }
        }
      });

      if (deletedCount.count > 0) {
        logger.info(`🧹 Cleaned up ${deletedCount.count} old job executions`);
      }
    } catch (error) {
      logger.error('❌ Failed to cleanup old executions:', error);
    }
  }

  /**
   * Reload jobs from database (in case of external changes)
   */
  async reloadJobs() {
    try {
      const activeJobs = await prisma.cronJob.findMany({
        where: { status: 'active' },
        select: { id: true }
      });

      const activeJobIds = new Set(activeJobs.map(job => job.id));
      const scheduledJobIds = new Set(this.scheduledJobs.keys());

      // Remove jobs that are no longer active
      for (const jobId of scheduledJobIds) {
        if (!activeJobIds.has(jobId)) {
          this.removeJob(jobId);
        }
      }

      // Add new active jobs
      for (const jobId of activeJobIds) {
        if (!scheduledJobIds.has(jobId)) {
          await this.addJob(jobId);
        }
      }
    } catch (error) {
      logger.error('❌ Failed to reload jobs:', error);
    }
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      const stats = {
        isRunning: this.isRunning,
        scheduledJobs: this.scheduledJobs.size,
        uptime: process.uptime(),
        memory: process.memoryUsage()
      };

      logger.debug('💓 Worker health check:', stats);
    } catch (error) {
      logger.error('❌ Health check failed:', error);
    }
  }

  /**
   * Get worker statistics
   */
  getStats() {
    return {
      isRunning: this.isRunning,
      scheduledJobs: this.scheduledJobs.size,
      jobIds: Array.from(this.scheduledJobs.keys()),
      uptime: process.uptime(),
      memory: process.memoryUsage()
    };
  }
}

// Create singleton instance
const jobWorker = new JobWorkerService();

module.exports = jobWorker;