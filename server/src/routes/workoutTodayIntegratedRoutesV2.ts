import { Router } from 'express';
import { getWorkoutTodayV2Handler } from '../controllers/workoutTodayIntegratedControllerV2';

const router = Router();

/**
 * GET /workout-today-v2/:user_id/today
 * Get today's workout with enhanced progressive overload (V2)
 */
router.get('/:user_id/today', getWorkoutTodayV2Handler);

export default router;
