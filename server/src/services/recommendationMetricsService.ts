/**
 * Recommendation Metrics Service
 * 
 * Centralized metrics tracking for recommendation system.
 * Tracks AI enrichment, validation, normalization, and fallback metrics.
 */

import { logger } from '../utils/logger';

// ============================================================================
// METRICS TYPES
// ============================================================================

export interface RecommendationMetrics {
  // AI Enrichment
  aiEnrichmentAttempted: number;
  aiEnrichmentSucceeded: number;
  aiEnrichmentFailed: number;
  aiEnrichmentTimeouts: number;
  aiEnrichmentParseErrors: number;
  aiResponseLatencyMs: number[];
  
  // Fallback
  fallbackUsed: number;
  fallbackReasons: Record<string, number>;
  
  // Validation
  validationAttempted: number;
  validationPassed: number;
  validationFailed: number;
  validationErrors: Record<string, number>;
  
  // Normalization
  normalizationAttempted: number;
  normalizationSucceeded: number;
  normalizationFailed: number;
  
  // Timestamps
  lastReset: string;
  lastUpdate: string;
}

// ============================================================================
// METRICS STORAGE
// ============================================================================

const metrics: RecommendationMetrics = {
  aiEnrichmentAttempted: 0,
  aiEnrichmentSucceeded: 0,
  aiEnrichmentFailed: 0,
  aiEnrichmentTimeouts: 0,
  aiEnrichmentParseErrors: 0,
  aiResponseLatencyMs: [],
  fallbackUsed: 0,
  fallbackReasons: {},
  validationAttempted: 0,
  validationPassed: 0,
  validationFailed: 0,
  validationErrors: {},
  normalizationAttempted: 0,
  normalizationSucceeded: 0,
  normalizationFailed: 0,
  lastReset: new Date().toISOString(),
  lastUpdate: new Date().toISOString(),
};

// ============================================================================
// METRICS TRACKING
// ============================================================================

/**
 * Track AI enrichment attempt
 */
export function trackAIEnrichmentAttempted(): void {
  metrics.aiEnrichmentAttempted++;
  metrics.lastUpdate = new Date().toISOString();
}

/**
 * Track AI enrichment success
 */
export function trackAIEnrichmentSucceeded(latencyMs: number): void {
  metrics.aiEnrichmentSucceeded++;
  metrics.aiResponseLatencyMs.push(latencyMs);
  
  // Keep only last 100 latency measurements
  if (metrics.aiResponseLatencyMs.length > 100) {
    metrics.aiResponseLatencyMs.shift();
  }
  
  metrics.lastUpdate = new Date().toISOString();
  
  logger.info('AI enrichment succeeded', {
    latencyMs,
    successRate: (metrics.aiEnrichmentSucceeded / metrics.aiEnrichmentAttempted * 100).toFixed(1) + '%',
  });
}

/**
 * Track AI enrichment failure
 */
export function trackAIEnrichmentFailed(reason: string, latencyMs?: number): void {
  metrics.aiEnrichmentFailed++;
  
  if (latencyMs) {
    metrics.aiResponseLatencyMs.push(latencyMs);
    if (metrics.aiResponseLatencyMs.length > 100) {
      metrics.aiResponseLatencyMs.shift();
    }
  }
  
  if (reason.includes('timeout')) {
    metrics.aiEnrichmentTimeouts++;
  } else if (reason.includes('parse')) {
    metrics.aiEnrichmentParseErrors++;
  }
  
  metrics.lastUpdate = new Date().toISOString();
  
  logger.warn('AI enrichment failed', {
    reason,
    latencyMs,
    failureRate: (metrics.aiEnrichmentFailed / metrics.aiEnrichmentAttempted * 100).toFixed(1) + '%',
  });
}

/**
 * Track fallback usage
 */
export function trackFallbackUsed(reason: string): void {
  metrics.fallbackUsed++;
  metrics.fallbackReasons[reason] = (metrics.fallbackReasons[reason] || 0) + 1;
  metrics.lastUpdate = new Date().toISOString();
  
  logger.warn('Fallback to direct emission used', {
    reason,
    fallbackCount: metrics.fallbackUsed,
    fallbackRate: (metrics.fallbackUsed / metrics.aiEnrichmentAttempted * 100).toFixed(1) + '%',
  });
}

/**
 * Track validation attempt
 */
export function trackValidationAttempted(): void {
  metrics.validationAttempted++;
  metrics.lastUpdate = new Date().toISOString();
}

/**
 * Track validation success
 */
export function trackValidationPassed(): void {
  metrics.validationPassed++;
  metrics.lastUpdate = new Date().toISOString();
}

/**
 * Track validation failure
 */
export function trackValidationFailed(errors: string[]): void {
  metrics.validationFailed++;
  
  errors.forEach(error => {
    const errorKey = error.split(':')[0] || 'unknown';
    metrics.validationErrors[errorKey] = (metrics.validationErrors[errorKey] || 0) + 1;
  });
  
  metrics.lastUpdate = new Date().toISOString();
  
  logger.warn('Validation failed', {
    errors,
    failureRate: (metrics.validationFailed / metrics.validationAttempted * 100).toFixed(1) + '%',
  });
}

