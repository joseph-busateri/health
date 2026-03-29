import { Router } from 'express';

import {
  postTapeMeasurement,
  getTapeMeasurements,
  getLatestTapeMeasurementHandler,
} from '../controllers/tapeMeasurementController';

const router = Router();

router.post('/tape-measurement', postTapeMeasurement);
router.get('/tape-measurements/:user_id', getTapeMeasurements);
router.get('/tape-measurement/latest/:user_id', getLatestTapeMeasurementHandler);

export default router;
