/**
 * Error Logging Service
 * Provides centralized error logging with different severity levels
 * and optional remote error reporting capabilities
 */

export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical';
export type ErrorCategory = 'network' | 'validation' | 'runtime' | 'security' | 'unknown';

interface ErrorDetails {
  message: string;
  severity: ErrorSeverity;
  category: ErrorCategory;
  timestamp: Date;
  context?: Record<string, any>;
  stack?: string;
  userId?: string;
  sessionId?: string;
  userAgent?: string;
  url?: string;
}

interface ErrorLoggerConfig {
  enableConsoleLogging: boolean;
  enableRemoteLogging: boolean;
  remoteEndpoint?: string;
  environment: 'development' | 'staging' | 'production';
  maxRetries: number;
}

class ErrorLogger {
  private config: ErrorLoggerConfig;
  private errorQueue: ErrorDetails[] = [];
  private isOnline: boolean = navigator.onLine;
  
  constructor() {
    this.config = {
      enableConsoleLogging: import.meta.env.DEV || import.meta.env.VITE_DEBUG_MODE === 'true',
      enableRemoteLogging: import.meta.env.PROD,
      remoteEndpoint: import.meta.env.VITE_ERROR_ENDPOINT,
      environment: (import.meta.env.MODE || 'development') as any,
      maxRetries: 3
    };
    
    // Listen for online/offline events
    window.addEventListener('online', () => {
      this.isOnline = true;
      this.flushErrorQueue();
    });
    
    window.addEventListener('offline', () => {
      this.isOnline = false;
    });
    
    // Set up global error handler
    this.setupGlobalErrorHandlers();
  }
  
  /**
   * Set up global error handlers for uncaught errors
   */
  private setupGlobalErrorHandlers(): void {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.logError({
        message: event.message,
        severity: 'high',
        category: 'runtime',
        stack: event.error?.stack,
        context: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno
        }
      });
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        severity: 'high',
        category: 'runtime',
        stack: event.reason?.stack,
        context: {
          promise: event.promise
        }
      });
    });
  }
  
  /**
   * Log an error with details
   */
  public logError(error: Partial<ErrorDetails> & { message: string }): void {
    const errorDetails: ErrorDetails = {
      severity: 'medium',
      category: 'unknown',
      timestamp: new Date(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      ...error
    };
    
    // Add session info if available
    if (typeof window !== 'undefined' && (window as any).__sessionId) {
      errorDetails.sessionId = (window as any).__sessionId;
    }
    
    // Console logging
    if (this.config.enableConsoleLogging) {
      this.logToConsole(errorDetails);
    }
    
    // Remote logging
    if (this.config.enableRemoteLogging && this.config.remoteEndpoint) {
      this.sendToRemote(errorDetails);
    }
    
    // Store in local storage for debugging
    this.storeLocally(errorDetails);
  }
  
  /**
   * Log to console with appropriate styling
   */
  private logToConsole(error: ErrorDetails): void {
    const styles = {
      low: 'color: #666; background: #f0f0f0;',
      medium: 'color: #ff9800; background: #fff3e0;',
      high: 'color: #f44336; background: #ffebee;',
      critical: 'color: #fff; background: #d32f2f; font-weight: bold;'
    };
    
    console.group(
      `%c[${error.severity.toUpperCase()}] ${error.category}: ${error.message}`,
      styles[error.severity] + ' padding: 2px 5px; border-radius: 3px;'
    );
    
    console.log('Timestamp:', error.timestamp.toISOString());
    console.log('URL:', error.url);
    
    if (error.context && Object.keys(error.context).length > 0) {
      console.log('Context:', error.context);
    }
    
    if (error.stack) {
      console.log('Stack trace:', error.stack);
    }
    
    console.groupEnd();
  }
  
  /**
   * Send error to remote logging service
   */
  private async sendToRemote(error: ErrorDetails): Promise<void> {
    if (!this.isOnline) {
      this.errorQueue.push(error);
      return;
    }
    
    try {
      const response = await fetch(this.config.remoteEndpoint!, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...error,
          environment: this.config.environment
        })
      });
      
      if (!response.ok) {
        throw new Error(`Failed to log error: ${response.statusText}`);
      }
    } catch (err) {
      // Queue for retry
      this.errorQueue.push(error);
      console.error('Failed to send error to remote:', err);
    }
  }
  
  /**
   * Store error locally for debugging
   */
  private storeLocally(error: ErrorDetails): void {
    try {
      const storedErrors = this.getStoredErrors();
      storedErrors.push(error);
      
      // Keep only last 50 errors
      if (storedErrors.length > 50) {
        storedErrors.shift();
      }
      
      localStorage.setItem('ahrq_error_log', JSON.stringify(storedErrors));
    } catch (err) {
      // Fail silently if localStorage is full
    }
  }
  
  /**
   * Get stored errors from localStorage
   */
  public getStoredErrors(): ErrorDetails[] {
    try {
      const stored = localStorage.getItem('ahrq_error_log');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }
  
  /**
   * Clear stored errors
   */
  public clearStoredErrors(): void {
    localStorage.removeItem('ahrq_error_log');
  }
  
  /**
   * Flush queued errors when back online
   */
  private async flushErrorQueue(): Promise<void> {
    const queue = [...this.errorQueue];
    this.errorQueue = [];
    
    for (const error of queue) {
      await this.sendToRemote(error);
    }
  }
  
  /**
   * Helper methods for common error types
   */
  public logNetworkError(message: string, context?: Record<string, any>): void {
    this.logError({
      message,
      category: 'network',
      severity: 'medium',
      context
    });
  }
  
  public logValidationError(message: string, context?: Record<string, any>): void {
    this.logError({
      message,
      category: 'validation',
      severity: 'low',
      context
    });
  }
  
  public logSecurityError(message: string, context?: Record<string, any>): void {
    this.logError({
      message,
      category: 'security',
      severity: 'critical',
      context
    });
  }
  
  public logRuntimeError(error: Error, context?: Record<string, any>): void {
    this.logError({
      message: error.message,
      category: 'runtime',
      severity: 'high',
      stack: error.stack,
      context
    });
  }
}

// Create singleton instance
export const errorLogger = new ErrorLogger();

// Export for global access (useful for debugging)
if (typeof window !== 'undefined') {
  (window as any).errorLogger = errorLogger;
}

// Helper function for React error boundaries
export function logComponentError(error: Error, errorInfo: { componentStack: string }): void {
  errorLogger.logError({
    message: `React Component Error: ${error.message}`,
    category: 'runtime',
    severity: 'high',
    stack: error.stack,
    context: {
      componentStack: errorInfo.componentStack
    }
  });
}

// Type-safe error helper
export function createError(
  message: string,
  category: ErrorCategory = 'unknown',
  severity: ErrorSeverity = 'medium',
  context?: Record<string, any>
): Error {
  const error = new Error(message);
  errorLogger.logError({
    message,
    category,
    severity,
    context,
    stack: error.stack
  });
  return error;
}