import { Router } from 'express';
import {
  startInterview,
  submitAnswer,
  getSession,
  completeInterview,
} from '../controllers/hybridInterviewController';

const router = Router();

router.post('/start/:user_id', startInterview);
router.post('/answer/:session_id', submitAnswer);
router.get('/session/:session_id', getSession);
router.post('/complete/:session_id', completeInterview);

export default router;
