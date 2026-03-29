import { Router, Request, Response } from 'express';
import { bloodworkAnalysisEngine } from '../services/bloodworkAnalysisEngine';

const router = Router();

// Get all bloodwork results for user
router.get('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const results = await bloodworkAnalysisEngine.getBloodworkHistory(userId);
    res.json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get specific bloodwork result
router.get('/:userId/:resultId', async (req: Request, res: Response) => {
  try {
    const { userId, resultId } = req.params;
    const result = await bloodworkAnalysisEngine.getBloodworkResult(resultId);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add new bloodwork result
router.post('/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const resultId = await bloodworkAnalysisEngine.addBloodworkResult({
      userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { resultId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add biomarker to result
router.post('/:userId/:resultId/biomarkers', async (req: Request, res: Response) => {
  try {
    const { resultId } = req.params;
    const biomarkerId = await bloodworkAnalysisEngine.addBiomarker({
      bloodworkResultId: resultId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { biomarkerId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get analysis for result
router.get('/:userId/:resultId/analysis', async (req: Request, res: Response) => {
  try {
    const { resultId } = req.params;
    const analysis = await bloodworkAnalysisEngine.analyzeBloodwork(resultId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get trends for biomarker
router.get('/:userId/trends/:biomarkerName', async (req: Request, res: Response) => {
  try {
    const { userId, biomarkerName } = req.params;
    const { months = 12 } = req.query;
    const trends = await bloodworkAnalysisEngine.getBiomarkerTrends(
      userId,
      biomarkerName,
      Number(months)
    );
    res.json({ success: true, data: trends });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get health score
router.get('/:userId/health-score', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const score = await bloodworkAnalysisEngine.calculateHealthScore(userId);
    res.json({ success: true, data: score });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
