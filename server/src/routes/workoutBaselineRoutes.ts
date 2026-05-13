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

// Test endpoint with mock data
router.get('/workout/test/:user_id', (req, res) => {
  res.json({
    success: true,
    data: {
      userId: req.params.user_id,
      planName: "4-Day Upper/Lower Split",
      currentWeek: 2,
      splitDays: [
        { dayName: "Upper A", exercises: ["Bench Press", "Rows", "Shoulder Press"] },
        { dayName: "Lower A", exercises: ["Squats", "Romanian Deadlifts", "Leg Curls"] },
        { dayName: "Upper B", exercises: ["Incline Press", "Pull-ups", "Lateral Raises"] },
        { dayName: "Lower B", exercises: ["Deadlifts", "Lunges", "Leg Extensions"] }
      ]
    }
  });
});

export default router;
