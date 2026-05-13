/**
 * Phase 24: Correlation History Routes
 * 
 * Purpose: API routes for historical correlations, trends, and alerts
 * Endpoints:
 * - GET /api/correlations/:userId/history - Get correlation history
 * - GET /api/correlations/:userId/history/:type - Get history by type
 * - GET /api/correlations/:userId/trends - Get correlation trends
 * - GET /api/correlations/:userId/recurring - Get recurring correlations
 * - GET /api/correlations/:userId/trend/:correlationId - Get specific correlation trend
 * - GET /api/correlations/:userId/alerts - Get alerts
 * - POST /api/correlations/:userId/alerts/:alertId/acknowledge - Acknowledge alert
 * - POST /api/correlations/:userId/alerts/:alertId/resolve - Resolve alert
 * - DELETE /api/correlations/:userId/cache - Invalidate cache
 * - GET /api/correlations/cache/stats - Get cache statistics
 */

import { Router } from 'express';
import {
  getUnifiedSnapshotCached,
  getCorrelationsCached,
  getHistory,
  getHistoryByType,
  getTrends,
  getRecurring,
  getCorrelationTrendById,
  getAlerts,
  acknowledgeAlertById,
  resolveAlertById,
  invalidateCache,
  getCacheStatistics,
} from '../controllers/correlationHistoryController';

const router = Router();

// Enhanced unified health endpoints (with caching)
router.get('/:userId/snapshot', getUnifiedSnapshotCached);
router.get('/:userId/analyze', getCorrelationsCached);

// Correlation history endpoints
router.get('/:userId/history', getHistory);
router.get('/:userId/history/:type', getHistoryByType);

// Trend analysis endpoints
router.get('/:userId/trends', getTrends);
router.get('/:userId/recurring', getRecurring);
router.get('/:userId/trend/:correlationId', getCorrelationTrendById);

// Alert management endpoints
router.get('/:userId/alerts', getAlerts);
router.post('/:userId/alerts/:alertId/acknowledge', acknowledgeAlertById);
router.post('/:userId/alerts/:alertId/resolve', resolveAlertById);

// Cache management endpoints
router.delete('/:userId/cache', invalidateCache);
router.get('/cache/stats', getCacheStatistics);

export default router;
