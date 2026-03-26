import { Router } from 'express';

import {
  postDailyLog,
  getDailyLogs,
  getDashboard,
} from '../controllers/dailyLogController';

const router = Router();

router.post('/daily-log', postDailyLog);
router.get('/daily-log/:user_id', getDailyLogs);
router.get('/dashboard/:user_id', getDashboard);

export default router;
