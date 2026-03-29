import { Router } from 'express';

import { getJointHealthHistoryHandler, getJointHealthTodayHandler } from '../controllers/jointHealthEngineController';

const router = Router();

// GET /joint-health/:user_id/today - Compute/retrieve today's joint health record
router.get('/joint-health/:user_id/today', getJointHealthTodayHandler);

// GET /joint-health/:user_id/history - Retrieve joint health history
router.get('/joint-health/:user_id/history', getJointHealthHistoryHandler);

export default router;
