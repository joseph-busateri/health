/**
 * AI Service Wrapper with Fallback Patterns
 * 
 * Production-ready AI service wrapper that provides:
 * - Retry logic with exponential backoff
 * - Fallback pattern support
 * - Comprehensive error handling
 * - Logging and observability
 * 
 * Usage:
 * ```typescript
 * const result = await withAIFallback(
 *   () => callOpenAI(data),
 *   fallbackValue,
 *   { maxRetries: 3, serviceName: 'bloodwork-parser' }
 * );
 * ```
 */

import { logger } from '../utils/logger';

// ============================================================================
// TYPES
// ============================================================================

export interface AIFallbackOptions {
  /**
   * Maximum number of retry attempts (default: 3)
   */
  maxRetries?: number;
  
  /**
   * Service name for logging (e.g., 'bloodwork-parser', 'nutrition-extraction')
   */
  serviceName: string;
  
  /**
   * Whether to log fallback usage (default: true)
   */
  logFallback?: boolean;
  
  /**
   * Custom retry delay function (default: exponential backoff)
   */
  retryDelay?: (attempt: number) => number;
  
  /**
   * Timeout in milliseconds (default: 30000)
   */
  timeoutMs?: number;
}

export interface AIServiceMetrics {
  serviceName: string;
  attempts: number;
  successes: number;
  failures: number;
  fallbacks: number;
  retries: number;
  timeouts: number;
  avgLatencyMs: number;
  lastError?: string;
  lastErrorTime?: Date;
}

// ============================================================================
// METRICS TRACKING
// ============================================================================

const metricsStore = new Map<string, AIServiceMetrics>();

export function getAIServiceMetrics(serviceName?: string): AIServiceMetrics | Map<string, AIServiceMetrics> {
  if (serviceName) {
    return metricsStore.get(serviceName) || {
      serviceName,
      attempts: 0,
      successes: 0,
      failures: 0,
      fallbacks: 0,
      retries: 0,
      timeouts: 0,
      avgLatencyMs: 0,
    };
  }
  return new Map(metricsStore);
}

export function resetAIServiceMetrics(serviceName?: string): void {
  if (serviceName) {
    metricsStore.delete(serviceName);
  } else {
    metricsStore.clear();
  }
}

function updateMetrics(
  serviceName: string,
  update: Partial<AIServiceMetrics>
): void {
  const current = metricsStore.get(serviceName) || {
    serviceName,
    attempts: 0,
    successes: 0,
    failures: 0,
    fallbacks: 0,
    retries: 0,
    timeouts: 0,
    avgLatencyMs: 0,
  };
  
  metricsStore.set(serviceName, { ...current, ...update });
}

// ============================================================================
// RETRY LOGIC
// ============================================================================

/**
 * Default exponential backoff: 2s, 4s, 8s
 */
function defaultRetryDelay(attempt: number): number {
  return Math.pow(2, attempt) * 1000;
}

/**
 * Sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Execute function with retry logic
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  options: AIFallbackOptions
): Promise<T> {
  const maxRetries = options.maxRetries ?? 3;
  const retryDelay = options.retryDelay ?? defaultRetryDelay;
  
  let lastError: Error | undefined;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await fn();
      
      if (attempt > 1) {
        // Log successful retry
        logger.info(`[${options.serviceName}] Retry succeeded`, {
          attempt,
          maxRetries,
        });
        
        updateMetrics(options.serviceName, {
          retries: (metricsStore.get(options.serviceName)?.retries ?? 0) + (attempt - 1),
        });
      }
      
      return result;
    } catch (error) {
      lastError = error as Error;
      
      // Don't retry on certain errors
      if (isNonRetryableError(error)) {
        logger.warn(`[${options.serviceName}] Non-retryable error, not retrying`, {
          error: lastError.message,
          attempt,
        });
        throw error;
      }
      
      // Last attempt - throw error
      if (attempt === maxRetries) {
        logger.error(`[${options.serviceName}] All retry attempts failed`, {
          attempts: maxRetries,
          error: lastError.message,
        });
        throw error;
      }
      
      // Wait before retry
      const delayMs = retryDelay(attempt);
      logger.warn(`[${options.serviceName}] Retry attempt ${attempt}/${maxRetries} failed, waiting ${delayMs}ms`, {
        error: lastError.message,
        attempt,
        maxRetries,
        delayMs,
      });
      
      await sleep(delayMs);
    }
  }
  
  // Should never reach here, but TypeScript needs it
  throw lastError || new Error('Retry failed');
}

/**
 * Check if error should not be retried
 */
function isNonRetryableError(error: any): boolean {
  // Don't retry authentication errors
  if (error.status === 401 || error.status === 403) {
    return true;
  }
  
  // Don't retry invalid request errors
  if (error.status === 400) {
    return true;
  }
  
  // Don't retry if API key is missing
  if (error.message?.includes('OPENAI_API_KEY')) {
    return true;
  }
  
  return false;
}

// ============================================================================
// TIMEOUT WRAPPER
// ============================================================================

/**
 * Execute function with timeout
 */
