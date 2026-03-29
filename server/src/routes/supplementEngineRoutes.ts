import { Router } from 'express';
import {
  generateSupplementRecommendationsHandler,
  getSupplementRecommendationsHandler,
  getCurrentSupplementStackHandler,
  seedSupplementBaselineHandler,
} from '../controllers/supplementEngineController';

const router = Router();

// POST /supplements/seed/:user_id - Seed baseline for testing
router.post('/supplements/seed/:user_id', seedSupplementBaselineHandler);

// POST /supplements/recommendations/generate/:user_id - Generate supplement recommendations
router.post('/supplements/recommendations/generate/:user_id', generateSupplementRecommendationsHandler);

// GET /supplements/recommendations/:user_id - Get supplement recommendations
router.get('/supplements/recommendations/:user_id', getSupplementRecommendationsHandler);

// GET /supplements/current/:user_id - Get current supplement stack
router.get('/supplements/current/:user_id', getCurrentSupplementStackHandler);

export default router;
