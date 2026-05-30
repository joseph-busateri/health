import { Router } from 'express';

import {
  getWorkoutTodayIntegratedHandler,
  getWorkoutTodayHistoryHandler,
} from '../controllers/workoutTodayIntegratedController';

const router = Router();

router.get('/:user_id/today', getWorkoutTodayIntegratedHandler);
router.get('/:user_id/history', getWorkoutTodayHistoryHandler);

export default router;
