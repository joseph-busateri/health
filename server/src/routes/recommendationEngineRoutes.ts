/**
 * RecommendationEngine Routes
 * 
 * API routes for the central recommendation engine.
 */

import { Router } from 'express';
import {
  createRecommendationHandler,
  batchCreateRecommendationsHandler,
  getActiveRecommendationsHandler,
  getPrioritizedRecommendationsHandler,
  acceptRecommendationHandler,
  rejectRecommendationHandler,
  snoozeRecommendationHandler,
  completeRecommendationHandler,
  modifyRecommendationHandler,
} from '../controllers/recommendationEngineController';

const router = Router();

// ============================================================================
// CREATE ROUTES
// ============================================================================

// Create single recommendation
router.post('/', createRecommendationHandler);

// Batch create recommendations
router.post('/batch', batchCreateRecommendationsHandler);

// ============================================================================
// GET ROUTES
// ============================================================================

// Get active recommendations
router.get('/active/:userId', getActiveRecommendationsHandler);

// Get prioritized recommendations
router.get('/prioritized/:userId', getPrioritizedRecommendationsHandler);

// ============================================================================
// STATE TRANSITION ROUTES
// ============================================================================

// Accept recommendation
router.post('/:recommendationId/accept', acceptRecommendationHandler);

// Reject recommendation
router.post('/:recommendationId/reject', rejectRecommendationHandler);

// Snooze recommendation
router.post('/:recommendationId/snooze', snoozeRecommendationHandler);

// Complete recommendation
router.post('/:recommendationId/complete', completeRecommendationHandler);

// Modify recommendation
router.post('/:recommendationId/modify', modifyRecommendationHandler);

export default router;
