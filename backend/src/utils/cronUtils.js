const logger = require('./logger');

// Try different import methods for cron-parser
let cronParser;
try {
  cronParser = require('cron-parser');
} catch (error) {
  logger.error('Failed to import cron-parser:', error);
  cronParser = null;
}

/**
 * Validate cron expression using cron-parser
 * @param {string} cronExpression - Cron expression to validate
 * @returns {Object} Validation result
 */
const validateCronExpression = (cronExpression) => {
  try {
    if (!cronParser) {
      return { isValid: false, error: 'cron-parser not available' };
    }
    
    // Use cron-parser to validate
    cronParser.parseExpression(cronExpression);
    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error.message || 'Invalid cron expression'
    };
  }
};

/**
 * Calculate next execution time using cron-parser
 * @param {string} cronExpression - Cron expression
 * @param {string} timezone - Timezone (default: UTC)
 * @returns {Date|null} Next execution time
 */
const getNextExecutionTime = (cronExpression, timezone = 'UTC') => {
  try {
    if (!cronParser) {
      logger.error('cron-parser not available, using fallback calculation');
      return getFallbackNextExecution(cronExpression);
    }

    const interval = cronParser.parseExpression(cronExpression, {
      tz: timezone,
      currentDate: new Date()
    });
    
    const nextDate = interval.next().toDate();
    logger.debug(`Next execution for "${cronExpression}": ${nextDate.toISOString()}`);
    
    return nextDate;
  } catch (error) {
    logger.error('Error calculating next execution time:', {
      cronExpression,
      timezone,
      error: error.message
    });
    
    // Use fallback calculation
    return getFallbackNextExecution(cronExpression);
  }
};

/**
 * Fallback next execution calculation for basic patterns
 */
const getFallbackNextExecution = (cronExpression) => {
  const now = new Date();
  const next = new Date(now);
  next.setSeconds(0, 0);

  try {
    // Handle basic patterns
    if (cronExpression === '* * * * *') {
      next.setMinutes(next.getMinutes() + 1);
      return next;
    }

    if (cronExpression.startsWith('*/') && cronExpression.endsWith(' * * * *')) {
      const interval = parseInt(cronExpression.split(' ')[0].split('/')[1]);
      const currentMinute = next.getMinutes();
      const nextMinute = Math.ceil((currentMinute + 1) / interval) * interval;
      
      if (nextMinute >= 60) {
        next.setHours(next.getHours() + Math.floor(nextMinute / 60));
        next.setMinutes(nextMinute % 60);
      } else {
        next.setMinutes(nextMinute);
      }
      return next;
    }

    if (cronExpression.startsWith('0 ') && cronExpression.endsWith(' * * *')) {
      next.setMinutes(0);
      next.setHours(next.getHours() + 1);
      return next;
    }

    // Default fallback
    next.setMinutes(next.getMinutes() + 5);
    return next;
  } catch (error) {
    logger.error('Fallback calculation failed:', error);
    const fallback = new Date();
    fallback.setMinutes(fallback.getMinutes() + 5);
    return fallback;
  }
};

/**
 * Parse cron expression into human readable format
 */
const parseCronExpression = (cronExpression) => {
  try {
    const validation = validateCronExpression(cronExpression);
    if (!validation.isValid) {
      return `Invalid cron expression: ${validation.error}`;
    }

    // Common patterns with descriptions
    const commonPatterns = {
      '* * * * *': 'Every minute',
      '*/2 * * * *': 'Every 2 minutes',
      '*/5 * * * *': 'Every 5 minutes',
      '*/10 * * * *': 'Every 10 minutes',
      '*/15 * * * *': 'Every 15 minutes',
      '*/30 * * * *': 'Every 30 minutes',
      '0 * * * *': 'Every hour (at minute 0)',
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
      '0 0 * * 1-5': 'Weekdays at midnight',
      '0 9 * * 1-5': 'Weekdays at 9:00 AM',
      '0 0 1 * *': 'Monthly on the 1st at midnight',
      '0 0 1 1 *': 'Yearly on January 1st at midnight'
    };

    // Check if it's a common pattern
    if (commonPatterns[cronExpression]) {
      return commonPatterns[cronExpression];
    }

    // Parse individual parts for custom description
    const [minute, hour, day, month, dayOfWeek] = cronExpression.trim().split(/\s+/);
    
    let description = 'At ';

    // Handle minutes
    if (minute === '*') {
      description += 'every minute';
    } else if (minute.includes('/')) {
      const step = minute.split('/')[1];
      description += `every ${step} minutes`;
    } else if (minute.includes(',')) {
      description += `minutes ${minute}`;
    } else {
      description += `minute ${minute}`;
    }

    // Handle hours
    if (hour !== '*') {
      if (hour.includes('/')) {
        const step = hour.split('/')[1];
        description += ` of every ${step} hours`;
      } else if (hour.includes(',')) {
        description += ` of hours ${hour}`;
      } else {
        description += ` past ${formatHour(hour)}`;
      }
    }

    // Handle days
    if (day !== '*') {
      if (day.includes(',')) {
        description += ` on days ${day}`;
      } else {
        description += ` on day ${day}`;
      }
    }

    // Handle months
    if (month !== '*') {
      if (month.includes(',')) {
        description += ` in months ${month}`;
      } else {
        description += ` in ${formatMonth(month)}`;
      }
    }

    // Handle day of week
    if (dayOfWeek !== '*') {
      if (dayOfWeek.includes(',')) {
        const days = dayOfWeek.split(',').map(d => formatDayOfWeek(d.trim())).join(', ');
        description += ` on ${days}`;
      } else if (dayOfWeek.includes('-')) {
        description += ` on ${formatDayOfWeekRange(dayOfWeek)}`;
      } else {
        description += ` on ${formatDayOfWeek(dayOfWeek)}`;
      }
    }

    return description;
  } catch (error) {
    logger.error('Error parsing cron expression:', error);
    return 'Unable to parse cron expression';
  }
};

