/**
 * Phase 25: Adaptive Interview Routes
 * 
 * Purpose: API routes for adaptive interview functionality
 * Endpoints:
 * - GET /api/adaptive-interview/profile/:userId - Get user interview profile
 * - GET /api/adaptive-interview/data-gaps/:userId - Analyze data gaps
 * - GET /api/adaptive-interview/missing-categories/:userId - Get missing categories
 * - POST /api/adaptive-interview/questions/:userId - Generate adaptive questions
 * - GET /api/adaptive-interview/effectiveness/:userId - Get question effectiveness
 * - POST /api/adaptive-interview/track - Track question interaction
 * - POST /api/adaptive-interview/complete/:userId - Complete interview session
 * - GET /api/adaptive-interview/insights/:userId - Get interview insights
 */

import { Router } from 'express';
import {
  getUserProfile,
  getDataGaps,
  getMissingCategories,
  getAdaptiveQuestions,
  getEffectiveness,
  trackQuestion,
  completeInterview,
  getInsights,
} from '../controllers/adaptiveInterviewController';

const router = Router();

// User profile
router.get('/profile/:userId', getUserProfile);

// Data gaps
router.get('/data-gaps/:userId', getDataGaps);
router.get('/missing-categories/:userId', getMissingCategories);

// Adaptive questions
router.post('/questions/:userId', getAdaptiveQuestions);

// Question effectiveness
router.get('/effectiveness/:userId', getEffectiveness);
router.post('/track', trackQuestion);

// Interview session
router.post('/complete/:userId', completeInterview);

// Insights
router.get('/insights/:userId', getInsights);

export default router;
