import { Router, Request, Response } from 'express';
import { recoveryOptimizationEngine } from '../services/recoveryOptimizationEngine';

const router = Router();

// Get recovery score
router.get('/:userId/score', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;
    const score = await recoveryOptimizationEngine.calculateRecoveryScore(
      userId,
      date as string
    );
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get workout readiness
router.get('/:userId/readiness', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const readiness = await recoveryOptimizationEngine.assessWorkoutReadiness(userId);
    res.json({ success: true, data: readiness });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Check deload recommendation
router.get('/:userId/deload', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const deload = await recoveryOptimizationEngine.checkDeloadRecommendation(userId);
    res.json({ success: true, data: deload });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get recovery strategies
router.get('/:userId/strategies', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const strategies = await recoveryOptimizationEngine.getRecoveryStrategies(userId);
    res.json({ success: true, data: strategies });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Log HRV measurement
router.post('/:userId/hrv', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const hrvId = await recoveryOptimizationEngine.logHRV({
      userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { hrvId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get HRV trend
router.get('/:userId/hrv/trend', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    const trend = await recoveryOptimizationEngine.getHRVTrend(userId, Number(days));
    res.json({ success: true, data: trend });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
