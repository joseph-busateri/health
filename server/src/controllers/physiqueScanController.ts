import type { Request, Response, NextFunction } from 'express';

import {
  createPhysiqueScan,
  getLatestPhysiqueScan,
  getPhysiqueScansForUser,
} from '../services/physiqueScanService';

const getRequiredString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  return value;
};

export const postPhysiqueScan = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getRequiredString(req.body?.user_id, 'user_id');
    const frontPhotoUri = getRequiredString(req.body?.front_photo_uri, 'front_photo_uri');
    const sidePhotoUri = getRequiredString(req.body?.side_photo_uri, 'side_photo_uri');
    const backPhotoUri = getRequiredString(req.body?.back_photo_uri, 'back_photo_uri');

    const scan = await createPhysiqueScan({
      userId,
      frontPhotoUri,
      sidePhotoUri,
      backPhotoUri,
      takenAt: typeof req.body?.taken_at === 'string' ? req.body.taken_at : undefined,
      notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
    });

    res.status(201).json({ success: true, scan });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const getPhysiqueScans = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const scans = await getPhysiqueScansForUser(Array.isArray(userId) ? userId[0] : userId);
    res.json({ scans });
  } catch (error) {
    next(error);
  }
};

export const getLatestPhysiqueScanHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { user_id: userId } = req.params;

    if (!userId) {
      return res.status(400).json({ error: 'user_id is required' });
    }

    const scan = await getLatestPhysiqueScan(Array.isArray(userId) ? userId[0] : userId);
    res.json({ scan });
  } catch (error) {
    next(error);
  }
};
