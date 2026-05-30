import { Router } from 'express';
import { 
  setGoalsHandler, 
  getGoalsHandler, 
  getGoalDrivenTodayHandler, 
  getGoalDrivenHistoryHandler 
} from '../controllers/goalController';

const router = Router();

// POST /goals/:userId - Set user goals
router.post('/goals/:userId', setGoalsHandler);

// GET /goals/:userId - Get user goals
router.get('/goals/:userId', getGoalsHandler);

// GET /goals/:userId/today - Get today's goal-driven optimization
router.get('/goals/:userId/today', getGoalDrivenTodayHandler);

// GET /goals/:userId/history - Get goal-driven history
router.get('/goals/:userId/history', getGoalDrivenHistoryHandler);

export default router;
