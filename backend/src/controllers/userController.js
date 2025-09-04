const bcrypt = require('bcryptjs');
const { prisma } = require('../models');
const { 
  validateProfileUpdate, 
  validatePasswordChange,
  sanitizeInput 
} = require('../utils/validation');
const { 
  ValidationError,
  AuthenticationError,
  NotFoundError 
} = require('../middleware/errorHandler');
const logger = require('../utils/logger');

/**
 * Get user profile
 */
const getProfile = async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      email_verified: true,
      account_status: true,
      created_at: true,
      updated_at: true
    }
  });

  if (!user) {
    throw new NotFoundError('User profile not found');
  }

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: { user }
  });
};

/**
 * Update user profile
 */
const updateProfile = async (req, res) => {
  // Sanitize input
  const sanitizedData = sanitizeInput(req.body);
  
  // Validate input
  const { error, value } = validateProfileUpdate(sanitizedData);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const updateData = {};
  
  // Prepare update data
  if (value.name) {
    updateData.name = value.name.trim();
  }
  
  if (value.email) {
    const emailLower = value.email.toLowerCase();
    
    // Check if email is already taken by another user
    const existingUser = await prisma.user.findFirst({
      where: {
        email: emailLower,
        id: { not: req.user.id }
      }
    });
    
    if (existingUser) {
      throw new ValidationError('Email is already taken by another user');
    }
    
    updateData.email = emailLower;
    updateData.email_verified = false; // Reset verification when email changes
  }

  // Update user
  const updatedUser = await prisma.user.update({
    where: { id: req.user.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      email_verified: true,
      account_status: true,
      created_at: true,
      updated_at: true
    }
  });

  logger.info('User profile updated', {
    userId: req.user.id,
    updatedFields: Object.keys(updateData),
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Profile updated successfully',
    data: { user: updatedUser }
  });
};

/**
 * Change user password
 */
const changePassword = async (req, res) => {
  // Sanitize input
  const sanitizedData = sanitizeInput(req.body);
  
  // Validate input
  const { error, value } = validatePasswordChange(sanitizedData);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { currentPassword, newPassword } = value;

  // Get current user with password
  const user = await prisma.user.findUnique({
    where: { id: req.user.id },
    select: {
      id: true,
      password_hash: true,
      account_status: true
    }
  });

  if (!user) {
    throw new NotFoundError('User not found');
  }

  // Verify current password
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isValidPassword) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Hash new password
  const saltRounds = 12;
  const hashedNewPassword = await bcrypt.hash(newPassword, saltRounds);

  // Update password
  await prisma.user.update({
    where: { id: req.user.id },
    data: { 
      password_hash: hashedNewPassword,
      updated_at: new Date()
    }
  });

  // Invalidate all existing sessions (force re-login)
  await prisma.userSession.deleteMany({
    where: { user_id: req.user.id }
  });

  logger.info('User password changed', {
    userId: req.user.id,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Password changed successfully. Please log in again with your new password.'
  });
};

/**
 * Get user statistics
 */
const getUserStats = async (req, res) => {
  const userId = req.user.id;

  // Get job statistics
  const jobStats = await prisma.cronJob.groupBy({
    by: ['status'],
    where: { user_id: userId },
    _count: { id: true }
  });

  // Get execution statistics
  const executionStats = await prisma.jobExecution.groupBy({
    by: ['status'],
    where: {
      job: {
        user_id: userId
      }
    },
    _count: { id: true }
  });

  // Get total counts
  const totalJobs = await prisma.cronJob.count({
    where: { user_id: userId }
  });

  const totalExecutions = await prisma.jobExecution.count({
    where: {
      job: {
        user_id: userId
      }
    }
  });

  // Get recent activity
  const recentExecutions = await prisma.jobExecution.findMany({
    where: {
      job: {
        user_id: userId
      }
    },
    include: {
      job: {
        select: {
          name: true,
          url: true
        }
      }
    },
    orderBy: { executed_at: 'desc' },
    take: 5
  });

  // Calculate success rate
  const successfulExecutions = executionStats.find(stat => stat.status === 'success')?._count.id || 0;
  const successRate = totalExecutions > 0 ? (successfulExecutions / totalExecutions * 100).toFixed(2) : 0;

  const stats = {
    jobs: {
      total: totalJobs,
      byStatus: jobStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, { active: 0, paused: 0, deleted: 0 })
    },
    executions: {
      total: totalExecutions,
      byStatus: executionStats.reduce((acc, stat) => {
        acc[stat.status] = stat._count.id;
        return acc;
      }, { success: 0, failed: 0, timeout: 0, cancelled: 0 }),
      successRate: parseFloat(successRate)
    },
    recentActivity: recentExecutions
  };

  res.json({
    success: true,
    message: 'User statistics retrieved successfully',
    data: { stats }
  });
};

/**
 * Get user activity log (recent actions)
 */
const getUserActivity = async (req, res) => {
  const userId = req.user.id;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  // Get recent job executions as activity
  const activities = await prisma.jobExecution.findMany({
    where: {
      job: {
        user_id: userId
      }
    },
    include: {
      job: {
        select: {
          name: true,
          url: true,
          method: true
        }
      }
    },
    orderBy: { executed_at: 'desc' },
    skip: offset,
    take: limit
  });

  // Get total count for pagination
  const totalCount = await prisma.jobExecution.count({
    where: {
      job: {
        user_id: userId
      }
    }
  });

  const totalPages = Math.ceil(totalCount / limit);

  res.json({
    success: true,
    message: 'User activity retrieved successfully',
    data: {
      activities,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    }
  });
};

/**
 * Delete user account (soft delete)
 */
const deleteAccount = async (req, res) => {
  const userId = req.user.id;

  // Soft delete: change account status instead of actually deleting
  await prisma.user.update({
    where: { id: userId },
    data: {
      account_status: 'deleted',
      email: `deleted_${Date.now()}_${req.user.email}`, // Prevent email conflicts
      updated_at: new Date()
    }
  });

  // Deactivate all user's cron jobs
  await prisma.cronJob.updateMany({
    where: { user_id: userId },
    data: { status: 'deleted' }
  });

  // Delete all user sessions
  await prisma.userSession.deleteMany({
    where: { user_id: userId }
  });

  logger.info('User account deleted (soft delete)', {
    userId: userId,
    email: req.user.email,
    ip: req.ip
  });

  res.json({
    success: true,
    message: 'Account deleted successfully. We\'re sorry to see you go!'
  });
};

module.exports = {
  getProfile,
  updateProfile,
  changePassword,
  getUserStats,
  getUserActivity,
  deleteAccount
};