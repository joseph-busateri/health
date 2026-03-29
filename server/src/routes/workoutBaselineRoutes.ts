import { Router } from 'express';

import {
  uploadWorkoutDocumentHandler,
  uploadMiddleware,
  createTrainingCycleHandler,
  getCurrentTrainingCycleHandler,
  createWorkoutPlanVersionHandler,
  getCurrentWorkoutPlanHandler,
  logWorkoutExecutionHandler,
  getWorkoutExecutionHistoryHandler,
} from '../controllers/workoutBaselineController';

const router = Router();

// Document upload
router.post('/workout/upload', uploadMiddleware, uploadWorkoutDocumentHandler);

// Training cycle
router.post('/workout/cycle', createTrainingCycleHandler);
router.get('/workout/cycle/:user_id', getCurrentTrainingCycleHandler);

// Workout plan
router.post('/workout/plan', createWorkoutPlanVersionHandler);
router.get('/workout/plan/:user_id', getCurrentWorkoutPlanHandler);

// Execution logging
router.post('/workout/execution', logWorkoutExecutionHandler);
router.get('/workout/execution/:user_id', getWorkoutExecutionHistoryHandler);

export default router;
