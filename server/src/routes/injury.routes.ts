import { Router, Request, Response } from 'express';
import { injuryPreventionEngine } from '../services/injuryPreventionEngine';

const router = Router();

// Get injury risk assessment
router.get('/:userId/risk-assessment', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const assessment = await injuryPreventionEngine.assessInjuryRisk(userId);
    res.json({ success: true, data: assessment });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Log pain entry
router.post('/:userId/pain', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const painId = await injuryPreventionEngine.logPain({
      userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { painId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get pain history
router.get('/:userId/pain', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    const history = await injuryPreventionEngine.getPainHistory(userId, Number(days));
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Log mobility assessment
router.post('/:userId/mobility', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const assessmentId = await injuryPreventionEngine.logMobilityAssessment({
      userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { assessmentId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get mobility trends
router.get('/:userId/mobility/trends', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { months = 6 } = req.query;
    const trends = await injuryPreventionEngine.getMobilityTrends(userId, Number(months));
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get preventive recommendations
router.get('/:userId/recommendations', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const recommendations = await injuryPreventionEngine.getPreventiveRecommendations(userId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Track joint health
router.get('/:userId/joint-health', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const jointHealth = await injuryPreventionEngine.trackJointHealth(userId);
    res.json({ success: true, data: jointHealth });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
