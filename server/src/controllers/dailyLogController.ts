import type { Request, Response, NextFunction } from 'express';

import { getDailyLogsForUser, getDashboardSummary } from '../services/structuredDailyLogService';
import { saveDailyLog } from '../services/dailyLogVectorService';
import type { DailyLogInput } from '../types/dailyLog';

type DailyLogRequestBody = {
  user_id?: unknown;
  date?: unknown;
  sleep_hours?: unknown;
  recovery_feeling?: unknown;
  stress_level?: unknown;
  workout_adherence?: unknown;
  notes?: unknown;
};

const toNumber = (value: unknown): number | null => {
  if (typeof value === 'number') {
    return Number.isNaN(value) ? null : value;
  }

  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? null : parsed;
  }

  return null;
};

const parseDailyLogInput = (body: DailyLogRequestBody): { input?: DailyLogInput; error?: string } => {
  const {
    user_id: rawUserId,
    date,
    sleep_hours: rawSleepHours,
    recovery_feeling: rawRecoveryFeeling,
    stress_level: rawStressLevel,
    workout_adherence: rawWorkoutAdherence,
    notes,
  } = body;

  if (typeof rawUserId !== 'string' || rawUserId.trim().length === 0) {
    return { error: 'user_id is required.' };
  }

  const sleepHours = toNumber(rawSleepHours);
  const recoveryFeeling = toNumber(rawRecoveryFeeling);
  const stressLevel = toNumber(rawStressLevel);
  const workoutAdherence = toNumber(rawWorkoutAdherence);

  if (sleepHours === null || recoveryFeeling === null || stressLevel === null || workoutAdherence === null) {
    return { error: 'sleep_hours, recovery_feeling, stress_level, and workout_adherence must be numbers.' };
  }

  return {
    input: {
      userId: rawUserId,
      date: typeof date === 'string' && date.length > 0 ? date : undefined,
      sleepHours,
      recoveryFeeling,
      stressLevel,
      workoutAdherence,
      notes: typeof notes === 'string' && notes.length > 0 ? notes : undefined,
    },
  };
};

export const postDailyLog = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { input, error } = parseDailyLogInput(req.body as DailyLogRequestBody);

    if (error || !input) {
      return res.status(400).json({ success: false, logSaved: false, embeddingSaved: false, warning: error });
    }

    const result = await saveDailyLog(input as DailyLogInput);
    res.status(201).json({
      success: result.logSaved,
      logSaved: result.logSaved,
      embeddingSaved: result.embeddingSaved,
      warning: result.warning,
      log: result.log,
    });
  } catch (error) {
    next(error);
  }
};

export const getDailyLogs = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const logs = await getDailyLogsForUser(Array.isArray(userId) ? userId[0] : userId, 1);
    const latestLog = logs[0] ?? null;
    res.json({ log: latestLog });
  } catch (error) {
    next(error);
  }
};

export const getDashboard = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const summary = await getDashboardSummary(Array.isArray(userId) ? userId[0] : userId);
    res.json(summary);
  } catch (error) {
    next(error);
  }
};
