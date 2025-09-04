const logger = require('./logger');

/**
 * Validate cron expression
 * @param {string} cronExpression - Cron expression to validate
 * @returns {Object} Validation result
 */
const validateCronExpression = (cronExpression) => {
  try {
    const parts = cronExpression.trim().split(/\s+/);
    
    if (parts.length !== 5) {
      return {
        isValid: false,
        error: 'Cron expression must have exactly 5 parts (minute hour day month day-of-week)'
      };
    }

    const [minute, hour, day, month, dayOfWeek] = parts;

    // Validate each part
    const validations = [
      { value: minute, min: 0, max: 59, name: 'minute' },
      { value: hour, min: 0, max: 23, name: 'hour' },
      { value: day, min: 1, max: 31, name: 'day' },
      { value: month, min: 1, max: 12, name: 'month' },
      { value: dayOfWeek, min: 0, max: 6, name: 'day-of-week' }
    ];

    for (const validation of validations) {
      const result = validateCronPart(validation.value, validation.min, validation.max, validation.name);
      if (!result.isValid) {
        return result;
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: 'Invalid cron expression format'
    };
  }
};

/**
 * Validate individual cron part
 * @param {string} part - Cron part to validate
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @param {string} name - Part name for error messages
 * @returns {Object} Validation result
 */
const validateCronPart = (part, min, max, name) => {
  // Allow asterisk
  if (part === '*') {
    return { isValid: true };
  }

  // Handle step values (*/5)
  if (part.includes('/')) {
    const [range, step] = part.split('/');
    if (range !== '*' && !isValidNumber(range, min, max)) {
      return {
        isValid: false,
        error: `Invalid range in ${name}: ${range}`
      };
    }
    if (!isValidNumber(step, 1, max)) {
      return {
        isValid: false,
        error: `Invalid step value in ${name}: ${step}`
      };
    }
    return { isValid: true };
  }

  // Handle ranges (1-5)
  if (part.includes('-')) {
    const [start, end] = part.split('-');
    if (!isValidNumber(start, min, max) || !isValidNumber(end, min, max)) {
      return {
        isValid: false,
        error: `Invalid range in ${name}: ${part}`
      };
    }
    if (parseInt(start) >= parseInt(end)) {
      return {
        isValid: false,
        error: `Invalid range in ${name}: start must be less than end`
      };
    }
    return { isValid: true };
  }

  // Handle comma-separated values (1,3,5)
  if (part.includes(',')) {
    const values = part.split(',');
    for (const value of values) {
      if (!isValidNumber(value.trim(), min, max)) {
        return {
          isValid: false,
          error: `Invalid value in ${name}: ${value}`
        };
      }
    }
    return { isValid: true };
  }

  // Handle single number
  if (!isValidNumber(part, min, max)) {
    return {
      isValid: false,
      error: `Invalid value in ${name}: ${part}. Must be between ${min} and ${max}`
    };
  }

  return { isValid: true };
};

/**
 * Check if a string is a valid number within range
 * @param {string} value - Value to check
 * @param {number} min - Minimum value
 * @param {number} max - Maximum value
 * @returns {boolean} Is valid number
 */
const isValidNumber = (value, min, max) => {
  const num = parseInt(value);
  return !isNaN(num) && num >= min && num <= max && num.toString() === value.trim();
};

/**
 * Parse cron expression into human readable format
 * @param {string} cronExpression - Cron expression
 * @returns {string} Human readable description
 */
const parseCronExpression = (cronExpression) => {
  try {
    const validation = validateCronExpression(cronExpression);
    if (!validation.isValid) {
      return `Invalid cron expression: ${validation.error}`;
    }

    const [minute, hour, day, month, dayOfWeek] = cronExpression.trim().split(/\s+/);

    // Common patterns
    const commonPatterns = {
      '* * * * *': 'Every minute',
      '*/5 * * * *': 'Every 5 minutes',
      '*/10 * * * *': 'Every 10 minutes',
      '*/15 * * * *': 'Every 15 minutes',
      '*/30 * * * *': 'Every 30 minutes',
      '0 * * * *': 'Every hour',
      '0 */2 * * *': 'Every 2 hours',
      '0 */4 * * *': 'Every 4 hours',
      '0 */6 * * *': 'Every 6 hours',
      '0 */12 * * *': 'Every 12 hours',
      '0 0 * * *': 'Daily at midnight',
      '0 9 * * *': 'Daily at 9:00 AM',
      '0 12 * * *': 'Daily at noon',
      '0 18 * * *': 'Daily at 6:00 PM',
      '0 0 * * 0': 'Weekly on Sunday at midnight',
      '0 0 * * 1': 'Weekly on Monday at midnight',
      '0 0 1 * *': 'Monthly on the 1st at midnight',
      '0 0 1 1 *': 'Yearly on January 1st at midnight'
    };

    if (commonPatterns[cronExpression]) {
      return commonPatterns[cronExpression];
    }

    // Build description for custom patterns
    let description = 'At ';

    // Handle minute
    if (minute === '*') {
      description += 'every minute';
    } else if (minute.includes('/')) {
      const step = minute.split('/')[1];
      description += `every ${step} minutes`;
    } else {
      description += `minute ${minute}`;
    }

    // Handle hour
    if (hour !== '*') {
      if (hour.includes('/')) {
        const step = hour.split('/')[1];
        description += ` of every ${step} hours`;
      } else {
        description += ` past ${formatHour(hour)}`;
      }
    }

    // Handle day
    if (day !== '*') {
      description += ` on day ${day}`;
    }

    // Handle month
    if (month !== '*') {
      description += ` in ${formatMonth(month)}`;
    }

    // Handle day of week
    if (dayOfWeek !== '*') {
      description += ` on ${formatDayOfWeek(dayOfWeek)}`;
    }

    return description;
  } catch (error) {
    logger.error('Error parsing cron expression:', error);
    return 'Unable to parse cron expression';
  }
};

/**
 * Calculate next execution time for a cron expression
 * @param {string} cronExpression - Cron expression
 * @param {string} timezone - Timezone (default: UTC)
 * @returns {Date|null} Next execution time
 */
const getNextExecutionTime = (cronExpression, timezone = 'UTC') => {
  try {
    // For now, return a simple calculation
    // In production, you'd use a proper cron parser like 'cron-parser'
    const now = new Date();
    const [minute, hour, day, month, dayOfWeek] = cronExpression.trim().split(/\s+/);

    // Simple calculation for common patterns
    if (cronExpression === '* * * * *') {
      return new Date(now.getTime() + 60000); // Next minute
    }

    if (cronExpression.startsWith('*/')) {
      const intervalMinutes = parseInt(cronExpression.split(' ')[0].split('/')[1]);
      return new Date(now.getTime() + (intervalMinutes * 60000));
    }

    if (cronExpression === '0 * * * *') {
      const nextHour = new Date(now);
      nextHour.setHours(nextHour.getHours() + 1, 0, 0, 0);
      return nextHour;
    }

    if (cronExpression === '0 0 * * *') {
      const nextDay = new Date(now);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(0, 0, 0, 0);
      return nextDay;
    }

    // For more complex expressions, return approximate next execution
    const nextExecution = new Date(now);
    nextExecution.setMinutes(nextExecution.getMinutes() + 1);
    return nextExecution;
  } catch (error) {
    logger.error('Error calculating next execution time:', error);
    return null;
  }
};

/**
 * Format hour for display
 * @param {string} hour - Hour value
 * @returns {string} Formatted hour
 */
const formatHour = (hour) => {
  const h = parseInt(hour);
  if (h === 0) return '12:00 AM';
  if (h === 12) return '12:00 PM';
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
};

/**
 * Format month for display
 * @param {string} month - Month value
 * @returns {string} Formatted month
 */
const formatMonth = (month) => {
  const months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  return months[parseInt(month)] || `month ${month}`;
};

/**
 * Format day of week for display
 * @param {string} dayOfWeek - Day of week value
 * @returns {string} Formatted day of week
 */
const formatDayOfWeek = (dayOfWeek) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  return days[parseInt(dayOfWeek)] || `day ${dayOfWeek}`;
};

