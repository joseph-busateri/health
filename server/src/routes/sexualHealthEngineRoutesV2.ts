import express from 'express';
import {
  getSexualHealthTodayV2Handler,
  getSexualHealthHistoryV2Handler,
} from '../controllers/sexualHealthEngineControllerV2';

const router = express.Router();

// V2 Endpoints with trend analysis
router.get('/:userId/today', getSexualHealthTodayV2Handler);
router.get('/:userId/history', getSexualHealthHistoryV2Handler);

export default router;
