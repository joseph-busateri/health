import { Router } from 'express';

import {
  getTodayInterview,
  submitInterviewResponsesHandler,
  triggerDailyInterviewNotification,
} from '../controllers/interviewAgentController';

const router = Router();

router.post('/agent/interview/notify/:user_id', triggerDailyInterviewNotification);
router.get('/agent/interview/today/:user_id', getTodayInterview);
router.post('/agent/interview/respond/:session_id', submitInterviewResponsesHandler);

export default router;
