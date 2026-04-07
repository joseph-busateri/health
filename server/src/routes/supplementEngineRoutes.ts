import { Router } from 'express';
import {
  generateSupplementRecommendationsHandler,
  getSupplementRecommendationsHandler,
  getCurrentSupplementStackHandler,
  seedSupplementBaselineHandler,
  getSupplementTodayHandler,
  getSupplementHistoryHandler,
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

// AI Enrichment Architecture Routes
// GET /supplements/:userId/today - Get today's supplement recommendation
router.get('/:userId/today', getSupplementTodayHandler);

// GET /supplements/:userId/history - Get supplement history
router.get('/:userId/history', getSupplementHistoryHandler);

export default router;
