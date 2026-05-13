/**
 * Phase 22: Interview Signals Routes
 * 
 * Purpose: API routes for retrieving structured interview signals
 * Endpoints:
 * - GET /api/interview-signals/:userId - Get signals by user
 * - GET /api/interview-signals/:userId/latest/:category - Get latest signal value
 * - GET /api/interview-signals/:userId/trend/:category - Get signal trend
 * - GET /api/interview-signals/:userId/patterns/:category/:subcategory - Get recurring patterns
 * - GET /api/interview-signals/session/:sessionId - Get signals by session
 * - GET /api/interview-signals/:userId/summary - Get signal summary
 */

import { Router } from 'express';
import {
  getInterviewSignals,
  getLatestSignalValue,
  getSignalTrend,
  getRecurringPatterns,
  getSignalsBySession,
  getSignalSummary,
} from '../controllers/interviewSignalsController';

const router = Router();

// Get signals by user (with optional filters)
// Query params: category, subcategory, startDate, endDate, limit
router.get('/:userId', getInterviewSignals);

// Get latest signal value for a category
// Query params: subcategory (optional)
router.get('/:userId/latest/:category', getLatestSignalValue);

// Get signal trend over time
// Query params: subcategory (optional), days (default: 30)
router.get('/:userId/trend/:category', getSignalTrend);

// Get recurring patterns (barriers, triggers, etc.)
// Query params: days (default: 90)
router.get('/:userId/patterns/:category/:subcategory', getRecurringPatterns);

// Get signals by session
router.get('/session/:sessionId', getSignalsBySession);

// Get signal summary by category
// Query params: days (default: 30)
router.get('/:userId/summary', getSignalSummary);

export default router;
