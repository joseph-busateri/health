import { Router } from 'express';
import {
  uploadBaselineDocument,
  getBaselineProfileByUserId,
  getLatestBaselineDocumentByUserId,
  uploadBaselineMiddleware,
} from '../controllers/baselineDocumentController';

const router = Router();

// POST /baseline-document
router.post('/baseline-document', uploadBaselineMiddleware, uploadBaselineDocument);

// GET /baseline-profile/:user_id
router.get('/baseline-profile/:userId', getBaselineProfileByUserId);

// GET /baseline-document/:user_id/latest
router.get('/baseline-document/:userId/latest', getLatestBaselineDocumentByUserId);

export default router;
