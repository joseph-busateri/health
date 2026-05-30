import express from 'express';
import {
  getSexualHealthTodayV3Handler,
  getSexualHealthHistoryV3Handler,
} from '../controllers/sexualHealthEngineControllerV3';

const router = express.Router();

// V3 Endpoints with raw hormone values
router.get('/:userId/today', getSexualHealthTodayV3Handler);
router.get('/:userId/history', getSexualHealthHistoryV3Handler);

export default router;
