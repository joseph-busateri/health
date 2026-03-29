import type { Request, Response, NextFunction } from 'express';

import {
  extractNutritionFromText,
  getLatestNutritionExtraction,
  getNutritionExtractionsForUser,
} from '../services/nutritionExtractionService';

const getRequiredString = (value: unknown, field: string): string => {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${field} is required.`);
  }
  return value;
};

export const postNutritionExtraction = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = getRequiredString(req.body?.user_id, 'user_id');
    const rawText = getRequiredString(req.body?.raw_text, 'raw_text');

    const extraction = await extractNutritionFromText({
      userId,
      rawText,
      takenAt: typeof req.body?.taken_at === 'string' ? req.body.taken_at : undefined,
      mealLabel: typeof req.body?.meal_label === 'string' ? req.body.meal_label : undefined,
      notes: typeof req.body?.notes === 'string' ? req.body.notes : undefined,
    });

    res.status(201).json({ success: true, extraction });
  } catch (error) {
    if (error instanceof Error && error.message.includes('required')) {
      return res.status(400).json({ success: false, error: error.message });
    }
    next(error);
  }
};

export const getNutritionExtractions = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const extractions = await getNutritionExtractionsForUser(Array.isArray(userId) ? userId[0] : userId);
    res.json({ success: true, extractions });
  } catch (error) {
    next(error);
  }
};

export const getLatestNutritionExtractionHandler = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.params.user_id;
    if (!userId) {
      return res.status(400).json({ success: false, error: 'user_id is required' });
    }

    const extraction = await getLatestNutritionExtraction(Array.isArray(userId) ? userId[0] : userId);
    res.json({ success: true, extraction });
  } catch (error) {
    next(error);
  }
};
