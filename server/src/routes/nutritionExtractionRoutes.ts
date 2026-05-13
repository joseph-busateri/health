import { Router } from 'express';

import {
  postNutritionExtraction,
  getNutritionExtractions,
  getLatestNutritionExtractionHandler,
} from '../controllers/nutritionExtractionController';

const router = Router();

router.post('/nutrition/extract', postNutritionExtraction);
router.get('/nutrition/entries/:user_id', getNutritionExtractions);
router.get('/nutrition/entry/latest/:user_id', getLatestNutritionExtractionHandler);

export default router;
