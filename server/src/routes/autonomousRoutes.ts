import { Router } from 'express';
import { getAutonomousTodayHandler, getAutonomousHistoryHandler } from '../controllers/autonomousController';

const router = Router();

// GET /autonomous/:userId/today - Get today's autonomous optimization
router.get('/autonomous/:userId/today', getAutonomousTodayHandler);

// GET /autonomous/:userId/history - Get autonomous history
router.get('/autonomous/:userId/history', getAutonomousHistoryHandler);

export default router;
