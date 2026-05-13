import { Router } from 'express';
import {
  parseBloodworkDocumentController,
  getBloodworkResultsController,
  getBloodworkResultsByDocumentController,
  getBloodworkTimelineController,
  updateBloodworkResultController,
  deleteBloodworkResultsController,
} from '../controllers/bloodworkResultsController';

const router = Router();

/**
 * POST /bloodwork/parse/:document_id
 * Parse a bloodwork document and extract results
 */
router.post('/parse/:document_id', parseBloodworkDocumentController);

/**
 * GET /bloodwork/results/:user_id
 * Get all bloodwork results for a user
 */
router.get('/results/:user_id', getBloodworkResultsController);

/**
 * GET /bloodwork/results/document/:document_id
 * Get bloodwork results for a specific document
 */
router.get('/results/document/:document_id', getBloodworkResultsByDocumentController);

/**
 * GET /bloodwork/results/:user_id/timeline
 * Get bloodwork timeline for a user
 */
router.get('/results/:user_id/timeline', getBloodworkTimelineController);

/**
 * PUT /bloodwork/results/:id
 * Update a bloodwork result
 */
router.put('/results/:id', updateBloodworkResultController);

/**
 * DELETE /bloodwork/results/document/:document_id
 * Delete bloodwork results for a document
 */
router.delete('/results/document/:document_id', deleteBloodworkResultsController);

export default router;