/**
 * Get cron presets
 * @returns {Array} Array of cron presets
 */
const getCronPresets = () => {
  return [
    { label: 'Every minute', value: '* * * * *', description: 'Runs every minute' },
    { label: 'Every 5 minutes', value: '*/5 * * * *', description: 'Runs every 5 minutes' },
    { label: 'Every 15 minutes', value: '*/15 * * * *', description: 'Runs every 15 minutes' },
    { label: 'Every 30 minutes', value: '*/30 * * * *', description: 'Runs every 30 minutes' },
    { label: 'Every hour', value: '0 * * * *', description: 'Runs at the start of every hour' },
    { label: 'Every 2 hours', value: '0 */2 * * *', description: 'Runs every 2 hours' },
    { label: 'Every 4 hours', value: '0 */4 * * *', description: 'Runs every 4 hours' },
    { label: 'Every 6 hours', value: '0 */6 * * *', description: 'Runs every 6 hours' },
    { label: 'Daily at midnight', value: '0 0 * * *', description: 'Runs once daily at 12:00 AM' },
    { label: 'Daily at 9 AM', value: '0 9 * * *', description: 'Runs once daily at 9:00 AM' },
    { label: 'Daily at noon', value: '0 12 * * *', description: 'Runs once daily at 12:00 PM' },
    { label: 'Daily at 6 PM', value: '0 18 * * *', description: 'Runs once daily at 6:00 PM' },
    { label: 'Weekly on Sunday', value: '0 0 * * 0', description: 'Runs every Sunday at midnight' },
    { label: 'Weekly on Monday', value: '0 0 * * 1', description: 'Runs every Monday at midnight' },
    { label: 'Monthly on 1st', value: '0 0 1 * *', description: 'Runs on the 1st of every month' },
    { label: 'Yearly on Jan 1st', value: '0 0 1 1 *', description: 'Runs once a year on January 1st' }
  ];
};

module.exports = {
  validateCronExpression,
  parseCronExpression,
  getNextExecutionTime,
  getCronPresets,
  formatHour,
  formatMonth,
  formatDayOfWeek
};