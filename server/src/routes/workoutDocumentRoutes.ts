import { Router } from 'express';
import {
  uploadWorkoutDocument,
  getWorkoutBaselineHandler,
  getLatestWorkoutDocumentHandler,
} from '../controllers/workoutDocumentController';

const router = Router();

// POST /workout-document - Upload workout document
router.post('/workout-document', uploadWorkoutDocument);

// GET /workout-baseline/:user_id - Get workout baseline for user
router.get('/workout-baseline/:userId', getWorkoutBaselineHandler);

// GET /workout-document/:user_id/latest - Get latest workout document for user
router.get('/workout-document/:userId/latest', getLatestWorkoutDocumentHandler);

export default router;
