import { Router } from 'express';

import {
  finalizeInterviewHandler,
  getInterviewStateHandler,
  getNextQuestionHandler,
  startInterviewHandler,
  submitResponseHandler,
} from '../controllers/dynamicFollowUpController';

const router = Router();

router.post('/interview/start', startInterviewHandler);

router.post('/interview/:session_id/response', submitResponseHandler);

router.post('/interview/:session_id/next-question', getNextQuestionHandler);

router.post('/interview/:session_id/finalize', finalizeInterviewHandler);

router.get('/interview/:session_id/state', getInterviewStateHandler);

export default router;
