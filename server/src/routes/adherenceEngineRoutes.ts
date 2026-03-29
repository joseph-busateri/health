import { Router } from 'express';

import { getAdherenceHistoryHandler, getAdherenceTodayHandler } from '../controllers/adherenceEngineController';

const router = Router();

// GET /adherence/:user_id/today - Compute/retrieve today's adherence record
router.get('/adherence/:user_id/today', getAdherenceTodayHandler);

// GET /adherence/:user_id/history - Retrieve adherence history
router.get('/adherence/:user_id/history', getAdherenceHistoryHandler);

export default router;
