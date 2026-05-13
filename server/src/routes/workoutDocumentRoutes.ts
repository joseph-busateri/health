import { Router } from 'express';
import {
  uploadWorkoutDocument,
  seedWorkoutTodayBaselineHandler,
  getWorkoutTodayHandler,
  getWorkoutTodayHistoryHandler,
  getWorkoutBaselineHandler,
  getLatestWorkoutDocumentHandler,
  uploadWorkoutMiddleware,
} from '../controllers/workoutDocumentController';

const router = Router();

// POST /workout-document - Upload workout document
router.post('/workout-document', uploadWorkoutMiddleware, uploadWorkoutDocument);

// POST /workout/today/seed/:user_id - Seed baseline override for local/testing
router.post('/workout/today/seed/:user_id', seedWorkoutTodayBaselineHandler);

// GET /workout/today/:user_id - Generate/retrieve today's workout with adjustments
router.get('/workout/today/:user_id', getWorkoutTodayHandler);

// POST /workout/today/:user_id - Force regenerate with optional context override
router.post('/workout/today/:user_id', getWorkoutTodayHandler);

// GET /workout/today/history/:user_id - Retrieve workout adjustment history
router.get('/workout/today/history/:user_id', getWorkoutTodayHistoryHandler);

// GET /workout-baseline/:user_id - Get workout baseline for user
router.get('/workout-baseline/:userId', getWorkoutBaselineHandler);

// GET /workout-document/:user_id/latest - Get latest workout document for user
router.get('/workout-document/:userId/latest', getLatestWorkoutDocumentHandler);

export default router;
