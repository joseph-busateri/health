import { Router } from 'express';
import { logger } from '../utils/logger';

import {
  finalizeInterviewHandler,
  getInterviewStateHandler,
  getNextQuestionHandler,
  startInterviewHandler,
  submitResponseHandler,
} from '../controllers/dynamicFollowUpController';

const router = Router();

// DEPRECATED: Dynamic Interview mode - Use Voice Interview instead
// Routes preserved for data recovery and testing only
router.use((req, res, next) => {
  logger.warn('⚠️ [DEPRECATED] Dynamic Interview route accessed - Use Voice Interview instead', {
    path: req.path,
    method: req.method,
  });
  next();
});

router.post('/interview/start', startInterviewHandler);

router.post('/interview/:session_id/response', submitResponseHandler);

router.post('/interview/:session_id/next-question', getNextQuestionHandler);

router.post('/interview/:session_id/finalize', finalizeInterviewHandler);

router.get('/interview/:session_id/state', getInterviewStateHandler);

export default router;
