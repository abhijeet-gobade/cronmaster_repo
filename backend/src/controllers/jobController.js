const { prisma } = require('../models');
const { 
  validateCronJobCreation, 
  validateCronJobUpdate, 
  validatePagination,
  sanitizeInput 
} = require('../utils/validation');
const { 
  validateCronExpression, 
  parseCronExpression, 
  getNextExecutionTime 
} = require('../utils/cronUtils');
const { 
  ValidationError, 
  NotFoundError,
  AuthorizationError 
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Create a new cron job
 */
const createJob = async (req, res) => {
  // Sanitize input
  const sanitizedData = sanitizeInput(req.body);
  
  // Validate input
  const { error, value } = validateCronJobCreation(sanitizedData);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { name, url, method, cronExpression, timezone, headers, body, description } = value;

  // Validate cron expression
  const cronValidation = validateCronExpression(cronExpression);
  if (!cronValidation.isValid) {
    throw new ValidationError(`Invalid cron expression: ${cronValidation.error}`);
  }

  // Calculate next execution time
  const nextExecution = getNextExecutionTime(cronExpression, timezone);

  // Create the job
  const job = await prisma.cronJob.create({
    data: {
      user_id: req.user.id,
      name: name.trim(),
      url: url.trim(),
      method: method.toUpperCase(),
      cron_expression: cronExpression.trim(),
      timezone: timezone || 'UTC',
      headers: headers || {},
      body: body || null,
      next_execution: nextExecution,
      description: description || null
    },
    select: {
      id: true,
      name: true,
      url: true,
      method: true,
      cron_expression: true,
      timezone: true,
      headers: true,
      body: true,
      status: true,
      success_count: true,
      failure_count: true,
      last_execution: true,
      next_execution: true,
      created_at: true,
      updated_at: true,
      description: true
    }
  });

  logger.info('Cron job created', {
    userId: req.user.id,
    jobId: job.id,
    jobName: job.name,
    cronExpression: job.cron_expression
  });

  res.status(201).json({
    success: true,
    message: 'Cron job created successfully',
    data: {
      job: {
        ...job,
        cronDescription: parseCronExpression(job.cron_expression)
      }
    }
  });
};

/**
 * Get all jobs for the authenticated user
 */
const getJobs = async (req, res) => {
  // Validate pagination parameters
  const { error, value } = validatePagination(req.query);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { page, limit, sortBy, sortOrder } = value;
  const offset = (page - 1) * limit;

  // Build where clause for filtering
  const where = { user_id: req.user.id };
  
  // Add status filter if provided
  if (req.query.status && ['active', 'paused', 'deleted'].includes(req.query.status)) {
    where.status = req.query.status;
  } else {
    // By default, exclude deleted jobs
    where.status = { not: 'deleted' };
  }

  // Add search filter if provided
  if (req.query.search) {
    const searchTerm = req.query.search.trim();
    where.OR = [
      { name: { contains: searchTerm, mode: 'insensitive' } },
      { url: { contains: searchTerm, mode: 'insensitive' } }
    ];
  }

  // Get jobs with pagination
  const [jobs, totalCount] = await Promise.all([
    prisma.cronJob.findMany({
      where,
      select: {
        id: true,
        name: true,
        url: true,
        method: true,
        cron_expression: true,
        timezone: true,
        status: true,
        success_count: true,
        failure_count: true,
        last_execution: true,
        next_execution: true,
        created_at: true,
        updated_at: true,
        description: true
      },
      orderBy: { [sortBy]: sortOrder },
      skip: offset,
      take: limit
    }),
    prisma.cronJob.count({ where })
  ]);

  // Add cron description to each job
  const jobsWithDescription = jobs.map(job => ({
    ...job,
    cronDescription: parseCronExpression(job.cron_expression),
    successRate: job.success_count + job.failure_count > 0 
      ? ((job.success_count / (job.success_count + job.failure_count)) * 100).toFixed(2)
      : 0
  }));

  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    message: 'Jobs retrieved successfully',
    data: {
      jobs: jobsWithDescription,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        pageSize: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
};

/**
 * Get a specific job by ID
 */
const getJobById = async (req, res) => {
  const jobId = parseInt(req.params.id);

  if (isNaN(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  const job = await prisma.cronJob.findFirst({
    where: { 
      id: jobId,
      user_id: req.user.id,
      status: { not: 'deleted' }
    },
    include: {
      executions: {
        orderBy: { executed_at: 'desc' },
        take: 10,
        select: {
          id: true,
          executed_at: true,
          status: true,
          duration: true,
          response_code: true,
          error_message: true
        }
      }
    }
  });

  if (!job) {
    throw new NotFoundError('Job not found');
  }

  const jobWithDescription = {
    ...job,
    cronDescription: parseCronExpression(job.cron_expression),
    successRate: job.success_count + job.failure_count > 0 
      ? ((job.success_count / (job.success_count + job.failure_count)) * 100).toFixed(2)
      : 0
  };

  res.json({
    success: true,
    message: 'Job retrieved successfully',
    data: { job: jobWithDescription }
  });
};

/**
 * Update a job
 */
const updateJob = async (req, res) => {
  const jobId = parseInt(req.params.id);

  if (isNaN(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  // Check if job exists and belongs to user
  const existingJob = await prisma.cronJob.findFirst({
    where: { 
      id: jobId,
      user_id: req.user.id,
      status: { not: 'deleted' }
    }
  });

  if (!existingJob) {
    throw new NotFoundError('Job not found');
  }

  // Sanitize input
  const sanitizedData = sanitizeInput(req.body);
  
  // Validate input
  const { error, value } = validateCronJobUpdate(sanitizedData);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  // Prepare update data
  const updateData = {};
  
  if (value.name) updateData.name = value.name.trim();
  if (value.url) updateData.url = value.url.trim();
  if (value.method) updateData.method = value.method.toUpperCase();
  if (value.timezone) updateData.timezone = value.timezone;
  if (value.headers !== undefined) updateData.headers = value.headers;
  if (value.body !== undefined) updateData.body = value.body;
  if (value.status) updateData.status = value.status;
  if (value.description !== undefined) updateData.description = value.description;

  // Handle cron expression update
  if (value.cronExpression) {
    const cronValidation = validateCronExpression(value.cronExpression);
    if (!cronValidation.isValid) {
      throw new ValidationError(`Invalid cron expression: ${cronValidation.error}`);
    }
    
    updateData.cron_expression = value.cronExpression.trim();
    updateData.next_execution = getNextExecutionTime(value.cronExpression, value.timezone || existingJob.timezone);
  }

  // Update the job
  const updatedJob = await prisma.cronJob.update({
    where: { id: jobId },
    data: {
      ...updateData,
      updated_at: new Date()
    },
    select: {
      id: true,
      name: true,
      url: true,
      method: true,
      cron_expression: true,
      timezone: true,
      headers: true,
      body: true,
      status: true,
      success_count: true,
      failure_count: true,
      last_execution: true,
      next_execution: true,
      created_at: true,
      updated_at: true,
      description: true
    }
  });

  logger.info('Cron job updated', {
    userId: req.user.id,
    jobId: updatedJob.id,
    updatedFields: Object.keys(updateData)
  });

  res.json({
    success: true,
    message: 'Job updated successfully',
    data: {
      job: {
        ...updatedJob,
        cronDescription: parseCronExpression(updatedJob.cron_expression)
      }
    }
  });
};

/**
 * Delete a job (soft delete)
 */
const deleteJob = async (req, res) => {
  const jobId = parseInt(req.params.id);

  if (isNaN(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  // Check if job exists and belongs to user
  const existingJob = await prisma.cronJob.findFirst({
    where: { 
      id: jobId,
      user_id: req.user.id,
      status: { not: 'deleted' }
    }
  });

  if (!existingJob) {
    throw new NotFoundError('Job not found');
  }

  // Soft delete the job
  await prisma.cronJob.update({
    where: { id: jobId },
    data: { 
      status: 'deleted',
      updated_at: new Date()
    }
  });

  logger.info('Cron job deleted', {
    userId: req.user.id,
    jobId: jobId,
    jobName: existingJob.name
  });

  res.json({
    success: true,
    message: 'Job deleted successfully'
  });
};

/**
 * Toggle job status (active/paused)
 */
const toggleJobStatus = async (req, res) => {
  const jobId = parseInt(req.params.id);

  if (isNaN(jobId)) {
    throw new ValidationError('Invalid job ID');
  }

  // Check if job exists and belongs to user
  const existingJob = await prisma.cronJob.findFirst({
    where: { 
      id: jobId,
      user_id: req.user.id,
      status: { not: 'deleted' }
    }
  });

  if (!existingJob) {
    throw new NotFoundError('Job not found');
  }

  const newStatus = existingJob.status === 'active' ? 'paused' : 'active';

  // Update job status
  const updatedJob = await prisma.cronJob.update({
    where: { id: jobId },
    data: { 
      status: newStatus,
      updated_at: new Date(),
      // Recalculate next execution if activating
      ...(newStatus === 'active' && {
        next_execution: getNextExecutionTime(existingJob.cron_expression, existingJob.timezone)
      })
    },
    select: {
      id: true,
      name: true,
      status: true,
      next_execution: true
    }
  });

  logger.info('Cron job status toggled', {
    userId: req.user.id,
    jobId: jobId,
    oldStatus: existingJob.status,
    newStatus: newStatus
  });

  res.json({
    success: true,
    message: `Job ${newStatus === 'active' ? 'activated' : 'paused'} successfully`,
    data: { job: updatedJob }
  });
};

/**
 * Get job statistics for dashboard
 */
const getJobStats = async (req, res) => {
  const userId = req.user.id;

  // Get job counts by status
  const jobStats = await prisma.cronJob.groupBy({
    by: ['status'],
    where: { 
      user_id: userId,
      status: { not: 'deleted' }
    },
    _count: { id: true }
  });

  // Get execution stats for last 30 days
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const executionStats = await prisma.jobExecution.groupBy({
    by: ['status'],
    where: {
      job: { user_id: userId },
      executed_at: { gte: thirtyDaysAgo }
    },
    _count: { id: true }
  });

  // Get total execution count
  const totalExecutions = await prisma.jobExecution.count({
    where: {
      job: { user_id: userId }
    }
  });

  // Calculate success rate
  const successfulExecutions = executionStats.find(stat => stat.status === 'success')?._count.id || 0;
  const totalRecentExecutions = executionStats.reduce((sum, stat) => sum + stat._count.id, 0);
  const successRate = totalRecentExecutions > 0 
    ? ((successfulExecutions / totalRecentExecutions) * 100).toFixed(2)
    : 0;

  // Format job stats
  const formattedJobStats = jobStats.reduce((acc, stat) => {
    acc[stat.status] = stat._count.id;
    return acc;
  }, { active: 0, paused: 0 });

  // Format execution stats
  const formattedExecutionStats = executionStats.reduce((acc, stat) => {
    acc[stat.status] = stat._count.id;
    return acc;
  }, { success: 0, failed: 0, timeout: 0, cancelled: 0 });

  const stats = {
    jobs: {
      total: formattedJobStats.active + formattedJobStats.paused,
      active: formattedJobStats.active,
      paused: formattedJobStats.paused
    },
    executions: {
      total: totalExecutions,
      last30Days: totalRecentExecutions,
      byStatus: formattedExecutionStats,
      successRate: parseFloat(successRate)
    }
  };

  res.json({
    success: true,
    message: 'Job statistics retrieved successfully',
    data: { stats }
  });
};

module.exports = {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  toggleJobStatus,
  getJobStats
};