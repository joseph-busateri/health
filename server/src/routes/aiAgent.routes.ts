import { Router, Request, Response } from 'express';
import { aiAgentEngine } from '../services/aiAgentEngine';

const router = Router();

// Generate personalized insights
router.post('/:userId/insights', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const insights = await aiAgentEngine.generatePersonalizedInsights(userId);
    res.json({ success: true, data: insights });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get recommendations
router.get('/:userId/recommendations', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { category } = req.query;
    const recommendations = await aiAgentEngine.getRecommendations(userId, category as string);
    res.json({ success: true, data: recommendations });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Ask AI agent a question
router.post('/:userId/ask', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { question } = req.body;
    const answer = await aiAgentEngine.askQuestion(userId, question);
    res.json({ success: true, data: { answer } });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Analyze health data
router.post('/:userId/analyze', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { dataType, timeframe } = req.body;
    const analysis = await aiAgentEngine.analyzeHealthData(userId, dataType, timeframe);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Generate workout plan
router.post('/:userId/workout-plan', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { goals, preferences } = req.body;
    const plan = await aiAgentEngine.generateWorkoutPlan(userId, goals, preferences);
    res.json({ success: true, data: plan });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Generate nutrition recommendations
router.post('/:userId/nutrition', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { goals } = req.body;
    const nutrition = await aiAgentEngine.generateNutritionRecommendations(userId, goals);
    res.json({ success: true, data: nutrition });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get daily summary
router.get('/:userId/daily-summary', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { date } = req.query;
    const summary = await aiAgentEngine.generateDailySummary(userId, date as string);
    res.json({ success: true, data: summary });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

export default router;
