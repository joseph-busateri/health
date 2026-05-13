import type { Request, Response, NextFunction } from 'express';

import { createMealLog, getMealLogsForUser } from '../services/mealLogService';

const getRequiredString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  return value;
};

export const postMealLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getRequiredString(req.body?.user_id, 'user_id');
    const photoUri = getRequiredString(req.body?.photo_uri, 'photo_uri');

    const mealLog = await createMealLog({
      userId,
      photoUri,
      takenAt: typeof req.body?.taken_at === 'string' ? req.body.taken_at : undefined,
      mealLabel: typeof req.body?.meal_label === 'string' ? req.body.meal_label : undefined,
      notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
    });

    res.status(201).json({ success: true, mealLog });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const getMealLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const mealLogs = await getMealLogsForUser(Array.isArray(userId) ? userId[0] : userId);
    res.json({ mealLogs });
  } catch (error) {
    next(error);
  }
};
