/**
 * Phase 24: Correlation History Controller
 * 
 * Purpose: API endpoints for historical correlations, trends, and alerts
 * Features: History retrieval, trend analysis, alert management
 */

import { Request, Response } from 'express';
import { getUnifiedHealthSnapshot } from '../services/unifiedHealthDataService';
import { analyzeCorrelations } from '../services/crossSourceCorrelationService';
import {
  saveCorrelationHistory,
  getCorrelationHistory,
  getCorrelationByType,
  getRecurringCorrelations,
  getCorrelationTrend,
} from '../services/correlationHistoryService';
import {
  cacheSnapshot,
  getCachedSnapshot,
  cacheCorrelations,
  getCachedCorrelations,
  invalidateUserCache,
  getCacheStats,
} from '../services/correlationCacheService';
import {
  detectAlerts,
  getActiveAlerts,
  getAllAlerts,
  acknowledgeAlert,
  resolveAlert,
} from '../services/correlationAlertService';
import { logger } from '../utils/logger';

// ============================================================================
// ENHANCED UNIFIED SNAPSHOT (with caching)
// ============================================================================

export const getUnifiedSnapshotCached = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;

    logger.info('📊 [CORRELATION API] Fetching unified snapshot (cached)', {
      userId,
      date: date || 'today',
    });

    // Check cache first
    const cached = getCachedSnapshot(userId, date);
    if (cached) {
      return res.json({
        success: true,
        snapshot: cached,
        cached: true,
      });
    }

    // Cache miss - fetch fresh data
    const snapshot = await getUnifiedHealthSnapshot(userId, date);
    
    // Cache the result
    cacheSnapshot(userId, snapshot, date);

    return res.json({
      success: true,
      snapshot,
      cached: false,
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to fetch snapshot', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch unified health snapshot',
    });
  }
};

// ============================================================================
// ENHANCED CORRELATIONS (with caching and history)
// ============================================================================

export const getCorrelationsCached = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const date = typeof req.query.date === 'string' ? req.query.date : undefined;

    logger.info('🔍 [CORRELATION API] Analyzing correlations (cached)', {
      userId,
      date: date || 'today',
    });

    // Check cache first
    const cached = getCachedCorrelations(userId, date);
    if (cached) {
      return res.json({
        success: true,
        analysis: cached,
        cached: true,
      });
    }

    // Cache miss - analyze fresh
    const snapshot = await getUnifiedHealthSnapshot(userId, date);
    const analysis = await analyzeCorrelations(snapshot);
    
    // Save to history
    await saveCorrelationHistory(analysis);
    
    // Cache the result
    cacheCorrelations(userId, analysis, date);

    // Detect alerts (async, don't wait)
    const history = await getCorrelationHistory(userId, 30);
    const recurring = await getRecurringCorrelations(userId, 30);
    detectAlerts(userId, analysis.correlations, history, recurring).catch(err => {
      logger.error('Failed to detect alerts', { error: err.message });
    });

    return res.json({
      success: true,
      analysis,
      cached: false,
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to analyze correlations', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze correlations',
    });
  }
};

// ============================================================================
// CORRELATION HISTORY
// ============================================================================

export const getHistory = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    logger.info('📖 [CORRELATION API] Fetching correlation history', {
      userId,
      days,
    });

    const history = await getCorrelationHistory(userId, days);

    return res.json({
      success: true,
      history,
      count: history.length,
      days,
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to fetch history', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch correlation history',
    });
  }
};

export const getHistoryByType = async (req: Request, res: Response) => {
  try {
    const { userId, type } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    logger.info('📖 [CORRELATION API] Fetching correlation history by type', {
      userId,
      type,
      days,
    });

    const history = await getCorrelationByType(userId, type, days);

    return res.json({
      success: true,
      history,
      count: history.length,
      type,
      days,
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to fetch history by type', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch correlation history by type',
    });
  }
};

// ============================================================================
// CORRELATION TRENDS
// ============================================================================

export const getTrends = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    logger.info('📊 [CORRELATION API] Analyzing correlation trends', {
      userId,
      days,
    });

    const recurring = await getRecurringCorrelations(userId, days);

    return res.json({
      success: true,
      trends: {
        recurring,
        recurringCount: recurring.length,
      },
      days,
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to analyze trends', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to analyze correlation trends',
    });
  }
};

export const getRecurring = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const days = parseInt(req.query.days as string) || 30;
    const minOccurrences = parseInt(req.query.minOccurrences as string) || 3;

    logger.info('🔄 [CORRELATION API] Fetching recurring correlations', {
      userId,
      days,
      minOccurrences,
    });

    const recurring = await getRecurringCorrelations(userId, days, minOccurrences);

    return res.json({
      success: true,
      recurring,
      count: recurring.length,
      days,
      minOccurrences,
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to fetch recurring correlations', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch recurring correlations',
    });
  }
};

export const getCorrelationTrendById = async (req: Request, res: Response) => {
  try {
    const { userId, correlationId } = req.params;
    const days = parseInt(req.query.days as string) || 30;

    logger.info('📈 [CORRELATION API] Fetching correlation trend', {
      userId,
      correlationId,
      days,
    });

    const trend = await getCorrelationTrend(userId, correlationId, days);

    if (!trend) {
      return res.status(404).json({
        success: false,
        error: 'Correlation trend not found',
      });
    }

    return res.json({
      success: true,
      trend,
      correlationId,
      days,
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to fetch correlation trend', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch correlation trend',
    });
  }
};

// ============================================================================
// ALERTS
// ============================================================================

export const getAlerts = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const activeOnly = req.query.activeOnly === 'true';

    logger.info('🔔 [CORRELATION API] Fetching alerts', {
      userId,
      activeOnly,
    });

    const alerts = activeOnly
      ? await getActiveAlerts(userId)
      : await getAllAlerts(userId);

    return res.json({
      success: true,
      alerts,
      count: alerts.length,
      activeOnly,
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to fetch alerts', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch alerts',
    });
  }
};

export const acknowledgeAlertById = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    logger.info('✓ [CORRELATION API] Acknowledging alert', { alertId });

    const success = await acknowledgeAlert(alertId);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to acknowledge alert',
      });
    }

    return res.json({
      success: true,
      message: 'Alert acknowledged',
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to acknowledge alert', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to acknowledge alert',
    });
  }
};

export const resolveAlertById = async (req: Request, res: Response) => {
  try {
    const { alertId } = req.params;

    logger.info('✓ [CORRELATION API] Resolving alert', { alertId });

    const success = await resolveAlert(alertId);

    if (!success) {
      return res.status(500).json({
        success: false,
        error: 'Failed to resolve alert',
      });
    }

    return res.json({
      success: true,
      message: 'Alert resolved',
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to resolve alert', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to resolve alert',
    });
  }
};

// ============================================================================
// CACHE MANAGEMENT
// ============================================================================

export const invalidateCache = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;

    logger.info('🗑️ [CORRELATION API] Invalidating cache', { userId });

    invalidateUserCache(userId);

    return res.json({
      success: true,
      message: 'Cache invalidated',
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to invalidate cache', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to invalidate cache',
    });
  }
};

export const getCacheStatistics = async (req: Request, res: Response) => {
  try {
    logger.info('📊 [CORRELATION API] Fetching cache statistics');

    const stats = getCacheStats();

    return res.json({
      success: true,
      stats,
    });
  } catch (error) {
    logger.error('❌ [CORRELATION API] Failed to fetch cache stats', {
      error: (error as Error).message,
    });
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch cache statistics',
    });
  }
};
