import { Router, Request, Response } from 'express';
import { analyticsEngine } from '../services/analyticsEngine';

const router = Router();

// Get correlations
router.get('/:userId/correlations', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 90 } = req.query;
    const correlations = await analyticsEngine.findCorrelations(userId, Number(days));
    res.json({ success: true, data: correlations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get trend predictions
router.get('/:userId/predictions', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { metric, days = 30 } = req.query;
    const predictions = await analyticsEngine.predictTrends(userId, metric as string, Number(days));
    res.json({ success: true, data: predictions });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Generate insights
router.post('/:userId/insights', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const insights = await analyticsEngine.generateInsights(userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get goal progress analytics
router.get('/:userId/goal-progress', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const progress = await analyticsEngine.analyzeGoalProgress(userId);
    res.json({ success: true, data: progress });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get health score breakdown
router.get('/:userId/health-score', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const score = await analyticsEngine.calculateHealthScore(userId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get performance metrics
router.get('/:userId/performance', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { timeframe = '30d' } = req.query;
    const metrics = await analyticsEngine.getPerformanceMetrics(userId, timeframe as string);
    res.json({ success: true, data: metrics });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get anomaly detection
router.get('/:userId/anomalies', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    const anomalies = await analyticsEngine.detectAnomalies(userId, Number(days));
    res.json({ success: true, data: anomalies });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
