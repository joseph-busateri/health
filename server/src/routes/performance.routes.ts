import { Router } from 'express';
import { getPerformanceTodayHandler } from '../controllers/performanceEngineController';

const router = Router();

// Get performance assessment for today
router.get('/:user_id/today', getPerformanceTodayHandler);

export default router;
