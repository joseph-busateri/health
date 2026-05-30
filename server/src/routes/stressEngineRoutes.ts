import { Router } from 'express';

import { getStressHistoryHandler, getStressTodayHandler } from '../controllers/stressEngineController';

const router = Router();

// GET /stress/:user_id/today - Compute/retrieve today's stress and CNS load state
router.get('/stress/:user_id/today', getStressTodayHandler);

// GET /stress/:user_id/history - Retrieve historical stress and CNS load records
router.get('/stress/:user_id/history', getStressHistoryHandler);

export default router;
