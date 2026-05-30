import { Router } from 'express';

import {
  getNutritionTodayIntegratedHandler,
  getNutritionTodayHistoryHandler,
  seedNutritionBaselineHandler,
} from '../controllers/nutritionTodayIntegratedController';

const router = Router();

router.get('/:user_id/today', getNutritionTodayIntegratedHandler);
router.get('/:user_id/history', getNutritionTodayHistoryHandler);
router.post('/seed', seedNutritionBaselineHandler);

export default router;
