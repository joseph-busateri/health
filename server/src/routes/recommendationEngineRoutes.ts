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
router.post('/recommendations', createRecommendationHandler);

// Batch create recommendations
router.post('/recommendations/batch', batchCreateRecommendationsHandler);

// ============================================================================
// GET ROUTES
// ============================================================================

// Get active recommendations
router.get('/recommendations/active/:userId', getActiveRecommendationsHandler);

// Get prioritized recommendations
router.get('/recommendations/prioritized/:userId', getPrioritizedRecommendationsHandler);

// ============================================================================
// STATE TRANSITION ROUTES
// ============================================================================

// Accept recommendation
router.post('/recommendations/:recommendationId/accept', acceptRecommendationHandler);

// Reject recommendation
router.post('/recommendations/:recommendationId/reject', rejectRecommendationHandler);

// Snooze recommendation
router.post('/recommendations/:recommendationId/snooze', snoozeRecommendationHandler);

// Complete recommendation
router.post('/recommendations/:recommendationId/complete', completeRecommendationHandler);

// Modify recommendation
router.post('/recommendations/:recommendationId/modify', modifyRecommendationHandler);

export default router;
