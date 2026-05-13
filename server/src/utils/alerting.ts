/**
 * Simple alerting utility for critical events
 * Logs and can be extended to send alerts to monitoring systems
 */

import { logger } from './logger';

export interface AlertEvent {
  severity: 'info' | 'warning' | 'error' | 'critical';
  service: string;
  event: string;
  message: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

class AlertingService {
  private alertHistory: AlertEvent[] = [];
  private maxHistorySize = 100;

  /**
   * Send an alert
   */
  alert(event: Omit<AlertEvent, 'timestamp'>): void {
    const alertEvent: AlertEvent = {
      ...event,
      timestamp: new Date().toISOString(),
    };

    // Add to history
    this.alertHistory.push(alertEvent);
    if (this.alertHistory.length > this.maxHistorySize) {
      this.alertHistory.shift();
    }

    // Log based on severity
    switch (alertEvent.severity) {
      case 'info':
        logger.info(`[ALERT:INFO] ${alertEvent.service} - ${alertEvent.event}`, {
          message: alertEvent.message,
          ...alertEvent.metadata,
        });
        break;
      case 'warning':
        logger.warn(`[ALERT:WARNING] ${alertEvent.service} - ${alertEvent.event}`, {
          message: alertEvent.message,
          ...alertEvent.metadata,
        });
        break;
      case 'error':
        logger.error(`[ALERT:ERROR] ${alertEvent.service} - ${alertEvent.event}`, {
          message: alertEvent.message,
          ...alertEvent.metadata,
        });
        break;
      case 'critical':
        logger.error(`[ALERT:CRITICAL] ${alertEvent.service} - ${alertEvent.event}`, {
          message: alertEvent.message,
          ...alertEvent.metadata,
        });
        // TODO: Send to external monitoring system (PagerDuty, Slack, etc.)
        break;
    }
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit: number = 20): AlertEvent[] {
    return this.alertHistory.slice(-limit);
  }

  /**
   * Get alerts by severity
   */
  getAlertsBySeverity(severity: AlertEvent['severity']): AlertEvent[] {
    return this.alertHistory.filter(alert => alert.severity === severity);
  }

  /**
   * Clear alert history (useful for testing)
   */
  clearHistory(): void {
    this.alertHistory = [];
  }
}

// Singleton instance
export const alertingService = new AlertingService();

// Convenience methods for common alert types
export function alertTrendServiceFailure(userId: string, error: Error, circuitState: string): void {
  alertingService.alert({
    severity: 'error',
    service: 'sexual-health-v2',
    event: 'trend_service_failure',
    message: `Trend service failed for user ${userId}`,
    metadata: {
      userId,
      error: error.message,
      circuitState,
    },
  });
}

export function alertTrendServiceCircuitOpen(userId: string): void {
  alertingService.alert({
    severity: 'warning',
    service: 'sexual-health-v2',
    event: 'trend_service_circuit_open',
    message: `Trend service circuit breaker is OPEN for user ${userId}`,
    metadata: {
      userId,
    },
  });
}

export function alertHighLatency(service: string, operation: string, latency: number, threshold: number): void {
  alertingService.alert({
    severity: 'warning',
    service,
    event: 'high_latency',
    message: `${operation} exceeded latency threshold: ${latency}ms > ${threshold}ms`,
    metadata: {
      operation,
      latency,
      threshold,
    },
  });
}

export function alertCircuitBreakerTripped(service: string, failureCount: number): void {
  alertingService.alert({
    severity: 'critical',
    service,
    event: 'circuit_breaker_tripped',
    message: `Circuit breaker tripped after ${failureCount} failures`,
    metadata: {
      failureCount,
    },
  });
}
