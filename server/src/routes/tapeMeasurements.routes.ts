import { Router, Request, Response } from 'express';
import { tapeMeasurementsEngine } from '../services/tapeMeasurementsEngine';

const router = Router();

// Get measurement history
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 50 } = req.query;
    const measurements = await tapeMeasurementsEngine.getMeasurementHistory(userId, Number(limit));
    res.json({ success: true, data: measurements });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get specific measurement session
router.get('/:userId/:sessionId', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const session = await tapeMeasurementsEngine.getMeasurementSession(sessionId);
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add measurement session
router.post('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const sessionId = await tapeMeasurementsEngine.addMeasurementSession({
      userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { sessionId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get measurement trends
router.get('/:userId/trends/:bodyPart', async (req: Request, res: Response) => {
  try {
    const { userId, bodyPart } = req.params;
    const { months = 6 } = req.query;
    const trends = await tapeMeasurementsEngine.getMeasurementTrends(
      userId,
      bodyPart,
      Number(months)
    );
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Compare measurements
router.post('/:userId/compare', async (req: Request, res: Response) => {
  try {
    const { sessionId1, sessionId2 } = req.body;
    const comparison = await tapeMeasurementsEngine.compareMeasurements(sessionId1, sessionId2);
    res.json({ success: true, data: comparison });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get body symmetry analysis
router.get('/:userId/:sessionId/symmetry', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const symmetry = await tapeMeasurementsEngine.analyzeSymmetry(sessionId);
    res.json({ success: true, data: symmetry });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
