// Development Error Logger
// Helps track and debug errors in development

interface ErrorLogEntry {
  timestamp: Date;
  error: Error;
  componentStack?: string;
  additionalInfo?: any;
  source?: string;
}

class ErrorLogger {
  private errors: ErrorLogEntry[] = [];
  private maxErrors = 50;
  private isEnabled = process.env.NODE_ENV === 'development';

  constructor() {
    if (this.isEnabled) {
      this.setupGlobalErrorHandlers();
      console.log('[ErrorLogger] Development error logging enabled');
    }
  }

  private setupGlobalErrorHandlers() {
    // Catch unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.logError(new Error(event.reason), {
        source: 'unhandledRejection',
        promise: event.promise,
      });
    });

    // Override console.error to capture all errors
    const originalError = console.error;
    console.error = (...args) => {
      // Call original console.error
      originalError.apply(console, args);
      
      // Log to our error logger
      if (args[0] instanceof Error) {
        this.logError(args[0], { source: 'console.error', additionalArgs: args.slice(1) });
      } else {
        this.logError(new Error(args.join(' ')), { source: 'console.error', args });
      }
    };

    // React Error Boundary integration
    (window as any).__errorLogger = this;
  }

  logError(error: Error, additionalInfo?: any) {
    if (!this.isEnabled) return;

    const entry: ErrorLogEntry = {
      timestamp: new Date(),
      error,
      additionalInfo,
    };

    // Store error
    this.errors.push(entry);
    if (this.errors.length > this.maxErrors) {
      this.errors.shift();
    }

    // Log to console with formatting
    console.group(`🚨 [ErrorLogger] ${error.name || 'Error'}`);
    console.log('Message:', error.message);
    console.log('Stack:', error.stack);
    if (additionalInfo) {
      console.log('Additional Info:', additionalInfo);
    }
    console.log('Timestamp:', entry.timestamp.toISOString());
    console.groupEnd();
  }

  getErrors(): ErrorLogEntry[] {
    return [...this.errors];
  }

  clearErrors() {
    this.errors = [];
    console.log('[ErrorLogger] Error log cleared');
  }

  exportErrors() {
    const errorData = this.errors.map(entry => ({
      timestamp: entry.timestamp.toISOString(),
      message: entry.error.message,
      stack: entry.error.stack,
      additionalInfo: entry.additionalInfo,
    }));

    const blob = new Blob([JSON.stringify(errorData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `error-log-${new Date().toISOString()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // Development helper to show error summary
  showSummary() {
    console.group('📊 [ErrorLogger] Error Summary');
    console.log(`Total errors: ${this.errors.length}`);
    
    // Group errors by type
    const errorTypes = this.errors.reduce((acc, entry) => {
      const type = entry.error.name || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    console.table(errorTypes);
    console.groupEnd();
  }
}

// Create singleton instance
const errorLogger = new ErrorLogger();

// Export for use in components
export default errorLogger;

// Development utilities
if (process.env.NODE_ENV === 'development') {
  (window as any).errorLogger = errorLogger;
  console.log('💡 Error logger available as window.errorLogger');
  console.log('   - errorLogger.showSummary() - Show error summary');
  console.log('   - errorLogger.getErrors() - Get all errors');
  console.log('   - errorLogger.clearErrors() - Clear error log');
  console.log('   - errorLogger.exportErrors() - Export errors to JSON');
}