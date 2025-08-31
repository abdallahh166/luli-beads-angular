import { Injectable } from '@angular/core';
import { environment } from '../../../environments/environment';

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3
}

export interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: Date;
  context?: string;
  data?: any;
  userId?: string;
}

@Injectable({
  providedIn: 'root'
})
export class LoggingService {
  private readonly logLevel = environment.production ? LogLevel.WARN : LogLevel.DEBUG;
  private readonly maxLogEntries = 1000;
  private logEntries: LogEntry[] = [];

  constructor() {}

  debug(message: string, context?: string, data?: any): void {
    this.log(LogLevel.DEBUG, message, context, data);
  }

  info(message: string, context?: string, data?: any): void {
    this.log(LogLevel.INFO, message, context, data);
  }

  warn(message: string, context?: string, data?: any): void {
    this.log(LogLevel.WARN, message, context, data);
  }

  error(message: string, context?: string, data?: any): void {
    this.log(LogLevel.ERROR, message, context, data);
  }

  private log(level: LogLevel, message: string, context?: string, data?: any): void {
    if (level < this.logLevel) {
      return;
    }

    const logEntry: LogEntry = {
      level,
      message,
      timestamp: new Date(),
      context,
      data
    };

    // Add to internal log
    this.logEntries.push(logEntry);
    if (this.logEntries.length > this.maxLogEntries) {
      this.logEntries.shift();
    }

    // Console logging
    const timestamp = logEntry.timestamp.toISOString();
    const contextStr = context ? `[${context}]` : '';
    const logMessage = `${timestamp} ${contextStr} ${message}`;

    switch (level) {
      case LogLevel.DEBUG:
        if (data) {
          console.debug(logMessage, data);
        } else {
          console.debug(logMessage);
        }
        break;
      case LogLevel.INFO:
        if (data) {
          console.info(logMessage, data);
        } else {
          console.info(logMessage);
        }
        break;
      case LogLevel.WARN:
        if (data) {
          console.warn(logMessage, data);
        } else {
          console.warn(logMessage);
        }
        break;
      case LogLevel.ERROR:
        if (data) {
          console.error(logMessage, data);
        } else {
          console.error(logMessage);
        }
        break;
    }

    // In production, you might want to send logs to a logging service
    if (environment.production && level >= LogLevel.ERROR) {
      this.sendToLoggingService(logEntry);
    }
  }

  private sendToLoggingService(logEntry: LogEntry): void {
    // Implementation for sending logs to external service
    // This could be Sentry, LogRocket, or any other logging service
    try {
      // Example: Send to external service
      // this.http.post('https://logs.service.com/api/logs', logEntry).subscribe();
    } catch (error) {
      console.error('Failed to send log to external service:', error);
    }
  }

  getLogs(level?: LogLevel, context?: string): LogEntry[] {
    let filteredLogs = this.logEntries;

    if (level !== undefined) {
      filteredLogs = filteredLogs.filter(log => log.level >= level);
    }

    if (context) {
      filteredLogs = filteredLogs.filter(log => log.context === context);
    }

    return filteredLogs;
  }

  clearLogs(): void {
    this.logEntries = [];
  }

  exportLogs(): string {
    return JSON.stringify(this.logEntries, null, 2);
  }
}
