import { logger } from '../utils/logger';

/**
 * Shared cache manager for baseline data and trend data
 * This avoids circular dependencies between services
 */

// In-memory cache for baseline context (shared across engines)
const baselineContextCache = new Map<string, { context: any; timestamp: number }>();
const trendDataCache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const TREND_CACHE_TTL = 15 * 60 * 1000; // 15 minutes for trend data (changes less frequently)

function isCacheValid(timestamp: number, ttl: number = CACHE_TTL): boolean {
  return Date.now() - timestamp < ttl;
}

/**
 * Get cached baseline context
 */
export function getCachedBaselineContext(userId: string): any | null {
  const cached = baselineContextCache.get(userId);
  if (cached && isCacheValid(cached.timestamp)) {
    return cached.context;
  }
  return null;
}

/**
 * Set cached baseline context
 */
export function setCachedBaselineContext(userId: string, context: any): void {
  baselineContextCache.set(userId, { context, timestamp: Date.now() });
}

/**
 * Invalidate baseline context cache for a user
 * Call this when profile or preferences are updated
 */
export function invalidateBaselineContext(userId: string): void {
  baselineContextCache.delete(userId);
  logger.info('🔄 [CACHE MANAGER] Baseline context cache invalidated', { userId });
}

/**
 * Get cached trend data for a user
 */
export function getCachedTrendData(userId: string, category?: string): any | null {
  const cacheKey = category ? `${userId}:${category}` : userId;
  const cached = trendDataCache.get(cacheKey);
  if (cached && isCacheValid(cached.timestamp, TREND_CACHE_TTL)) {
    logger.info('📈 [CACHE MANAGER] Trend data cache hit', { userId, category });
    return cached.data;
  }
  return null;
}

/**
 * Set cached trend data for a user
 */
export function setCachedTrendData(userId: string, data: any, category?: string): void {
  const cacheKey = category ? `${userId}:${category}` : userId;
  trendDataCache.set(cacheKey, { data, timestamp: Date.now() });
  logger.info('📈 [CACHE MANAGER] Trend data cached', { userId, category });
}

/**
 * Invalidate trend data cache for a user
 * Call this when new bloodwork data is uploaded
 */
export function invalidateTrendDataCache(userId: string): void {
  // Invalidate all trend data for this user (all categories)
  for (const [key] of trendDataCache.entries()) {
    if (key.startsWith(userId)) {
      trendDataCache.delete(key);
    }
  }
  logger.info('🔄 [CACHE MANAGER] Trend data cache invalidated', { userId });
}
