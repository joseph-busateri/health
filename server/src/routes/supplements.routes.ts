import { Router, Request, Response } from 'express';
import { supplementManagementEngine } from '../services/supplementManagementEngine';
import {
  generateSupplementRecommendations,
  getCurrentSupplementStack as getEngineSupplementStack,
  getSupplementRecommendations as getEngineRecommendations,
} from '../services/supplementEngineService';

const coerceToString = (value: string | string[] | undefined): string | undefined => {
  if (typeof value === 'undefined') {
    return undefined;
  }
  return Array.isArray(value) ? value[0] : value;
};

const ensureString = (value: string | string[] | undefined, fallbackMessage: string): string => {
  const coerced = coerceToString(value);
  if (!coerced) {
    throw new Error(fallbackMessage);
  }
  return coerced;
};

const router = Router();

// Supplement engine - current stack
router.get('/current/:userId', async (req: Request, res: Response) => {
  try {
    const userId = ensureString(req.params.userId, 'Missing userId');
    const stack = await getEngineSupplementStack(userId);
    if (!stack) {
      return res.status(404).json({ success: false, error: 'No supplement stack found' });
    }
    res.json({ success: true, data: stack });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Supplement engine - generate recommendations
router.post('/recommendations/generate/:userId', async (req: Request, res: Response) => {
  try {
    const userId = ensureString(req.params.userId, 'Missing userId');
    const result = await generateSupplementRecommendations(userId, req.body);
    res.json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get user's supplement regimen
router.get('/:userId/regimen', async (req: Request, res: Response) => {
  try {
    const userId = ensureString(req.params.userId, 'Missing userId');
    const regimen = await supplementManagementEngine.getSupplementRegimen(userId);
    res.json({ success: true, data: regimen });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Add supplement to regimen
router.post('/:userId/regimen', async (req: Request, res: Response) => {
  try {
    const userId = ensureString(req.params.userId, 'Missing userId');
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
    const userId = ensureString(req.params.userId, 'Missing userId');
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
    const userId = ensureString(req.params.userId, 'Missing userId');
    const rawDays = coerceToString(req.query.days as string | string[] | undefined);
    const days = rawDays ? Number(rawDays) : 30;
    const adherence = await supplementManagementEngine.getAdherenceStats(
      userId,
      Number.isFinite(days) && days > 0 ? days : 30,
    );
    res.json({ success: true, data: adherence });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get recommendations
router.get('/:userId/recommendations', async (req: Request, res: Response) => {
  try {
    const userId = ensureString(req.params.userId, 'Missing userId');
    const recommendations = await getEngineRecommendations(userId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update supplement
router.put('/:userId/regimen/:supplementId', async (req: Request, res: Response) => {
  try {
    const supplementId = ensureString(req.params.supplementId, 'Missing supplementId');
    await supplementManagementEngine.updateSupplement(supplementId, req.body);
    res.json({ success: true, message: 'Supplement updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Delete supplement
router.delete('/:userId/regimen/:supplementId', async (req: Request, res: Response) => {
  try {
    const supplementId = ensureString(req.params.supplementId, 'Missing supplementId');
    await supplementManagementEngine.deleteSupplement(supplementId);
    res.json({ success: true, message: 'Supplement deleted' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
