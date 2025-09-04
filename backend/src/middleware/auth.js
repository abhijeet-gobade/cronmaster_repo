const { verifyAccessToken, extractTokenFromHeader } = require('../utils/jwt');
const { prisma } = require('../models');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');
const logger = require('../utils/logger');

/**
 * Middleware to authenticate JWT tokens
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Verify the token
    let decoded;
    try {
      decoded = verifyAccessToken(token);
    } catch (error) {
      throw new AuthenticationError(error.message);
    }

    // Check if user still exists and is active
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        account_status: 'active'
      },
      select: {
        id: true,
        name: true,
        email: true,
        account_status: true,
        created_at: true
      }
    });

    if (!user) {
      throw new AuthenticationError('User not found or account inactive');
    }

    // Add user to request object
    req.user = user;
    req.token = token;
    
    // Log successful authentication
    logger.debug('User authenticated successfully', {
      userId: user.id,
      email: user.email,
      route: req.originalUrl
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      route: req.originalUrl
    });
    
    next(error);
  }
};

/**
 * Middleware to check if user owns the resource
 */
const requireOwnership = (resourceType) => {
  return async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      let resource;
      
      switch (resourceType) {
        case 'cronJob':
          resource = await prisma.cronJob.findUnique({
            where: { id: parseInt(id) },
            select: { user_id: true }
          });
          break;
        
        case 'jobExecution':
          resource = await prisma.jobExecution.findUnique({
            where: { id: parseInt(id) },
            include: {
              job: {
                select: { user_id: true }
              }
            }
          });
          break;
        
        default:
          throw new Error(`Unknown resource type: ${resourceType}`);
      }

      if (!resource) {
        throw new AuthorizationError('Resource not found');
      }

      // Check ownership
      const resourceUserId = resourceType === 'jobExecution' 
        ? resource.job.user_id 
        : resource.user_id;

      if (resourceUserId !== userId) {
        throw new AuthorizationError('Access denied: You do not own this resource');
      }

      // Add resource to request for further use
      req.resource = resource;
      next();
    } catch (error) {
      logger.warn('Ownership check failed', {
        error: error.message,
        userId: req.user?.id,
        resourceType,
        resourceId: req.params.id,
        route: req.originalUrl
      });
      
      next(error);
    }
  };
};

/**
 * Middleware to check if user has specific permissions
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      const user = req.user;

      // For now, we'll implement basic permission checks
      // In the future, you could expand this with role-based permissions
      
      switch (permission) {
        case 'manage_jobs':
          // All authenticated users can manage their own jobs
          if (!user) {
            throw new AuthorizationError('Authentication required');
          }
          break;
        
        case 'view_logs':
          // All authenticated users can view their own logs
          if (!user) {
            throw new AuthorizationError('Authentication required');
          }
          break;
        
        case 'admin':
          // Check if user has admin role (implement when needed)
          throw new AuthorizationError('Admin access required');
        
        default:
          throw new AuthorizationError(`Unknown permission: ${permission}`);
      }

      next();
    } catch (error) {
      logger.warn('Permission check failed', {
        error: error.message,
        userId: req.user?.id,
        permission,
        route: req.originalUrl
      });
      
      next(error);
    }
  };
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return next(); // No token provided, continue without authentication
    }

    // Verify the token
    const decoded = verifyAccessToken(token);

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { 
        id: decoded.userId,
        account_status: 'active'
      },
      select: {
        id: true,
        name: true,
        email: true,
        account_status: true
      }
    });

    if (user) {
      req.user = user;
      req.token = token;
      
      logger.debug('Optional authentication successful', {
        userId: user.id,
        route: req.originalUrl
      });
    }

    next();
  } catch (error) {
    // For optional auth, we log the error but don't fail the request
    logger.debug('Optional authentication failed (continuing)', {
      error: error.message,
      route: req.originalUrl
    });
    
    next();
  }
};

/**
 * Middleware to validate user account status
 */
const requireActiveAccount = async (req, res, next) => {
  try {
    const user = req.user;

    if (!user) {
      throw new AuthenticationError('Authentication required');
    }

    if (user.account_status !== 'active') {
      throw new AuthorizationError('Account is not active');
    }

    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware to log user activity
 */
const logUserActivity = (action) => {
  return (req, res, next) => {
    const user = req.user;
    
    if (user) {
      logger.info(`User activity: ${action}`, {
        userId: user.id,
        email: user.email,
        action,
        route: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  requireOwnership,
  requirePermission,
  optionalAuth,
  requireActiveAccount,
  logUserActivity
};