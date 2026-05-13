import { Router } from 'express';

import type { DailyLogInput } from '../types/dailyLog';
import {
  saveDailyLog,
  getRecentLogs,
  similaritySearch,
} from '../services/dailyLogVectorService';

const router = Router();

router.post('/', async (req, res, next) => {
  try {
    const payload: DailyLogInput = req.body;
    const result = await saveDailyLog(payload);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/:userId/recent', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(String(req.query.limit ?? '7'), 10);
    const records = await getRecentLogs(userId, Number.isNaN(limit) ? 7 : limit);
    res.json(records);
  } catch (error) {
    next(error);
  }
});

router.post('/:userId/search', async (req, res, next) => {
  try {
    const { userId } = req.params;
    const { query, limit, similarityThreshold } = req.body as {
      query: string;
      limit?: number;
      similarityThreshold?: number;
    };

    if (!query) {
      return res.status(400).json({ error: 'Query text is required.' });
    }

    const results = await similaritySearch(query, userId, limit, similarityThreshold);
    res.json(results);
  } catch (error) {
    next(error);
  }
});

export default router;
