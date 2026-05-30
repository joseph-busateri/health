/**
 * Simple metrics collection for Sexual Health V2
 * Tracks usage, latency, and error rates for production monitoring
 */

interface MetricCounter {
  name: string;
  value: number;
  labels?: Record<string, string>;
}

interface MetricHistogram {
  name: string;
  values: number[];
  labels?: Record<string, string>;
}

class SexualHealthMetrics {
  private counters: Map<string, number> = new Map();
  private histograms: Map<string, number[]> = new Map();
  private labelKeys: Map<string, Set<string>> = new Map();

  /**
   * Increment a counter metric
   */
  increment(name: string, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    this.counters.set(key, (this.counters.get(key) || 0) + 1);
    
    if (labels) {
      const labelKeys = this.labelKeys.get(name) || new Set();
      Object.keys(labels).forEach(k => labelKeys.add(k));
      this.labelKeys.set(name, labelKeys);
    }
  }

  /**
   * Record a histogram value (for latency tracking)
   */
  record(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getMetricKey(name, labels);
    const values = this.histograms.get(key) || [];
    values.push(value);
    this.histograms.set(key, values);
    
    if (labels) {
      const labelKeys = this.labelKeys.get(name) || new Set();
      Object.keys(labels).forEach(k => labelKeys.add(k));
      this.labelKeys.set(name, labelKeys);
    }
  }

  /**
   * Get counter value
   */
  getCounter(name: string, labels?: Record<string, string>): number {
    const key = this.getMetricKey(name, labels);
    return this.counters.get(key) || 0;
  }

  /**
   * Get histogram statistics
   */
  getHistogramStats(name: string, labels?: Record<string, string>): {
    count: number;
    min: number;
    max: number;
    avg: number;
    p50: number;
    p95: number;
    p99: number;
  } | null {
    const key = this.getMetricKey(name, labels);
    const values = this.histograms.get(key);
    
    if (!values || values.length === 0) {
      return null;
    }

    const sorted = [...values].sort((a, b) => a - b);
    const count = sorted.length;
    const min = sorted[0];
    const max = sorted[count - 1];
    const sum = sorted.reduce((a, b) => a + b, 0);
    const avg = sum / count;
    const p50 = sorted[Math.floor(count * 0.5)];
    const p95 = sorted[Math.floor(count * 0.95)];
    const p99 = sorted[Math.floor(count * 0.99)];

    return { count, min, max, avg, p50, p95, p99 };
  }

  /**
   * Get all metrics for export
   */
  getAllMetrics(): {
    counters: MetricCounter[];
    histograms: MetricHistogram[];
  } {
    const counters: MetricCounter[] = [];
    const histograms: MetricHistogram[] = [];

    this.counters.forEach((value, key) => {
      const { name, labels } = this.parseMetricKey(key);
      counters.push({ name, value, labels });
    });

    this.histograms.forEach((values, key) => {
      const { name, labels } = this.parseMetricKey(key);
      histograms.push({ name, values, labels });
    });

    return { counters, histograms };
  }

  /**
   * Reset all metrics (useful for testing)
   */
  reset(): void {
    this.counters.clear();
    this.histograms.clear();
    this.labelKeys.clear();
  }

  /**
   * Generate a metric key from name and labels
   */
  private getMetricKey(name: string, labels?: Record<string, string>): string {
    if (!labels) {
      return name;
    }
    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}="${v}"`)
      .join(',');
    return `${name}{${labelStr}}`;
  }

  /**
   * Parse a metric key back into name and labels
   */
  private parseMetricKey(key: string): { name: string; labels?: Record<string, string> } {
    const match = key.match(/^(.+)\{(.+)\}$/);
    if (!match) {
      return { name: key };
    }

    const [, name, labelStr] = match;
    const labels: Record<string, string> = {};
    labelStr.split(',').forEach(pair => {
      const [k, v] = pair.split('=');
      if (k && v) {
        labels[k.trim()] = v.trim().replace(/"/g, '');
      }
    });

    return { name, labels };
  }
}

// Singleton instance
export const sexualHealthMetrics = new SexualHealthMetrics();

// Metric names
export const METRIC_NAMES = {
  // Counters
  SEXUAL_HEALTH_V2_REQUESTS_TOTAL: 'sexual_health_v2_requests_total',
  SEXUAL_HEALTH_V2_ERRORS_TOTAL: 'sexual_health_v2_errors_total',
  SEXUAL_HEALTH_V2_TREND_SERVICE_CALLS_TOTAL: 'sexual_health_v2_trend_service_calls_total',
  SEXUAL_HEALTH_V2_TREND_SERVICE_ERRORS_TOTAL: 'sexual_health_v2_trend_service_errors_total',
  SEXUAL_HEALTH_V2_TREND_AVAILABLE_TOTAL: 'sexual_health_v2_trend_available_total',
  SEXUAL_HEALTH_V2_TREND_INSUFFICIENT_DATA_TOTAL: 'sexual_health_v2_trend_insufficient_data_total',
  SEXUAL_HEALTH_V2_FALLBACK_TO_V1_TOTAL: 'sexual_health_v2_fallback_to_v1_total',
  
  // Histograms
  SEXUAL_HEALTH_V2_LATENCY_SECONDS: 'sexual_health_v2_latency_seconds',
  SEXUAL_HEALTH_V2_TREND_SERVICE_LATENCY_SECONDS: 'sexual_health_v2_trend_service_latency_seconds',
} as const;
