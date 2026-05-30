import { Router } from 'express';
import { logger } from '../utils/logger';
import {
  startInterview,
  submitAnswer,
  getSession,
  completeInterview,
} from '../controllers/hybridInterviewController';

const router = Router();

// DEPRECATED: Hybrid Interview mode - Use Voice Interview instead
// Routes preserved for data recovery and testing only
router.use((req, res, next) => {
  logger.warn('⚠️ [DEPRECATED] Hybrid Interview route accessed - Use Voice Interview instead', {
    path: req.path,
    method: req.method,
  });
  next();
});

router.post('/start/:user_id', startInterview);
router.post('/answer/:session_id', submitAnswer);
router.get('/session/:session_id', getSession);
router.post('/complete/:session_id', completeInterview);

export default router;
