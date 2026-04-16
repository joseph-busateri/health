/**
 * Phase 24: Correlation Cache Service
 * 
 * Purpose: In-memory caching for unified snapshots and correlation analysis
 * Features: TTL-based caching, cache invalidation, performance optimization
 */

import { logger } from '../utils/logger';
import type { UnifiedHealthSnapshot } from './unifiedHealthDataService';
import type { CorrelationAnalysis } from './crossSourceCorrelationService';

// ============================================================================
// TYPES
// ============================================================================

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // milliseconds
}

interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  hitRate: number;
}

// ============================================================================
// CACHE STORAGE
// ============================================================================

const snapshotCache = new Map<string, CacheEntry<UnifiedHealthSnapshot>>();
const correlationCache = new Map<string, CacheEntry<CorrelationAnalysis>>();

// Cache configuration
const DEFAULT_SNAPSHOT_TTL = 15 * 60 * 1000; // 15 minutes
const DEFAULT_CORRELATION_TTL = 15 * 60 * 1000; // 15 minutes
const MAX_CACHE_SIZE = 1000; // Maximum entries per cache

// Cache statistics
let snapshotStats = { hits: 0, misses: 0 };
let correlationStats = { hits: 0, misses: 0 };

// ============================================================================
// CACHE KEY GENERATION
// ============================================================================

function generateSnapshotKey(userId: string, date?: string): string {
  const dateKey = date || new Date().toISOString().split('T')[0];
  return `snapshot:${userId}:${dateKey}`;
}

function generateCorrelationKey(userId: string, date?: string): string {
  const dateKey = date || new Date().toISOString().split('T')[0];
  return `correlation:${userId}:${dateKey}`;
}

// ============================================================================
// CACHE OPERATIONS - SNAPSHOTS
// ============================================================================

/**
 * Cache a unified health snapshot
 */
export function cacheSnapshot(
  userId: string,
  snapshot: UnifiedHealthSnapshot,
  date?: string,
  ttl: number = DEFAULT_SNAPSHOT_TTL
): void {
  try {
    const key = generateSnapshotKey(userId, date);
    
    // Enforce max cache size (LRU-style eviction)
    if (snapshotCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = snapshotCache.keys().next().value;
      snapshotCache.delete(oldestKey);
      logger.info('🗑️ [CACHE] Evicted oldest snapshot entry', { key: oldestKey });
    }

    snapshotCache.set(key, {
      data: snapshot,
      timestamp: Date.now(),
      ttl,
    });

    logger.info('💾 [CACHE] Snapshot cached', {
      key,
      ttl: `${ttl / 1000}s`,
      cacheSize: snapshotCache.size,
    });
  } catch (error) {
    logger.error('❌ [CACHE] Failed to cache snapshot', {
      error: (error as Error).message,
      userId,
    });
  }
}

/**
 * Get cached unified health snapshot
 */
export function getCachedSnapshot(
  userId: string,
  date?: string
): UnifiedHealthSnapshot | null {
  try {
    const key = generateSnapshotKey(userId, date);
    const entry = snapshotCache.get(key);

    if (!entry) {
      snapshotStats.misses++;
      logger.info('❌ [CACHE] Snapshot cache miss', { key });
      return null;
    }

    // Check if entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      snapshotCache.delete(key);
      snapshotStats.misses++;
      logger.info('⏰ [CACHE] Snapshot cache expired', {
        key,
        age: `${age / 1000}s`,
        ttl: `${entry.ttl / 1000}s`,
      });
      return null;
    }

    snapshotStats.hits++;
    logger.info('✅ [CACHE] Snapshot cache hit', {
      key,
      age: `${age / 1000}s`,
    });

    return entry.data;
  } catch (error) {
    logger.error('❌ [CACHE] Failed to get cached snapshot', {
      error: (error as Error).message,
      userId,
    });
    return null;
  }
}

// ============================================================================
// CACHE OPERATIONS - CORRELATIONS
// ============================================================================

/**
 * Cache correlation analysis
 */
export function cacheCorrelations(
  userId: string,
  analysis: CorrelationAnalysis,
  date?: string,
  ttl: number = DEFAULT_CORRELATION_TTL
): void {
  try {
    const key = generateCorrelationKey(userId, date);
    
    // Enforce max cache size
    if (correlationCache.size >= MAX_CACHE_SIZE) {
      const oldestKey = correlationCache.keys().next().value;
      correlationCache.delete(oldestKey);
      logger.info('🗑️ [CACHE] Evicted oldest correlation entry', { key: oldestKey });
    }

    correlationCache.set(key, {
      data: analysis,
      timestamp: Date.now(),
      ttl,
    });

    logger.info('💾 [CACHE] Correlations cached', {
      key,
      ttl: `${ttl / 1000}s`,
      cacheSize: correlationCache.size,
    });
  } catch (error) {
    logger.error('❌ [CACHE] Failed to cache correlations', {
      error: (error as Error).message,
      userId,
    });
  }
}

/**
 * Get cached correlation analysis
 */
export function getCachedCorrelations(
  userId: string,
  date?: string
): CorrelationAnalysis | null {
  try {
    const key = generateCorrelationKey(userId, date);
    const entry = correlationCache.get(key);

    if (!entry) {
      correlationStats.misses++;
      logger.info('❌ [CACHE] Correlation cache miss', { key });
      return null;
    }

    // Check if entry has expired
    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl) {
      correlationCache.delete(key);
      correlationStats.misses++;
      logger.info('⏰ [CACHE] Correlation cache expired', {
        key,
        age: `${age / 1000}s`,
        ttl: `${entry.ttl / 1000}s`,
      });
      return null;
    }

    correlationStats.hits++;
    logger.info('✅ [CACHE] Correlation cache hit', {
      key,
      age: `${age / 1000}s`,
    });

    return entry.data;
  } catch (error) {
    logger.error('❌ [CACHE] Failed to get cached correlations', {
      error: (error as Error).message,
      userId,
    });
    return null;
  }
}

