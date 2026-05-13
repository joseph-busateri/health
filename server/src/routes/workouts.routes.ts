import { Router, Request, Response } from 'express';
import { workoutTrackingEngine } from '../services/workoutTrackingEngine';

const router = Router();

// Get all workouts for user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    const workouts = await workoutTrackingEngine.getWorkoutHistory(
      userId,
      Number(limit),
      Number(offset)
    );
    res.json({ success: true, data: workouts });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get specific workout
router.get('/:userId/:workoutId', async (req: Request, res: Response) => {
  try {
    const { workoutId } = req.params;
    const workout = await workoutTrackingEngine.getWorkoutDetails(workoutId);
    res.json({ success: true, data: workout });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Log new workout
router.post('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const workoutId = await workoutTrackingEngine.logWorkout({
      userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { workoutId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add exercise to workout
router.post('/:userId/:workoutId/exercises', async (req: Request, res: Response) => {
  try {
    const { workoutId } = req.params;
    const exerciseId = await workoutTrackingEngine.addExercise({
      workoutId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { exerciseId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add set to exercise
router.post('/:userId/:workoutId/exercises/:exerciseId/sets', async (req: Request, res: Response) => {
  try {
    const { exerciseId } = req.params;
    const setId = await workoutTrackingEngine.addSet({
      exerciseId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { setId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get workout statistics
router.get('/:userId/stats', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    const stats = await workoutTrackingEngine.getWorkoutStatistics(userId, Number(days));
    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get exercise progress
router.get('/:userId/exercises/:exerciseName/progress', async (req: Request, res: Response) => {
  try {
    const { userId, exerciseName } = req.params;
    const { months = 6 } = req.query;
    const progress = await workoutTrackingEngine.getExerciseProgress(
      userId,
      exerciseName,
      Number(months)
    );
    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
