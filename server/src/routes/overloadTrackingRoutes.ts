import { Router } from 'express';
import {
  getOverloadTrackingByDateHandler,
  getOverloadTrackingHistoryHandler,
  getOverloadTrackingByExerciseHandler,
  markOverloadCompletedHandler,
  getOverloadStatsHandler,
  getOverloadHistoryHandler,
  getOverloadConfigHandler,
  updateOverloadConfigHandler,
} from '../controllers/overloadTrackingController';

const router = Router();

/**
 * GET /overload-tracking/:user_id/:date
 * Get overload tracking for a specific date
 */
router.get('/:user_id/:date', getOverloadTrackingByDateHandler);

/**
 * GET /overload-tracking/:user_id/history
 * Get overload tracking history for a user
 */
router.get('/:user_id/history', getOverloadTrackingHistoryHandler);

/**
 * GET /overload-tracking/:user_id/exercise/:exercise_key
 * Get overload tracking for a specific exercise
 */
router.get('/:user_id/exercise/:exercise_key', getOverloadTrackingByExerciseHandler);

/**
 * POST /overload-tracking/:user_id/:date/:exercise_key/complete
 * Mark overload as completed
 */
router.post('/:user_id/:date/:exercise_key/complete', markOverloadCompletedHandler);

/**
 * GET /overload-tracking/:user_id/stats
 * Get overload completion statistics
 */
router.get('/:user_id/stats', getOverloadStatsHandler);

/**
 * GET /overload-tracking/:user_id/decision-history
 * Get overload decision history
 */
router.get('/:user_id/decision-history', getOverloadHistoryHandler);

/**
 * GET /overload-tracking/:user_id/config
 * Get overload config for a user
 */
router.get('/:user_id/config', getOverloadConfigHandler);

/**
 * PUT /overload-tracking/:user_id/config
 * Update overload config for a user
 */
router.put('/:user_id/config', updateOverloadConfigHandler);

export default router;
