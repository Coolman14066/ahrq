/**
 * Backend Logger Utility
 * Provides consistent logging with debug mode support for Node.js
 */

export const LogLevel = {
  DEBUG: 'debug',
  INFO: 'info',
  WARN: 'warn',
  ERROR: 'error'
};

class Logger {
  constructor(prefix = 'AHRQ-Backend') {
    this.config = {
      enabled: process.env.NODE_ENV !== 'test',
      level: process.env.VERBOSE_LOGGING === 'true' ? LogLevel.DEBUG : LogLevel.INFO,
      prefix,
      showTimestamp: true,
      showCaller: process.env.DEBUG_MODE === 'true',
      colorize: process.stdout.isTTY
    };
    
    this.levelPriority = {
      [LogLevel.DEBUG]: 0,
      [LogLevel.INFO]: 1,
      [LogLevel.WARN]: 2,
      [LogLevel.ERROR]: 3
    };
    
    this.colors = {
      reset: '\x1b[0m',
      debug: '\x1b[90m',     // gray
      info: '\x1b[36m',      // cyan
      warn: '\x1b[33m',      // yellow
      error: '\x1b[31m',     // red
      timestamp: '\x1b[35m', // magenta
      prefix: '\x1b[34m'     // blue
    };
  }
  
  shouldLog(level) {
    if (!this.config.enabled) return false;
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }
  
  formatMessage(level, message, data) {
    const parts = [];
    
    if (this.config.showTimestamp) {
      const timestamp = new Date().toISOString();
      if (this.config.colorize) {
        parts.push(`${this.colors.timestamp}${timestamp}${this.colors.reset}`);
      } else {
        parts.push(timestamp);
      }
    }
    
    if (this.config.colorize) {
      parts.push(`${this.colors.prefix}[${this.config.prefix}]${this.colors.reset}`);
      parts.push(`${this.colors[level]}[${level.toUpperCase()}]${this.colors.reset}`);
    } else {
      parts.push(`[${this.config.prefix}]`);
      parts.push(`[${level.toUpperCase()}]`);
    }
    
    if (this.config.showCaller) {
      const stack = new Error().stack;
      const caller = stack?.split('\n')[3]?.trim() || 'unknown';
      parts.push(`(${caller})`);
    }
    
    parts.push(message);
    
    return parts.join(' ');
  }
  
  log(level, message, data) {
    if (!this.shouldLog(level)) return;
    
    const formattedMessage = this.formatMessage(level, message, data);
    
    // Use appropriate console method
    const output = level === LogLevel.ERROR ? console.error : console.log;
    
    if (data !== undefined) {
      if (typeof data === 'object' && data !== null) {
        output(formattedMessage);
        output(JSON.stringify(data, null, 2));
      } else {
        output(formattedMessage, data);
      }
    } else {
      output(formattedMessage);
    }
  }
  
  debug(message, data) {
    this.log(LogLevel.DEBUG, message, data);
  }
  
  info(message, data) {
    this.log(LogLevel.INFO, message, data);
  }
  
  warn(message, data) {
    this.log(LogLevel.WARN, message, data);
  }
  
  error(message, data) {
    this.log(LogLevel.ERROR, message, data);
  }
  
  /**
   * Log HTTP request details
   */
  logRequest(req, res, duration) {
    const status = res.statusCode;
    const level = status >= 500 ? LogLevel.ERROR : status >= 400 ? LogLevel.WARN : LogLevel.INFO;
    
    this.log(level, `${req.method} ${req.path} ${status} ${duration}ms`, {
      method: req.method,
      path: req.path,
      status,
      duration,
      ip: req.ip,
      userAgent: req.get('user-agent')
    });
  }
  
  /**
   * Log WebSocket events
   */
  logSocket(event, data) {
    this.debug(`Socket event: ${event}`, data);
  }
  
  /**
   * Create a child logger with a different prefix
   */
  createChild(prefix) {
    const child = new Logger(`${this.config.prefix}:${prefix}`);
    child.config = { ...this.config, prefix: `${this.config.prefix}:${prefix}` };
    return child;
  }
  
  /**
   * Update logger configuration
   */
  setConfig(updates) {
    this.config = { ...this.config, ...updates };
  }
}

// Create logger instances
export const logger = new Logger();
export const apiLogger = logger.createChild('API');
export const wsLogger = logger.createChild('WebSocket');
export const dbLogger = logger.createChild('Database');
export const serviceLogger = logger.createChild('Service');

// Express middleware for request logging
export function requestLogger(req, res, next) {
  const start = Date.now();
  
  // Log response after it's sent
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.logRequest(req, res, duration);
  });
  
  next();
}

// Helper for async route handlers
export function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch((error) => {
      logger.error(`Async handler error: ${error.message}`, {
        path: req.path,
        method: req.method,
        stack: error.stack
      });
      next(error);
    });
  };
}