/**
 * Simple Circuit Breaker Pattern
 * Prevents cascade failures by stopping calls to failing services after threshold is reached
 */

import { alertCircuitBreakerTripped } from './alerting';

interface CircuitBreakerOptions {
  failureThreshold: number;  // Number of failures before opening circuit
  resetTimeout: number;     // Time in ms before attempting to close circuit
  monitoringPeriod: number; // Time in ms for sliding window of failures
}

interface CircuitBreakerState {
  failures: number;
  lastFailureTime: number;
  state: 'closed' | 'open' | 'half-open';
  failureWindow: number[];  // Timestamps of recent failures
}

export class CircuitBreaker {
  private state: CircuitBreakerState;
  private options: CircuitBreakerOptions;

  constructor(options: Partial<CircuitBreakerOptions> = {}) {
    this.options = {
      failureThreshold: options.failureThreshold || 5,
      resetTimeout: options.resetTimeout || 60000,  // 1 minute default
      monitoringPeriod: options.monitoringPeriod || 60000,  // 1 minute window
    };

    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed',
      failureWindow: [],
    };
  }

  /**
   * Execute a function with circuit breaker protection
   */
  async execute<T>(fn: () => Promise<T>): Promise<T> {
    if (this.state.state === 'open') {
      if (this.shouldAttemptReset()) {
        this.state.state = 'half-open';
      } else {
        throw new Error('Circuit breaker is OPEN - service unavailable');
      }
    }

    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }

  /**
   * Check if circuit should attempt to reset
   */
  private shouldAttemptReset(): boolean {
    const timeSinceLastFailure = Date.now() - this.state.lastFailureTime;
    return timeSinceLastFailure >= this.options.resetTimeout;
  }

  /**
   * Handle successful execution
   */
  private onSuccess(): void {
    this.state.failures = 0;
    this.state.failureWindow = [];
    if (this.state.state === 'half-open') {
      this.state.state = 'closed';
    }
  }

  /**
   * Handle failed execution
   */
  private onFailure(): void {
    const now = Date.now();
    this.state.failures++;
    this.state.lastFailureTime = now;
    this.state.failureWindow.push(now);

    // Clean up old failures outside monitoring period
    this.state.failureWindow = this.state.failureWindow.filter(
      timestamp => now - timestamp <= this.options.monitoringPeriod
    );

    // Check if we should open the circuit
    if (this.state.failureWindow.length >= this.options.failureThreshold && this.state.state !== 'open') {
      this.state.state = 'open';
      alertCircuitBreakerTripped('trend-service', this.state.failureWindow.length);
    }
  }

  /**
   * Get current circuit state
   */
  getState(): CircuitBreakerState {
    return { ...this.state };
  }

  /**
   * Manually reset the circuit (useful for testing)
   */
  reset(): void {
    this.state = {
      failures: 0,
      lastFailureTime: 0,
      state: 'closed',
      failureWindow: [],
    };
  }

  /**
   * Check if circuit is currently open
   */
  isOpen(): boolean {
    return this.state.state === 'open';
  }
}

// Singleton instance for trend service
export const trendServiceCircuitBreaker = new CircuitBreaker({
  failureThreshold: 5,
  resetTimeout: 60000,  // 1 minute
  monitoringPeriod: 60000,  // 1 minute
});
