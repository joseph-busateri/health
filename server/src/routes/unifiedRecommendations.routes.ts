import { Router } from 'express';
import {
  generateUnifiedRecommendations,
  getUnifiedRecommendations,
  acceptRecommendation,
  dismissRecommendation
} from '../services/unifiedRecommendationEngine';
import type {
  GenerateRecommendationsRequest,
  GetRecommendationsRequest,
  AcceptRecommendationRequest,
  DismissRecommendationRequest
} from '../types/unifiedRecommendations';

const router = Router();

/**
 * POST /api/recommendations/generate
 * Generate unified recommendations for user
 */
router.post('/generate', async (req, res) => {
  try {
    const request: GenerateRecommendationsRequest = {
      user_id: req.body.user_id,
      force_regenerate: req.body.force_regenerate,
      use_ai_enhancement: req.body.use_ai_enhancement ?? true,
      sources: req.body.sources
    };

    const response = await generateUnifiedRecommendations(request);
    
    if (response.success) {
      res.json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/recommendations
 * Get recommendations for user
 */
router.get('/', async (req, res) => {
  try {
    const request: GetRecommendationsRequest = {
      user_id: req.query.user_id as string,
      status: req.query.status as any,
      source: req.query.source as any,
      category: req.query.category as any,
      priority: req.query.priority as any,
      timeframe: req.query.timeframe as any,
      limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
      offset: req.query.offset ? parseInt(req.query.offset as string) : undefined
    };

    const response = await getUnifiedRecommendations(request);
    
    if (response.success) {
      res.json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * GET /api/recommendations/active
 * Get active recommendations for user
 */
router.get('/active', async (req, res) => {
  try {
    const request: GetRecommendationsRequest = {
      user_id: req.query.user_id as string,
      status: 'active',
      limit: 50
    };

    const response = await getUnifiedRecommendations(request);
    
    if (response.success) {
      res.json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/recommendations/:id/accept
 * Accept a recommendation
 */
router.post('/:id/accept', async (req, res) => {
  try {
    const request: AcceptRecommendationRequest = {
      recommendation_id: req.params.id,
      user_notes: req.body.user_notes
    };

    const response = await acceptRecommendation(request);
    
    if (response.success) {
      res.json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

/**
 * POST /api/recommendations/:id/dismiss
 * Dismiss a recommendation
 */
router.post('/:id/dismiss', async (req, res) => {
  try {
    const request: DismissRecommendationRequest = {
      recommendation_id: req.params.id,
      reason: req.body.reason,
      user_notes: req.body.user_notes
    };

    const response = await dismissRecommendation(request);
    
    if (response.success) {
      res.json(response);
    } else {
      res.status(400).json(response);
    }
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router;
