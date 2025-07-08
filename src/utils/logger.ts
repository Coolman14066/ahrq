/**
 * Development Logger Utility
 * Provides consistent logging with debug mode support
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LoggerConfig {
  enabled: boolean;
  level: LogLevel;
  prefix: string;
  showTimestamp: boolean;
  showCaller: boolean;
}

class Logger {
  private config: LoggerConfig;
  private levelPriority: Record<LogLevel, number> = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  };
  
  constructor(prefix: string = 'AHRQ') {
    const isDev = import.meta.env.DEV;
    const debugMode = import.meta.env.VITE_DEBUG_MODE === 'true';
    const verboseLogging = import.meta.env.VITE_VERBOSE_LOGGING === 'true';
    
    this.config = {
      enabled: isDev || debugMode,
      level: verboseLogging ? 'debug' : 'info',
      prefix,
      showTimestamp: true,
      showCaller: debugMode
    };
  }
  
  /**
   * Check if logging is enabled for a given level
   */
  private shouldLog(level: LogLevel): boolean {
    if (!this.config.enabled) return false;
    return this.levelPriority[level] >= this.levelPriority[this.config.level];
  }
  
  /**
   * Format the log message with metadata
   */
  private formatMessage(level: LogLevel, message: string, data?: any): string {
    const parts: string[] = [];
    
    if (this.config.showTimestamp) {
      parts.push(new Date().toISOString());
    }
    
    parts.push(`[${this.config.prefix}]`);
    parts.push(`[${level.toUpperCase()}]`);
    
    if (this.config.showCaller) {
      const stack = new Error().stack;
      const caller = stack?.split('\n')[3]?.trim() || 'unknown';
      parts.push(`(${caller})`);
    }
    
    parts.push(message);
    
    return parts.join(' ');
  }
  
  /**
   * Get console style based on log level
   */
  private getStyle(level: LogLevel): string {
    const styles: Record<LogLevel, string> = {
      debug: 'color: #9E9E9E',
      info: 'color: #2196F3',
      warn: 'color: #FF9800',
      error: 'color: #F44336; font-weight: bold'
    };
    return styles[level];
  }
  
  /**
   * Core logging method
   */
  private log(level: LogLevel, message: string, data?: any): void {
    if (!this.shouldLog(level)) return;
    
    const formattedMessage = this.formatMessage(level, message, data);
    const style = this.getStyle(level);
    
    // Use appropriate console method
    const consoleMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
    
    if (data !== undefined) {
      console[consoleMethod](`%c${formattedMessage}`, style, data);
    } else {
      console[consoleMethod](`%c${formattedMessage}`, style);
    }
  }
  
  /**
   * Public logging methods
   */
  debug(message: string, data?: any): void {
    this.log('debug', message, data);
  }
  
  info(message: string, data?: any): void {
    this.log('info', message, data);
  }
  
  warn(message: string, data?: any): void {
    this.log('warn', message, data);
  }
  
  error(message: string, data?: any): void {
    this.log('error', message, data);
  }
  
  /**
   * Group related logs
   */
  group(label: string, fn: () => void): void {
    if (!this.config.enabled) {
      fn();
      return;
    }
    
    console.group(`[${this.config.prefix}] ${label}`);
    try {
      fn();
    } finally {
      console.groupEnd();
    }
  }
  
  /**
   * Time a function execution
   */
  time<T>(label: string, fn: () => T): T {
    if (!this.config.enabled) return fn();
    
    const start = performance.now();
    try {
      const result = fn();
      const duration = performance.now() - start;
      this.debug(`${label} took ${duration.toFixed(2)}ms`);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.error(`${label} failed after ${duration.toFixed(2)}ms`, error);
      throw error;
    }
  }
  
  /**
   * Create a child logger with a different prefix
   */
  createChild(prefix: string): Logger {
    const child = new Logger(`${this.config.prefix}:${prefix}`);
    child.config = { ...this.config, prefix: `${this.config.prefix}:${prefix}` };
    return child;
  }
  
  /**
   * Update logger configuration
   */
  setConfig(updates: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...updates };
  }
}

// Create default logger instances
export const logger = new Logger('AHRQ');
export const apiLogger = logger.createChild('API');
export const wsLogger = logger.createChild('WebSocket');
export const uiLogger = logger.createChild('UI');

// Export for global access in development
if (import.meta.env.DEV && typeof window !== 'undefined') {
  (window as any).__logger = logger;
}

// Helper function for component logging
export function useLogger(componentName: string): Logger {
  return logger.createChild(componentName);
}