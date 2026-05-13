import { Router } from 'express';

import {
  uploadSupplementDocumentHandler,
  uploadMiddleware,
  createSupplementStackVersionHandler,
  getCurrentSupplementStackHandler,
  logSupplementAdherenceHandler,
  getSupplementAdherenceHistoryHandler,
  calculateSupplementAdherenceHandler,
  checkSupplementInteractionsHandler,
  updateSupplementInventoryHandler,
  getReorderAlertsHandler,
} from '../controllers/supplementBaselineController';

const router = Router();

// Document upload
router.post('/supplement/upload', uploadMiddleware, uploadSupplementDocumentHandler);

// Supplement stack
router.post('/supplement/stack', createSupplementStackVersionHandler);
router.get('/supplement/stack/:user_id', getCurrentSupplementStackHandler);

// Adherence logging
router.post('/supplement/adherence', logSupplementAdherenceHandler);
router.get('/supplement/adherence/:user_id', getSupplementAdherenceHistoryHandler);
router.get('/supplement/adherence/:supplement_id/calculate', calculateSupplementAdherenceHandler);

// Interaction checking
router.post('/supplement/interactions', checkSupplementInteractionsHandler);

// Inventory management
router.post('/supplement/inventory', updateSupplementInventoryHandler);
router.get('/supplement/reorder/:user_id', getReorderAlertsHandler);

export default router;
