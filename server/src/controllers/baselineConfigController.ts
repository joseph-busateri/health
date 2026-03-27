import type { Request, Response, NextFunction } from 'express';

import { getBaselineConfig, upsertBaselineConfig } from '../services/baselineConfigService';

export const getBaseline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.user_id;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const config = await getBaselineConfig(Array.isArray(userId) ? userId[0] : userId);
    res.json({ config });
  } catch (error) {
    next(error);
  }
};

export const updateBaseline = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id: userId } = req.body ?? {};

    if (typeof userId !== 'string' || userId.trim().length === 0) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const config = await upsertBaselineConfig({
      userId,
      defaultSleepTarget: req.body?.default_sleep_target,
      stressTolerance: req.body?.stress_tolerance,
      recoverySensitivity: req.body?.recovery_sensitivity,
    });

    res.json({ success: true, config });
  } catch (error) {
    next(error);
  }
};