// ============================================================================
// CACHE INVALIDATION
// ============================================================================

/**
 * Invalidate all cache entries for a user
 */
export function invalidateUserCache(userId: string): void {
  try {
    let deletedCount = 0;

    // Invalidate snapshot cache
    for (const key of snapshotCache.keys()) {
      if (key.includes(userId)) {
        snapshotCache.delete(key);
        deletedCount++;
      }
    }

    // Invalidate correlation cache
    for (const key of correlationCache.keys()) {
      if (key.includes(userId)) {
        correlationCache.delete(key);
        deletedCount++;
      }
    }

    logger.info('🗑️ [CACHE] User cache invalidated', {
      userId,
      deletedCount,
    });
  } catch (error) {
    logger.error('❌ [CACHE] Failed to invalidate user cache', {
      error: (error as Error).message,
      userId,
    });
  }
}

/**
 * Invalidate cache for specific date
 */
export function invalidateDateCache(userId: string, date: string): void {
  try {
    const snapshotKey = generateSnapshotKey(userId, date);
    const correlationKey = generateCorrelationKey(userId, date);

    snapshotCache.delete(snapshotKey);
    correlationCache.delete(correlationKey);

    logger.info('🗑️ [CACHE] Date cache invalidated', {
      userId,
      date,
    });
  } catch (error) {
    logger.error('❌ [CACHE] Failed to invalidate date cache', {
      error: (error as Error).message,
      userId,
      date,
    });
  }
}

/**
 * Clear all cache entries
 */
export function clearAllCache(): void {
  try {
    const totalSize = snapshotCache.size + correlationCache.size;
    
    snapshotCache.clear();
    correlationCache.clear();
    
    // Reset stats
    snapshotStats = { hits: 0, misses: 0 };
    correlationStats = { hits: 0, misses: 0 };

    logger.info('🗑️ [CACHE] All cache cleared', {
      entriesCleared: totalSize,
    });
  } catch (error) {
    logger.error('❌ [CACHE] Failed to clear cache', {
      error: (error as Error).message,
    });
  }
}

/**
 * Clean up expired entries
 */
export function cleanupExpiredEntries(): number {
  try {
    let deletedCount = 0;
    const now = Date.now();

    // Clean snapshot cache
    for (const [key, entry] of snapshotCache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        snapshotCache.delete(key);
        deletedCount++;
      }
    }

    // Clean correlation cache
    for (const [key, entry] of correlationCache.entries()) {
      const age = now - entry.timestamp;
      if (age > entry.ttl) {
        correlationCache.delete(key);
        deletedCount++;
      }
    }

    if (deletedCount > 0) {
      logger.info('🧹 [CACHE] Expired entries cleaned', {
        deletedCount,
      });
    }

    return deletedCount;
  } catch (error) {
    logger.error('❌ [CACHE] Failed to cleanup expired entries', {
      error: (error as Error).message,
    });
    return 0;
  }
}

// ============================================================================
// CACHE STATISTICS
// ============================================================================

/**
 * Get cache statistics
 */
export function getCacheStats(): {
  snapshots: CacheStats;
  correlations: CacheStats;
  total: CacheStats;
} {
  const snapshotHitRate = snapshotStats.hits + snapshotStats.misses > 0
    ? snapshotStats.hits / (snapshotStats.hits + snapshotStats.misses)
    : 0;

  const correlationHitRate = correlationStats.hits + correlationStats.misses > 0
    ? correlationStats.hits / (correlationStats.hits + correlationStats.misses)
    : 0;

  const totalHits = snapshotStats.hits + correlationStats.hits;
  const totalMisses = snapshotStats.misses + correlationStats.misses;
  const totalHitRate = totalHits + totalMisses > 0
    ? totalHits / (totalHits + totalMisses)
    : 0;

  return {
    snapshots: {
      hits: snapshotStats.hits,
      misses: snapshotStats.misses,
      size: snapshotCache.size,
      hitRate: snapshotHitRate,
    },
    correlations: {
      hits: correlationStats.hits,
      misses: correlationStats.misses,
      size: correlationCache.size,
      hitRate: correlationHitRate,
    },
    total: {
      hits: totalHits,
      misses: totalMisses,
      size: snapshotCache.size + correlationCache.size,
      hitRate: totalHitRate,
    },
  };
}

/**
 * Reset cache statistics
 */
export function resetCacheStats(): void {
  snapshotStats = { hits: 0, misses: 0 };
  correlationStats = { hits: 0, misses: 0 };
  logger.info('📊 [CACHE] Statistics reset');
}

// ============================================================================
// CACHE MAINTENANCE
// ============================================================================

// Run cleanup every 5 minutes
setInterval(() => {
  cleanupExpiredEntries();
}, 5 * 60 * 1000);

// Log cache stats every hour
setInterval(() => {
  const stats = getCacheStats();
  logger.info('📊 [CACHE] Hourly statistics', {
    snapshotHitRate: `${(stats.snapshots.hitRate * 100).toFixed(1)}%`,
    correlationHitRate: `${(stats.correlations.hitRate * 100).toFixed(1)}%`,
    totalHitRate: `${(stats.total.hitRate * 100).toFixed(1)}%`,
    totalSize: stats.total.size,
  });
}, 60 * 60 * 1000);
