import { Router } from 'express';
import {
  uploadBloodworkDocumentController,
  getBloodworkDocumentsController,
  getBloodworkDocumentController,
  updateBloodworkDocumentController,
  deleteBloodworkDocumentController,
  getBloodworkTimelineController,
  getBloodworkStatsController,
  updateBloodworkParseStatusController,
  getBloodworkDocumentStatusController,
  retryBloodworkProcessingController,
  uploadBloodworkMiddleware,
} from '../controllers/bloodworkController';

const router = Router();

/**
 * POST /bloodwork/upload
 * Upload a bloodwork document
 */
router.post('/upload', uploadBloodworkMiddleware, uploadBloodworkDocumentController);

/**
 * GET /bloodwork/documents/:user_id
 * Get all bloodwork documents for a user
 */
router.get('/documents/:user_id', getBloodworkDocumentsController);

/**
 * GET /bloodwork/document/:id
 * Get a specific bloodwork document
 */
router.get('/document/:id', getBloodworkDocumentController);

/**
 * GET /bloodwork/document/:id/status
 * Get processing status for a bloodwork document
 */
router.get('/document/:id/status', getBloodworkDocumentStatusController);

/**
 * PUT /bloodwork/document/:id
 * Update a bloodwork document
 */
router.put('/document/:id', updateBloodworkDocumentController);

/**
 * DELETE /bloodwork/document/:id
 * Delete a bloodwork document
 */
router.delete('/document/:id', deleteBloodworkDocumentController);

/**
 * GET /bloodwork/timeline/:user_id
 * Get bloodwork timeline for a user
 */
router.get('/timeline/:user_id', getBloodworkTimelineController);

/**
 * GET /bloodwork/stats/:user_id
 * Get bloodwork statistics for a user
 */
router.get('/stats/:user_id', getBloodworkStatsController);

/**
 * PUT /bloodwork/document/:id/parse-status
 * Update bloodwork document parse status
 */
router.put('/document/:id/parse-status', updateBloodworkParseStatusController);

/**
 * POST /bloodwork/document/:id/retry
 * Retry bloodwork processing pipeline
 */
router.post('/document/:id/retry', retryBloodworkProcessingController);

export default router;