/**
 * Format hour for display
 */
const formatHour = (hour) => {
  const h = parseInt(hour);
  if (isNaN(h)) return hour;
  
  if (h === 0) return '12:00 AM';
  if (h === 12) return '12:00 PM';
  if (h < 12) return `${h}:00 AM`;
  return `${h - 12}:00 PM`;
};

/**
 * Format month for display
 */
const formatMonth = (month) => {
  const months = [
    '', 'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  
  const m = parseInt(month);
  return isNaN(m) ? month : (months[m] || `month ${month}`);
};

/**
 * Format day of week for display
 */
const formatDayOfWeek = (dayOfWeek) => {
  const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  
  const d = parseInt(dayOfWeek);
  return isNaN(d) ? dayOfWeek : (days[d] || `day ${dayOfWeek}`);
};

/**
 * Format day of week range (e.g., "1-5" becomes "Monday to Friday")
 */
const formatDayOfWeekRange = (range) => {
  const [start, end] = range.split('-');
  const startDay = formatDayOfWeek(start);
  const endDay = formatDayOfWeek(end);
  return `${startDay} to ${endDay}`;
};

/**
 * Get next few execution times for preview
 * @param {string} cronExpression - Cron expression
 * @param {string} timezone - Timezone
 * @param {number} count - Number of next executions to get
 * @returns {Array} Array of next execution dates
 */
const getNextExecutions = (cronExpression, timezone = 'UTC', count = 5) => {
  try {
    if (!cronParser) {
      return [getFallbackNextExecution(cronExpression)];
    }

    const interval = cronParser.parseExpression(cronExpression, {
      tz: timezone,
      currentDate: new Date()
    });
    
    const executions = [];
    for (let i = 0; i < count; i++) {
      executions.push(interval.next().toDate());
    }
    
    return executions;
  } catch (error) {
    logger.error('Error getting next executions:', error);
    return [getFallbackNextExecution(cronExpression)];
  }
};

/**
 * Check if cron expression will execute within a time period
 * @param {string} cronExpression - Cron expression
 * @param {number} minutes - Time period in minutes
 * @param {string} timezone - Timezone
 * @returns {boolean} Will execute within period
 */
const willExecuteWithin = (cronExpression, minutes, timezone = 'UTC') => {
  try {
    const nextExecution = getNextExecutionTime(cronExpression, timezone);
    if (!nextExecution) return false;
    
    const now = new Date();
    const timeDiff = nextExecution.getTime() - now.getTime();
    const minutesDiff = timeDiff / (1000 * 60);
    
    return minutesDiff <= minutes;
  } catch (error) {
    return false;
  }
};

/**
 * Get cron presets for UI
 */
const getCronPresets = () => {
  return [
    { label: 'Every minute', value: '* * * * *', description: 'Runs every minute (testing only)' },
    { label: 'Every 2 minutes', value: '*/2 * * * *', description: 'Runs every 2 minutes' },
    { label: 'Every 5 minutes', value: '*/5 * * * *', description: 'Runs every 5 minutes' },
    { label: 'Every 15 minutes', value: '*/15 * * * *', description: 'Runs every 15 minutes' },
    { label: 'Every 30 minutes', value: '*/30 * * * *', description: 'Runs every 30 minutes' },
    { label: 'Every hour', value: '0 * * * *', description: 'Runs at the start of every hour' },
    { label: 'Every 2 hours', value: '0 */2 * * *', description: 'Runs every 2 hours' },
    { label: 'Every 4 hours', value: '0 */4 * * *', description: 'Runs every 4 hours' },
    { label: 'Every 6 hours', value: '0 */6 * * *', description: 'Runs every 6 hours' },
    { label: 'Daily at 9 AM', value: '0 9 * * *', description: 'Runs once daily at 9:00 AM' },
    { label: 'Daily at noon', value: '0 12 * * *', description: 'Runs once daily at 12:00 PM' },
    { label: 'Daily at 6 PM', value: '0 18 * * *', description: 'Runs once daily at 6:00 PM' },
    { label: 'Weekdays at 9 AM', value: '0 9 * * 1-5', description: 'Runs Monday to Friday at 9:00 AM' },
    { label: 'Weekly on Sunday', value: '0 0 * * 0', description: 'Runs every Sunday at midnight' },
    { label: 'Monthly on 1st', value: '0 0 1 * *', description: 'Runs on the 1st of every month' }
  ];
};

module.exports = {
  validateCronExpression,
  parseCronExpression,
  getNextExecutionTime,
  getNextExecutions,
  willExecuteWithin,
  getCronPresets,
  formatHour,
  formatMonth,
  formatDayOfWeek
}; 