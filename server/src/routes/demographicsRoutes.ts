import { Router } from 'express';
import {
  getDemographicProfileHandler,
  updateDemographicProfileHandler,
  getValidationRulesHandler,
  getCollectionProgressHandler,
  calculateQualityScoreHandler,
  validateFieldHandler,
  getDemographicDataForEnginesHandler,
  clearCacheHandler,
} from '../controllers/demographicsController';

const router = Router();

// Get complete demographic profile
router.get('/profile/:userId', getDemographicProfileHandler);

// Update demographic profile (partial updates supported)
router.put('/profile/:userId', updateDemographicProfileHandler);

// Get validation rules for demographic fields
router.get('/validation-rules', getValidationRulesHandler);

// Get collection progress for a user
router.get('/progress/:userId', getCollectionProgressHandler);

// Calculate quality score for a user's demographic data
router.post('/quality-score/:userId', calculateQualityScoreHandler);

// Validate a specific field value
router.post('/validate/:fieldName', validateFieldHandler);

// Get demographic data formatted for engines (with fallbacks)
router.get('/engine-data/:userId', getDemographicDataForEnginesHandler);

// Clear cache (for debugging/admin)
router.delete('/cache/:userId?', clearCacheHandler);

export default router;
