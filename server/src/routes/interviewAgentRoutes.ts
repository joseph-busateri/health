import { Router } from 'express';
import { logger } from '../utils/logger';

import {
  getTodayInterview,
  submitInterviewResponsesHandler,
  triggerDailyInterviewNotification,
} from '../controllers/interviewAgentController';

const router = Router();

// DEPRECATED: Agent Interview mode - Use Voice Interview instead
// Routes preserved for data recovery and testing only
router.use((req, res, next) => {
  logger.warn('⚠️ [DEPRECATED] Agent Interview route accessed - Use Voice Interview instead', {
    path: req.path,
    method: req.method,
  });
  next();
});

router.post('/agent/interview/notify/:user_id', triggerDailyInterviewNotification);
router.get('/agent/interview/today/:user_id', getTodayInterview);
router.post('/agent/interview/respond/:session_id', submitInterviewResponsesHandler);

export default router;
