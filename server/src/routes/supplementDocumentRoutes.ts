import { Router } from 'express';
import {
  uploadSupplementDocument,
  getSupplementBaselineHandler,
  getLatestSupplementDocumentHandler,
} from '../controllers/supplementDocumentController';

const router = Router();

// POST /supplement-document - Upload supplement document and create baseline
router.post('/supplement-document', uploadSupplementDocument);

// GET /supplement-baseline/:user_id - Get supplement baseline with items
router.get('/supplement-baseline/:user_id', getSupplementBaselineHandler);

// GET /supplement-document/:user_id/latest - Get latest supplement document
router.get('/supplement-document/:user_id/latest', getLatestSupplementDocumentHandler);

export default router;
