import { Router } from 'express';

import { getPrioritiesHandler, getPrioritizationHistoryHandler } from '../controllers/prioritizationController';

const router = Router();

// GET /priorities/:userId/today - Get today's prioritized recommendations
router.get('/priorities/:userId/today', getPrioritiesHandler);

// GET /priorities/:userId/history - Get prioritization history
router.get('/priorities/:userId/history', getPrioritizationHistoryHandler);

export default router;