async function withTimeout<T>(
  fn: () => Promise<T>,
  timeoutMs: number,
  serviceName: string
): Promise<T> {
  return Promise.race([
    fn(),
    new Promise<never>((_, reject) =>
      setTimeout(() => {
        updateMetrics(serviceName, {
          timeouts: (metricsStore.get(serviceName)?.timeouts ?? 0) + 1,
        });
        reject(new Error(`[${serviceName}] Timeout after ${timeoutMs}ms`));
      }, timeoutMs)
    ),
  ]);
}

// ============================================================================
// MAIN AI FALLBACK WRAPPER
// ============================================================================

/**
 * Execute AI function with fallback pattern
 * 
 * @param aiFn - Async function that calls AI service
 * @param fallbackValue - Value to return if AI fails
 * @param options - Configuration options
 * @returns AI result or fallback value
 * 
 * @example
 * ```typescript
 * const result = await withAIFallback(
 *   () => parseBloodworkWithAI(text),
 *   { rawText: text, requiresManualReview: true },
 *   { serviceName: 'bloodwork-parser' }
 * );
 * ```
 */
export async function withAIFallback<T>(
  aiFn: () => Promise<T>,
  fallbackValue: T,
  options: AIFallbackOptions
): Promise<T> {
  const startTime = Date.now();
  const timeoutMs = options.timeoutMs ?? 30000;
  
  // Update metrics - attempt
  const metrics = metricsStore.get(options.serviceName) || {
    serviceName: options.serviceName,
    attempts: 0,
    successes: 0,
    failures: 0,
    fallbacks: 0,
    retries: 0,
    timeouts: 0,
    avgLatencyMs: 0,
  };
  
  updateMetrics(options.serviceName, {
    attempts: metrics.attempts + 1,
  });
  
  try {
    // Execute with timeout and retry
    const result = await withTimeout(
      () => withRetry(aiFn, options),
      timeoutMs,
      options.serviceName
    );
    
    // Success
    const latencyMs = Date.now() - startTime;
    const newAvgLatency = (metrics.avgLatencyMs * metrics.successes + latencyMs) / (metrics.successes + 1);
    
    updateMetrics(options.serviceName, {
      successes: metrics.successes + 1,
      avgLatencyMs: Math.round(newAvgLatency),
    });
    
    logger.info(`[${options.serviceName}] AI call succeeded`, {
      latencyMs,
      avgLatencyMs: Math.round(newAvgLatency),
    });
    
    return result;
    
  } catch (error) {
    // Failure - use fallback
    const latencyMs = Date.now() - startTime;
    const errorMessage = (error as Error).message;
    
    updateMetrics(options.serviceName, {
      failures: metrics.failures + 1,
      fallbacks: metrics.fallbacks + 1,
      lastError: errorMessage,
      lastErrorTime: new Date(),
    });
    
    if (options.logFallback !== false) {
      logger.warn(`[${options.serviceName}] AI call failed, using fallback`, {
        error: errorMessage,
        latencyMs,
        fallbackUsed: true,
      });
    }
    
    return fallbackValue;
  }
}

// ============================================================================
// OPTIONAL AI (NO FALLBACK)
// ============================================================================

/**
 * Execute AI function that is optional (returns null on failure)
 * 
 * Use this for non-critical AI enhancements where failure is acceptable
 * 
 * @param aiFn - Async function that calls AI service
 * @param options - Configuration options
 * @returns AI result or null
 * 
 * @example
 * ```typescript
 * const enrichment = await withOptionalAI(
 *   () => enrichWithAI(data),
 *   { serviceName: 'optional-enrichment' }
 * );
 * 
 * if (enrichment) {
 *   // Use AI enrichment
 * } else {
 *   // Continue without enrichment
 * }
 * ```
 */
export async function withOptionalAI<T>(
  aiFn: () => Promise<T>,
  options: AIFallbackOptions
): Promise<T | null> {
  return withAIFallback(aiFn, null, options);
}

// ============================================================================
// HEALTH CHECK
// ============================================================================

/**
 * Get health status of all AI services
 */
export function getAIServicesHealth(): {
  healthy: string[];
  degraded: string[];
  failing: string[];
} {
  const healthy: string[] = [];
  const degraded: string[] = [];
  const failing: string[] = [];
  
  metricsStore.forEach((metrics, serviceName) => {
    if (metrics.attempts === 0) {
      return; // No data yet
    }
    
    const successRate = metrics.successes / metrics.attempts;
    const fallbackRate = metrics.fallbacks / metrics.attempts;
    
    if (successRate >= 0.95) {
      healthy.push(serviceName);
    } else if (successRate >= 0.7 || fallbackRate < 0.5) {
      degraded.push(serviceName);
    } else {
      failing.push(serviceName);
    }
  });
  
  return { healthy, degraded, failing };
}

// ============================================================================
// EXPORTS
// ============================================================================

export default {
  withAIFallback,
  withOptionalAI,
  getAIServiceMetrics,
  resetAIServiceMetrics,
  getAIServicesHealth,
};
