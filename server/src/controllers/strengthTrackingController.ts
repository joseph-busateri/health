import type { Request, Response, NextFunction } from 'express';

import {
  createStrengthSession,
  getStrengthSessionsForUser,
  getLatestStrengthSession,
} from '../services/strengthTrackingService';
import type { StrengthExerciseEntryInput, StrengthSetInput } from '../types/strengthTracking';

const getRequiredString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  return value;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }
  if (typeof value === 'string' && value.trim().length > 0) {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }
  return undefined;
};

const parseSet = (set: any): StrengthSetInput | null => {
  const reps = toOptionalNumber(set?.reps);
  if (reps == null) {
    return null;
  }

  return {
    setNumber: toOptionalNumber(set?.set_number),
    reps,
    loadKg: toOptionalNumber(set?.load_kg),
    loadLbs: toOptionalNumber(set?.load_lbs),
    rpe: toOptionalNumber(set?.rpe),
    notes: typeof set?.notes === 'string' ? set.notes : undefined,
  };
};

const parseEntry = (entry: any): StrengthExerciseEntryInput | null => {
  if (typeof entry?.exercise_name !== 'string' || entry.exercise_name.trim().length === 0) {
    return null;
  }
  if (!Array.isArray(entry?.sets) || entry.sets.length === 0) {
    return null;
  }

  const sets = entry.sets.map(parseSet).filter((set): set is StrengthSetInput => set !== null);
  if (sets.length === 0) {
    return null;
  }

  return {
    exerciseName: entry.exercise_name,
    muscleGroup: typeof entry?.muscle_group === 'string' ? entry.muscle_group : undefined,
    sets,
    notes: typeof entry?.notes === 'string' ? entry.notes : undefined,
  };
};

export const postStrengthSession = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getRequiredString(req.body?.user_id, 'user_id');

    if (!Array.isArray(req.body?.entries) || req.body.entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'entries is required and must include at least one exercise.',
      });
    }

    const entries = req.body.entries
      .map(parseEntry)
      .filter((entry): entry is StrengthExerciseEntryInput => entry !== null);

    if (entries.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No valid strength entries were provided.',
      });
    }

    const session = await createStrengthSession({
      userId,
      sessionDate: typeof req.body?.session_date === 'string' ? req.body.session_date : undefined,
      programName: typeof req.body?.program_name === 'string' ? req.body.program_name : undefined,
      notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
      entries,
    });

    res.status(201).json({ success: true, session });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const getStrengthSessions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const sessions = await getStrengthSessionsForUser(Array.isArray(userId) ? userId[0] : userId);
    res.json({ success: true, sessions });
  } catch (error) {
    next(error);
  }
};

export const getLatestStrengthSessionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const latest = await getLatestStrengthSession(Array.isArray(userId) ? userId[0] : userId);
    res.json({ success: true, session: latest });
  } catch (error) {
    next(error);
  }
};
