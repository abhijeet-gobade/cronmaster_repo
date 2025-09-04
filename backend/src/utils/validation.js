const Joi = require('joi');

// Common validation patterns
const patterns = {
  email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  password: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/,
  url: /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_\+.~#?&//=]*)$/,
  cronExpression: /^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/
};

// Custom Joi validators
const customValidators = {
  strongPassword: Joi.string().min(8).pattern(patterns.password).messages({
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    'string.min': 'Password must be at least 8 characters long'
  }),
  
  email: Joi.string().email().pattern(patterns.email).messages({
    'string.email': 'Please provide a valid email address',
    'string.pattern.base': 'Please provide a valid email address'
  }),
  
  url: Joi.string().uri().pattern(patterns.url).messages({
    'string.uri': 'Please provide a valid URL',
    'string.pattern.base': 'URL must start with http:// or https://'
  }),
  
  cronExpression: Joi.string().pattern(patterns.cronExpression).messages({
    'string.pattern.base': 'Please provide a valid cron expression (e.g., "0 0 * * *")'
  })
};

// User registration validation
const validateRegistration = (data) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .required()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters',
        'any.required': 'Name is required'
      }),
    
    email: customValidators.email.required().messages({
      'any.required': 'Email is required'
    }),
    
    password: customValidators.strongPassword.required().messages({
      'any.required': 'Password is required'
    }),
    
    confirmPassword: Joi.string()
      .valid(Joi.ref('password'))
      .required()
      .messages({
        'any.only': 'Passwords do not match',
        'any.required': 'Password confirmation is required'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

// User login validation
const validateLogin = (data) => {
  const schema = Joi.object({
    email: customValidators.email.required().messages({
      'any.required': 'Email is required'
    }),
    
    password: Joi.string().required().messages({
      'any.required': 'Password is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Password change validation
const validatePasswordChange = (data) => {
  const schema = Joi.object({
    currentPassword: Joi.string().required().messages({
      'any.required': 'Current password is required'
    }),
    
    newPassword: customValidators.strongPassword.required().messages({
      'any.required': 'New password is required'
    }),
    
    confirmNewPassword: Joi.string()
      .valid(Joi.ref('newPassword'))
      .required()
      .messages({
        'any.only': 'Password confirmation does not match',
        'any.required': 'Password confirmation is required'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

// Profile update validation
const validateProfileUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(2)
      .max(50)
      .trim()
      .messages({
        'string.min': 'Name must be at least 2 characters long',
        'string.max': 'Name cannot exceed 50 characters'
      }),
    
    email: customValidators.email.messages({
      'string.email': 'Please provide a valid email address'
    })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  });

  return schema.validate(data, { abortEarly: false });
};

// Cron job creation validation
const validateCronJobCreation = (data) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .required()
      .messages({
        'string.min': 'Job name is required',
        'string.max': 'Job name cannot exceed 100 characters',
        'any.required': 'Job name is required'
      }),
    
    url: customValidators.url.required().messages({
      'any.required': 'Target URL is required'
    }),
    
    method: Joi.string()
      .valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH')
      .default('GET')
      .messages({
        'any.only': 'Method must be one of: GET, POST, PUT, DELETE, PATCH'
      }),
    
    cronExpression: Joi.string()
      .pattern(/^(\*|([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])|\*\/([0-9]|1[0-9]|2[0-9]|3[0-9]|4[0-9]|5[0-9])) (\*|([0-9]|1[0-9]|2[0-3])|\*\/([0-9]|1[0-9]|2[0-3])) (\*|([1-9]|1[0-9]|2[0-9]|3[0-1])|\*\/([1-9]|1[0-9]|2[0-9]|3[0-1])) (\*|([1-9]|1[0-2])|\*\/([1-9]|1[0-2])) (\*|([0-6])|\*\/([0-6]))$/)
      .required()
      .messages({
        'string.pattern.base': 'Please provide a valid cron expression (e.g., "0 0 * * *")',
        'any.required': 'Cron expression is required'
      }),
    
    timezone: Joi.string()
      .default('UTC')
      .messages({
        'string.base': 'Timezone must be a valid string'
      }),
    
    headers: Joi.object()
      .pattern(Joi.string(), Joi.string())
      .default({})
      .messages({
        'object.base': 'Headers must be a valid object'
      }),
    
    body: Joi.string()
      .allow('')
      .max(10000)
      .messages({
        'string.max': 'Request body cannot exceed 10000 characters'
      }),
    
    description: Joi.string()
      .allow('')
      .max(500)
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      })
  });

  return schema.validate(data, { abortEarly: false });
};

// Cron job update validation
const validateCronJobUpdate = (data) => {
  const schema = Joi.object({
    name: Joi.string()
      .min(1)
      .max(100)
      .trim()
      .messages({
        'string.min': 'Job name cannot be empty',
        'string.max': 'Job name cannot exceed 100 characters'
      }),
    
    url: customValidators.url,
    
    method: Joi.string()
      .valid('GET', 'POST', 'PUT', 'DELETE', 'PATCH')
      .messages({
        'any.only': 'Method must be one of: GET, POST, PUT, DELETE, PATCH'
      }),
    
    cronExpression: customValidators.cronExpression,
    
    timezone: Joi.string(),
    
    headers: Joi.object()
      .pattern(Joi.string(), Joi.string()),
    
    body: Joi.string()
      .allow('')
      .max(10000)
      .messages({
        'string.max': 'Request body cannot exceed 10000 characters'
      }),
    
    status: Joi.string()
      .valid('active', 'paused')
      .messages({
        'any.only': 'Status must be either "active" or "paused"'
      }),
    
    description: Joi.string()
      .allow('')
      .max(500)
      .messages({
        'string.max': 'Description cannot exceed 500 characters'
      })
  }).min(1).messages({
    'object.min': 'At least one field must be provided for update'
  });

  return schema.validate(data, { abortEarly: false });
};

// Token refresh validation
const validateTokenRefresh = (data) => {
  const schema = Joi.object({
    refresh_token: Joi.string().required().messages({
      'any.required': 'Refresh token is required'
    })
  });

  return schema.validate(data, { abortEarly: false });
};

// Pagination validation
const validatePagination = (data) => {
  const schema = Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(10),
    sortBy: Joi.string().default('created_at'),
    sortOrder: Joi.string().valid('asc', 'desc').default('desc')
  });

  return schema.validate(data, { abortEarly: false });
};

// Job execution filter validation
const validateExecutionFilters = (data) => {
  const schema = Joi.object({
    status: Joi.string().valid('success', 'failed', 'timeout', 'cancelled'),
    jobId: Joi.number().integer().positive(),
    startDate: Joi.date().iso(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')),
    ...validatePagination(data).value
  });

  return schema.validate(data, { abortEarly: false });
};

// Sanitize input data
const sanitizeInput = (data) => {
  if (typeof data === 'string') {
    return data.trim().replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  
  if (typeof data === 'object' && data !== null) {
    const sanitized = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return data;
};

module.exports = {
  validateRegistration,
  validateLogin,
  validatePasswordChange,
  validateProfileUpdate,
  validateCronJobCreation,
  validateCronJobUpdate,
  validateTokenRefresh,
  validatePagination,
  validateExecutionFilters,
  sanitizeInput,
  patterns,
  customValidators
};