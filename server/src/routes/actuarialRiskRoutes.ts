/**
 * Actuarial Risk Routes
 * REST API endpoints for actuarial risk calculation and retrieval
 * 
 * Base path: /api/actuarial-risk
 * 
 * Endpoints:
 * - POST   /:userId/calculate - Calculate actuarial risk
 * - GET    /:userId/record    - Get current/latest risk record
 * - GET    /:userId/history   - Get historical risk records
 */

import { Router } from 'express';
import {
  calculateActuarialRiskHandler,
  getActuarialRiskRecordHandler,
  getActuarialRiskHistoryHandler,
} from '../controllers/actuarialRiskController';

const router = Router();

// Calculate actuarial risk for a user
router.post('/:userId/calculate', calculateActuarialRiskHandler);

// Get current/latest actuarial risk record
router.get('/:userId/record', getActuarialRiskRecordHandler);

// Get actuarial risk history
router.get('/:userId/history', getActuarialRiskHistoryHandler);

export default router;
