import type { Request, Response, NextFunction } from 'express';

import {
  completeReminder,
  getRemindersForUser,
  seedDefaultReminders,
} from '../services/reminderService';

const getRequiredString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  return value;
};

export const getReminders = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const reminders = await getRemindersForUser(Array.isArray(userId) ? userId[0] : userId);
    res.json(reminders);
  } catch (error) {
    next(error);
  }
};

export const postCompleteReminder = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getRequiredString(req.body?.user_id, 'user_id');
    const reminderId = getRequiredString(req.body?.reminder_id, 'reminder_id');

    const reminder = await completeReminder(userId, reminderId);
    res.json({ success: true, reminder });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const postSeedDefaults = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getRequiredString(req.body?.user_id, 'user_id');

    const reminders = await seedDefaultReminders(userId);
    res.status(201).json({ success: true, ...reminders });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};
