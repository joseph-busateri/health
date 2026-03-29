import { Router, Request, Response } from 'express';
import { supplementManagementEngine } from '../services/supplementManagementEngine';

const router = Router();

// Get user's supplement regimen
router.get('/:userId/regimen', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const regimen = await supplementManagementEngine.getSupplementRegimen(userId);
    res.json({ success: true, data: regimen });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add supplement to regimen
router.post('/:userId/regimen', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const supplementId = await supplementManagementEngine.addSupplement({
      userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { supplementId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Log supplement intake
router.post('/:userId/intake', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const intakeId = await supplementManagementEngine.logIntake({
      userId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { intakeId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get adherence statistics
router.get('/:userId/adherence', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { days = 30 } = req.query;
    const adherence = await supplementManagementEngine.getAdherenceStats(userId, Number(days));
    res.json({ success: true, data: adherence });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get recommendations
router.get('/:userId/recommendations', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const recommendations = await supplementManagementEngine.getRecommendations(userId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update supplement
router.put('/:userId/regimen/:supplementId', async (req: Request, res: Response) => {
  try {
    const { supplementId } = req.params;
    await supplementManagementEngine.updateSupplement(supplementId, req.body);
    res.json({ success: true, message: 'Supplement updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Delete supplement
router.delete('/:userId/regimen/:supplementId', async (req: Request, res: Response) => {
  try {
    const { supplementId } = req.params;
    await supplementManagementEngine.deleteSupplement(supplementId);
    res.json({ success: true, message: 'Supplement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
