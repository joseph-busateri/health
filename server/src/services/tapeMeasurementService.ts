import { randomUUID } from 'crypto';

import type { TapeMeasurementInput, TapeMeasurementRecord } from '../types/tapeMeasurement';

const tapeMeasurementStore = new Map<string, TapeMeasurementRecord[]>();

export const createTapeMeasurement = async (input: TapeMeasurementInput): Promise<TapeMeasurementRecord> => {
  const takenAt = input.takenAt ? new Date(input.takenAt).toISOString() : new Date().toISOString();

  const record: TapeMeasurementRecord = {
    id: randomUUID(),
    userId: input.userId,
    takenAt,
    unit: input.unit || 'cm',
    waist: input.waist,
    chest: input.chest,
    hips: input.hips,
    neck: input.neck,
    leftArm: input.leftArm,
    rightArm: input.rightArm,
    leftThigh: input.leftThigh,
    rightThigh: input.rightThigh,
    leftCalf: input.leftCalf,
    rightCalf: input.rightCalf,
    notes: input.notes,
    createdAt: new Date().toISOString(),
  };

  const existing = tapeMeasurementStore.get(input.userId) ?? [];
  tapeMeasurementStore.set(input.userId, [record, ...existing]);

  return record;
};

export const getTapeMeasurementsForUser = async (userId: string): Promise<TapeMeasurementRecord[]> => {
  return tapeMeasurementStore.get(userId) ?? [];
};

export const getLatestTapeMeasurement = async (userId: string): Promise<TapeMeasurementRecord | null> => {
  const measurements = tapeMeasurementStore.get(userId) ?? [];
  return measurements.length > 0 ? measurements[0] : null;
};
