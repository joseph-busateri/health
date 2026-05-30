import { Router } from 'express';

import {
  getWorkoutRecommendationTodayHandler,
  getWorkoutRecommendationHistoryHandler,
} from '../controllers/workoutEngineController';

const router = Router();

router.get('/:user_id/today', getWorkoutRecommendationTodayHandler);
router.get('/:user_id/history', getWorkoutRecommendationHistoryHandler);

export default router;
