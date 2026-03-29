import { Router, Request, Response } from 'express';
import { bodyCompositionEngine } from '../services/bodyCompositionEngine';

const router = Router();

// Get body composition history
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    const scans = await bodyCompositionEngine.getBodyCompositionHistory(userId, Number(limit));
    res.json({ success: true, data: scans });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get specific scan
router.get('/:userId/:scanId', async (req: Request, res: Response) => {
  try {
    const { scanId } = req.params;
    const scan = await bodyCompositionEngine.getBodyCompositionScan(scanId);
    res.json({ success: true, data: scan });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add body composition scan
router.post('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const scanId = await bodyCompositionEngine.addBodyCompositionScan({
      userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { scanId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get body composition trends
router.get('/:userId/trends/:metric', async (req: Request, res: Response) => {
  try {
    const { userId, metric } = req.params;
    const { months = 6 } = req.query;
    const trends = await bodyCompositionEngine.getBodyCompositionTrends(
      userId,
      metric,
      Number(months)
    );
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get body composition analysis
router.get('/:userId/:scanId/analysis', async (req: Request, res: Response) => {
  try {
    const { scanId } = req.params;
    const analysis = await bodyCompositionEngine.analyzeBodyComposition(scanId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Compare scans
router.post('/:userId/compare', async (req: Request, res: Response) => {
  try {
    const { scanId1, scanId2 } = req.body;
    const comparison = await bodyCompositionEngine.compareScans(scanId1, scanId2);
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
