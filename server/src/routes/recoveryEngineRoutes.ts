import { Router } from 'express';

import { getRecoveryHistoryHandler, getRecoveryTodayHandler } from '../controllers/recoveryEngineController';

const router = Router();

// GET /recovery/:user_id/today - Compute/retrieve today's recovery state
router.get('/recovery/:user_id/today', getRecoveryTodayHandler);

// GET /recovery/:user_id/history - Retrieve historical recovery records
router.get('/recovery/:user_id/history', getRecoveryHistoryHandler);

export default router;
