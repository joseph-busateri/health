import { Router, Request, Response } from 'express';
import { aiAgentEngine } from '../services/aiAgentEngine';

const router = Router();

// Chat with AI assistant
router.post('/:userId/chat', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { message, sessionId } = req.body;
    
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }
    
    const response = await aiAgentEngine.chat(userId, message, sessionId);
    res.json({ success: true, data: response });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get chat history
router.get('/:userId/chat/:sessionId/history', async (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    
    const history = await aiAgentEngine.getChatHistory(sessionId, limit);
    res.json({ success: true, data: history });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Get active session
router.get('/:userId/session/active', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const session = await aiAgentEngine.getActiveSession(userId);
    res.json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});

// Create new session
router.post('/:userId/session', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { sessionType, contextSnapshot } = req.body;
    
    const session = await aiAgentEngine.createChatSession(userId, sessionType, contextSnapshot);
    res.json({ success: true, data: session });
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

// Ask AI agent a question (standalone)
router.post('/:userId/ask', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { question } = req.body;
    
    if (!question) {
      return res.status(400).json({ success: false, error: 'Question is required' });
    }
    
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
    const analysis = await aiAgentEngine.analyzeHealth(userId);
    res.json({ success: true, data: analysis });
  } catch (error) {
    res.status(500).json({ success: false, error: (error as Error).message });
  }
});


export default router;
