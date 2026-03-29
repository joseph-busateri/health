import { Router, Request, Response } from 'express';
import { strengthTrackingEngine } from '../services/strengthTrackingEngine';

const router = Router();

// Get strength history
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    const history = await strengthTrackingEngine.getStrengthHistory(userId, Number(limit));
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add 1RM test
router.post('/:userId/1rm', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const testId = await strengthTrackingEngine.add1RMTest({
      userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { testId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Calculate estimated 1RM
router.post('/:userId/calculate-1rm', async (req: Request, res: Response) => {
  try {
    const { weight, reps, formula = 'epley' } = req.body;
    const estimated1RM = await strengthTrackingEngine.calculateEstimated1RM(
      weight,
      reps,
      formula
    );
    res.json({ success: true, data: { estimated1RM } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get 1RM progress for exercise
router.get('/:userId/1rm/:exerciseName/progress', async (req: Request, res: Response) => {
  try {
    const { userId, exerciseName } = req.params;
    const { months = 12 } = req.query;
    const progress = await strengthTrackingEngine.get1RMProgress(
      userId,
      exerciseName,
      Number(months)
    );
    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add personal record
router.post('/:userId/pr', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const prId = await strengthTrackingEngine.addPersonalRecord({
      userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { prId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get all PRs
router.get('/:userId/prs', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const prs = await strengthTrackingEngine.getPersonalRecords(userId);
    res.json({ success: true, data: prs });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get strength standards comparison
router.get('/:userId/standards/:exerciseName', async (req: Request, res: Response) => {
  try {
    const { userId, exerciseName } = req.params;
    const standards = await strengthTrackingEngine.getStrengthStandards(userId, exerciseName);
    res.json({ success: true, data: standards });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
