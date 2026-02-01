interface ErrorLogEntry {
  timestamp: string;
  error: Error;
  context?: string;
  userId?: string;
  userAgent: string;
  url: string;
  additionalInfo?: Record<string, any>;
}

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs = 100;

  log(error: Error, context?: string, additionalInfo?: Record<string, any>) {
    const entry: ErrorLogEntry = {
      timestamp: new Date().toISOString(),
      error: {
        name: error.name,
        message: error.message,
        stack: error.stack,
      } as Error,
      context,
      userAgent: navigator.userAgent,
      url: window.location.href,
      additionalInfo,
    };

    // Add to local logs
    this.logs.unshift(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      console.group(`🚨 Error logged: ${error.name}`);
      console.error('Error:', error);
      console.log('Context:', context);
      console.log('Additional Info:', additionalInfo);
      console.log('Full Entry:', entry);
      console.groupEnd();
    }

    // In production, you might want to send to an external service
    if (import.meta.env.PROD) {
      this.sendToExternalService(entry);
    }
  }

  private async sendToExternalService(entry: ErrorLogEntry) {
    try {
      // Example: Send to your backend error logging endpoint
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(entry),
      });
    } catch (err) {
      // Silently fail - don't want error logging to cause more errors
      console.warn('Failed to send error to external service:', err);
    }
  }

  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  clearLogs() {
    this.logs = [];
  }

  // Convenience methods for different error types
  logApiError(error: Error, endpoint: string, method: string, statusCode?: number) {
    this.log(error, 'API_ERROR', {
      endpoint,
      method,
      statusCode,
    });
  }

  logComponentError(error: Error, componentName: string, props?: any) {
    this.log(error, 'COMPONENT_ERROR', {
      componentName,
      props,
    });
  }

  logUserAction(error: Error, action: string, data?: any) {
    this.log(error, 'USER_ACTION_ERROR', {
      action,
      data,
    });
  }
}

export const errorLogger = new ErrorLogger();

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
  errorLogger.log(event.error, 'UNHANDLED_ERROR', {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Global handler for unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
  const error = event.reason instanceof Error ? event.reason : new Error(String(event.reason));
  errorLogger.log(error, 'UNHANDLED_PROMISE_REJECTION');
});

export default errorLogger;