import { Router } from 'express';
import { getPredictiveTodayHandler, getPredictiveHistoryHandler } from '../controllers/predictiveController';

const router = Router();

// GET /predictive/:userId/today - Get today's predictive intelligence
router.get('/predictive/:userId/today', getPredictiveTodayHandler);

// GET /predictive/:userId/history - Get predictive history
router.get('/predictive/:userId/history', getPredictiveHistoryHandler);

export default router;
