/**
 * Phase 23: Unified Health Data Routes
 * 
 * Purpose: API routes for unified health data and cross-source correlations
 * Endpoints:
 * - GET /api/unified-health/:userId - Get unified health snapshot
 * - GET /api/unified-health/:userId/correlations - Get cross-source correlations
 * - GET /api/unified-health/:userId/data-quality - Get data quality metrics
 * - GET /api/unified-health/:userId/complete - Get snapshot with correlations
 * - GET /api/unified-health/:userId/summary - Get source summary
 */

import { Router } from 'express';
import {
  getUnifiedSnapshot,
  getCorrelations,
  getDataQuality,
  getSnapshotWithCorrelations,
  getSourceSummary,
} from '../controllers/unifiedHealthDataController';

const router = Router();

// Get unified health snapshot
// Query params: date (optional, defaults to today)
router.get('/:userId', getUnifiedSnapshot);

// Get cross-source correlations
// Query params: date (optional, defaults to today)
router.get('/:userId/correlations', getCorrelations);

// Get data quality metrics
// Query params: date (optional, defaults to today)
router.get('/:userId/data-quality', getDataQuality);

// Get snapshot with correlations (combined endpoint)
// Query params: date (optional, defaults to today)
router.get('/:userId/complete', getSnapshotWithCorrelations);

// Get source summary
// Query params: date (optional, defaults to today)
router.get('/:userId/summary', getSourceSummary);

export default router;
