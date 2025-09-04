const logger = require('../utils/logger');

// Custom error classes
class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message, field = null) {
    super(message, 400, 'VALIDATION_ERROR');
    this.field = field;
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication required') {
    super(message, 401, 'AUTHENTICATION_ERROR');
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Insufficient permissions') {
    super(message, 403, 'AUTHORIZATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT_ERROR');
  }
}

class RateLimitError extends AppError {
  constructor(message = 'Too many requests') {
    super(message, 429, 'RATE_LIMIT_ERROR');
  }
}

// Error handler middleware
const errorHandler = (error, req, res, next) => {
  let err = { ...error };
  err.message = error.message;

  // Log error details
  logger.error('Error occurred:', {
    message: err.message,
    stack: error.stack,
    url: req.originalUrl,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id || 'anonymous',
    timestamp: new Date().toISOString()
  });

  // Prisma errors
  if (error.code === 'P2002') {
    const field = error.meta?.target?.[0] || 'field';
    err = new ConflictError(`${field} already exists`);
  } else if (error.code === 'P2025') {
    err = new NotFoundError();
  } else if (error.code?.startsWith('P')) {
    err = new AppError('Database operation failed', 500, 'DATABASE_ERROR');
  }

  // JWT errors
  if (error.name === 'JsonWebTokenError') {
    err = new AuthenticationError('Invalid token');
  } else if (error.name === 'TokenExpiredError') {
    err = new AuthenticationError('Token expired');
  }

  // Validation errors (Joi)
  if (error.isJoi) {
    const message = error.details[0].message.replace(/['"]/g, '');
    err = new ValidationError(message);
  }

  // Mongoose validation errors
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(val => val.message);
    err = new ValidationError(errors.join(', '));
  }

  // Mongoose bad ObjectId
  if (error.name === 'CastError') {
    err = new ValidationError('Invalid ID format');
  }

  // Mongoose duplicate key error
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    err = new ConflictError(`${field} already exists`);
  }

  // Multer errors
  if (error.code === 'LIMIT_FILE_SIZE') {
    err = new ValidationError('File too large');
  }

  // Default to AppError if not already an operational error
  if (!err.isOperational) {
    err = new AppError(
      process.env.NODE_ENV === 'production' 
        ? 'Something went wrong' 
        : err.message,
      err.statusCode || 500,
      'INTERNAL_ERROR'
    );
  }

  // Prepare error response
  const errorResponse = {
    success: false,
    error: {
      message: err.message,
      code: err.code || 'INTERNAL_ERROR',
      ...(err.field && { field: err.field }),
      ...(process.env.NODE_ENV === 'development' && { 
        stack: error.stack,
        details: error 
      })
    },
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method
  };

  // Send error response
  res.status(err.statusCode || 500).json(errorResponse);
};

// Async error wrapper
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

module.exports = {
  errorHandler,
  asyncHandler,
  AppError,
  ValidationError,
  AuthenticationError,
  AuthorizationError,
  NotFoundError,
  ConflictError,
  RateLimitError
};