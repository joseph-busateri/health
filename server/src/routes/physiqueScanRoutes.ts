import { Router } from 'express';

import {
  getLatestPhysiqueScanHandler,
  getPhysiqueScans,
  postPhysiqueScan,
} from '../controllers/physiqueScanController';

const router = Router();

router.post('/physique-scan', postPhysiqueScan);
router.get('/physique-scans/:user_id', getPhysiqueScans);
router.get('/physique-scan/latest/:user_id', getLatestPhysiqueScanHandler);

export default router;
