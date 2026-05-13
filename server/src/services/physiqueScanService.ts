import { randomUUID } from 'crypto';

import type { PhysiqueScanInput, PhysiqueScanRecord } from '../types/physiqueScan';
import { completeReminderByType } from './reminderService';

const scansStore = new Map<string, PhysiqueScanRecord[]>();

export const createPhysiqueScan = async (input: PhysiqueScanInput): Promise<PhysiqueScanRecord> => {
  const takenAtIso = input.takenAt ? new Date(input.takenAt).toISOString() : new Date().toISOString();

  const record: PhysiqueScanRecord = {
    id: randomUUID(),
    userId: input.userId,
    takenAt: takenAtIso,
    frontPhotoUri: input.frontPhotoUri,
    sidePhotoUri: input.sidePhotoUri,
    backPhotoUri: input.backPhotoUri,
    notes: input.notes,
    status: 'pending',
    createdAt: new Date().toISOString(),
  };

  const existing = scansStore.get(input.userId) ?? [];
  scansStore.set(input.userId, [record, ...existing]);

  await completeReminderByType(input.userId, 'monthly_physique_scan');

  return record;
};

export const getPhysiqueScansForUser = async (userId: string): Promise<PhysiqueScanRecord[]> => {
  return scansStore.get(userId) ?? [];
};

export const getLatestPhysiqueScan = async (userId: string): Promise<PhysiqueScanRecord | null> => {
  const scans = scansStore.get(userId) ?? [];
  return scans.length > 0 ? scans[0] : null;
};
