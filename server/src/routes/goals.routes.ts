import { Router, Request, Response } from 'express';
import { goalManagementEngine } from '../services/goalManagementEngine';

const router = Router();

// Get goal templates
router.get('/templates', async (req: Request, res: Response) => {
  try {
    const { category } = req.query;
    const templates = await goalManagementEngine.getGoalTemplates(category as string);
    res.json({ success: true, data: templates });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create goal from template
router.post('/:userId/from-template', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { templateId, customizations } = req.body;
    const goalId = await goalManagementEngine.createGoalFromTemplate(
      userId,
      templateId,
      customizations
    );
    res.status(201).json({ success: true, data: { goalId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create custom goal
router.post('/:userId/custom', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { goalData, metrics } = req.body;
    const goalId = await goalManagementEngine.createCustomGoal(
      { userId, ...goalData },
      metrics
    );
    res.status(201).json({ success: true, data: { goalId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get active goals
router.get('/:userId/active', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const goals = await goalManagementEngine.getActiveGoals(userId);
    res.json({ success: true, data: goals });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get goal details
router.get('/:userId/:goalId', async (req: Request, res: Response) => {
  try {
    const { goalId } = req.params;
    const goal = await goalManagementEngine.getGoalDetails(goalId);
    res.json({ success: true, data: goal });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Update goal metric
router.put('/:userId/:goalId/metrics/:metricId', async (req: Request, res: Response) => {
  try {
    const { metricId } = req.params;
    const { currentValue } = req.body;
    await goalManagementEngine.updateGoalMetric(metricId, currentValue);
    res.json({ success: true, message: 'Metric updated' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Record progress snapshot
router.post('/:userId/:goalId/progress', async (req: Request, res: Response) => {
  try {
    const { goalId } = req.params;
    const progressId = await goalManagementEngine.recordProgressSnapshot({
      goalId,
      ...req.body,
    });
    res.status(201).json({ success: true, data: { progressId } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Check milestones
router.post('/:userId/:goalId/check-milestones', async (req: Request, res: Response) => {
  try {
    const { goalId } = req.params;
    const achievements = await goalManagementEngine.checkMilestoneAchievements(goalId);
    res.json({ success: true, data: achievements });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Complete goal
router.post('/:userId/:goalId/complete', async (req: Request, res: Response) => {
  try {
    const { goalId } = req.params;
    await goalManagementEngine.completeGoal(goalId);
    res.json({ success: true, message: 'Goal completed' });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get recommendations
router.get('/:userId/recommendations', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const recommendations = await goalManagementEngine.generateGoalRecommendations(userId);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