/**
 * Track normalization attempt
 */
export function trackNormalizationAttempted(): void {
  metrics.normalizationAttempted++;
  metrics.lastUpdate = new Date().toISOString();
}

/**
 * Track normalization success
 */
export function trackNormalizationSucceeded(): void {
  metrics.normalizationSucceeded++;
  metrics.lastUpdate = new Date().toISOString();
}

/**
 * Track normalization failure
 */
export function trackNormalizationFailed(error: string): void {
  metrics.normalizationFailed++;
  metrics.lastUpdate = new Date().toISOString();
  
  logger.warn('Normalization failed', {
    error,
    failureRate: (metrics.normalizationFailed / metrics.normalizationAttempted * 100).toFixed(1) + '%',
  });
}

// ============================================================================
// METRICS RETRIEVAL
// ============================================================================

/**
 * Get current metrics
 */
export function getRecommendationMetrics(): RecommendationMetrics & {
  avgAIResponseLatencyMs: number;
  aiSuccessRate: number;
  aiFallbackRate: number;
  validationSuccessRate: number;
  normalizationSuccessRate: number;
} {
  const avgLatency = metrics.aiResponseLatencyMs.length > 0
    ? metrics.aiResponseLatencyMs.reduce((sum, val) => sum + val, 0) / metrics.aiResponseLatencyMs.length
    : 0;
  
  const aiSuccessRate = metrics.aiEnrichmentAttempted > 0
    ? (metrics.aiEnrichmentSucceeded / metrics.aiEnrichmentAttempted) * 100
    : 0;
  
  const aiFallbackRate = metrics.aiEnrichmentAttempted > 0
    ? (metrics.fallbackUsed / metrics.aiEnrichmentAttempted) * 100
    : 0;
  
  const validationSuccessRate = metrics.validationAttempted > 0
    ? (metrics.validationPassed / metrics.validationAttempted) * 100
    : 0;
  
  const normalizationSuccessRate = metrics.normalizationAttempted > 0
    ? (metrics.normalizationSucceeded / metrics.normalizationAttempted) * 100
    : 0;
  
  return {
    ...metrics,
    avgAIResponseLatencyMs: Math.round(avgLatency),
    aiSuccessRate: parseFloat(aiSuccessRate.toFixed(1)),
    aiFallbackRate: parseFloat(aiFallbackRate.toFixed(1)),
    validationSuccessRate: parseFloat(validationSuccessRate.toFixed(1)),
    normalizationSuccessRate: parseFloat(normalizationSuccessRate.toFixed(1)),
  };
}

/**
 * Reset metrics
 */
export function resetRecommendationMetrics(): void {
  metrics.aiEnrichmentAttempted = 0;
  metrics.aiEnrichmentSucceeded = 0;
  metrics.aiEnrichmentFailed = 0;
  metrics.aiEnrichmentTimeouts = 0;
  metrics.aiEnrichmentParseErrors = 0;
  metrics.aiResponseLatencyMs = [];
  metrics.fallbackUsed = 0;
  metrics.fallbackReasons = {};
  metrics.validationAttempted = 0;
  metrics.validationPassed = 0;
  metrics.validationFailed = 0;
  metrics.validationErrors = {};
  metrics.normalizationAttempted = 0;
  metrics.normalizationSucceeded = 0;
  metrics.normalizationFailed = 0;
  metrics.lastReset = new Date().toISOString();
  metrics.lastUpdate = new Date().toISOString();
  
  logger.info('Recommendation metrics reset');
}

/**
 * Log metrics summary
 */
export function logMetricsSummary(): void {
  const summary = getRecommendationMetrics();
  
  logger.info('Recommendation Metrics Summary', {
    aiEnrichment: {
      attempted: summary.aiEnrichmentAttempted,
      succeeded: summary.aiEnrichmentSucceeded,
      failed: summary.aiEnrichmentFailed,
      successRate: `${summary.aiSuccessRate}%`,
      avgLatencyMs: summary.avgAIResponseLatencyMs,
      timeouts: summary.aiEnrichmentTimeouts,
      parseErrors: summary.aiEnrichmentParseErrors,
    },
    fallback: {
      used: summary.fallbackUsed,
      rate: `${summary.aiFallbackRate}%`,
      reasons: summary.fallbackReasons,
    },
    validation: {
      attempted: summary.validationAttempted,
      passed: summary.validationPassed,
      failed: summary.validationFailed,
      successRate: `${summary.validationSuccessRate}%`,
      errors: summary.validationErrors,
    },
    normalization: {
      attempted: summary.normalizationAttempted,
      succeeded: summary.normalizationSucceeded,
      failed: summary.normalizationFailed,
      successRate: `${summary.normalizationSuccessRate}%`,
    },
  });
}
