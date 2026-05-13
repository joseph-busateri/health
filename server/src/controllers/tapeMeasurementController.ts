import type { Request, Response, NextFunction } from 'express';

import {
  createTapeMeasurement,
  getTapeMeasurementsForUser,
  getLatestTapeMeasurement,
} from '../services/tapeMeasurementService';
import type { TapeMeasurementInput } from '../types/tapeMeasurement';

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

const toUnit = (value: unknown): 'cm' | 'in' | undefined => {
  if (typeof value !== 'string') {
    return undefined;
  }
  const normalized = value.toLowerCase();
  if (normalized === 'cm' || normalized === 'in') {
    return normalized;
  }
  return undefined;
};

const buildMeasurementInput = (req: Request, userId: string): TapeMeasurementInput => {
  return {
    userId,
    takenAt: typeof req.body?.taken_at === 'string' ? req.body.taken_at : undefined,
    unit: toUnit(req.body?.unit),
    waist: toOptionalNumber(req.body?.waist),
    chest: toOptionalNumber(req.body?.chest),
    hips: toOptionalNumber(req.body?.hips),
    neck: toOptionalNumber(req.body?.neck),
    leftArm: toOptionalNumber(req.body?.left_arm),
    rightArm: toOptionalNumber(req.body?.right_arm),
    leftThigh: toOptionalNumber(req.body?.left_thigh),
    rightThigh: toOptionalNumber(req.body?.right_thigh),
    leftCalf: toOptionalNumber(req.body?.left_calf),
    rightCalf: toOptionalNumber(req.body?.right_calf),
    notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
  };
};

const hasAtLeastOneMeasurement = (input: TapeMeasurementInput): boolean => {
  return [
    input.waist,
    input.chest,
    input.hips,
    input.neck,
    input.leftArm,
    input.rightArm,
    input.leftThigh,
    input.rightThigh,
    input.leftCalf,
    input.rightCalf,
  ].some(value => typeof value === 'number' && !Number.isNaN(value));
};

export const postTapeMeasurement = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getRequiredString(req.body?.user_id, 'user_id');
    const input = buildMeasurementInput(req, userId);

    if (!hasAtLeastOneMeasurement(input)) {
      return res.status(400).json({
        success: false,
        error: 'At least one tape measurement field is required.',
      });
    }

    const measurement = await createTapeMeasurement(input);
    res.status(201).json({ success: true, measurement });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const getTapeMeasurements = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const measurements = await getTapeMeasurementsForUser(Array.isArray(userId) ? userId[0] : userId);
    res.json({ success: true, measurements });
  } catch (error) {
    next(error);
  }
};

export const getLatestTapeMeasurementHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const measurement = await getLatestTapeMeasurement(Array.isArray(userId) ? userId[0] : userId);
    res.json({ success: true, measurement });
  } catch (error) {
    next(error);
  }
};
