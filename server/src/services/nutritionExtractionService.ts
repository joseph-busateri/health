import { randomUUID } from 'crypto';

import type {
  NutritionExtractRequest,
  NutritionExtractionRecord,
  NutritionMacros,
} from '../types/nutritionExtraction';

const nutritionStore = new Map<string, NutritionExtractionRecord[]>();

const extractNumber = (text: string, patterns: RegExp[]): number | undefined => {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (match?.groups?.value) {
      const parsed = Number(match.groups.value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
  }
  return undefined;
};

const parseFoods = (rawText: string): string[] => {
  const normalized = rawText.replace(/\n+/g, ',').replace(/\|/g, ',');
  const chunks = normalized
    .split(',')
    .map(chunk => chunk.trim())
    .filter(Boolean);

  const filtered = chunks.filter(chunk => !/[0-9]/.test(chunk) || /serving|cup|oz|g\b|tbsp|tsp/i.test(chunk));

  return Array.from(new Set(filtered)).slice(0, 20);
};

const extractMacros = (rawText: string): NutritionMacros => {
  const text = rawText.toLowerCase();

  const calories = extractNumber(text, [
    /calories?\s*[:=-]?\s*(?<value>\d+(?:\.\d+)?)/i,
    /kcal\s*[:=-]?\s*(?<value>\d+(?:\.\d+)?)/i,
  ]);

  const proteinG = extractNumber(text, [
    /protein\s*[:=-]?\s*(?<value>\d+(?:\.\d+)?)\s*g?/i,
  ]);

  const carbsG = extractNumber(text, [
    /carbs?\s*[:=-]?\s*(?<value>\d+(?:\.\d+)?)\s*g?/i,
    /carbohydrates?\s*[:=-]?\s*(?<value>\d+(?:\.\d+)?)\s*g?/i,
  ]);

  const fatG = extractNumber(text, [
    /fat\s*[:=-]?\s*(?<value>\d+(?:\.\d+)?)\s*g?/i,
  ]);

  const fiberG = extractNumber(text, [
    /fiber\s*[:=-]?\s*(?<value>\d+(?:\.\d+)?)\s*g?/i,
  ]);

  const sugarG = extractNumber(text, [
    /sugar\s*[:=-]?\s*(?<value>\d+(?:\.\d+)?)\s*g?/i,
  ]);

  const sodiumMg = extractNumber(text, [
    /sodium\s*[:=-]?\s*(?<value>\d+(?:\.\d+)?)\s*mg?/i,
  ]);

  return {
    calories,
    proteinG,
    carbsG,
    fatG,
    fiberG,
    sugarG,
    sodiumMg,
  };
};

const estimateConfidence = (macros: NutritionMacros, foods: string[]): number => {
  const macroCount = Object.values(macros).filter(value => value != null).length;
  const foodScore = foods.length > 0 ? 0.3 : 0;
  const macroScore = Math.min(0.7, macroCount * 0.12);
  return Number(Math.min(1, foodScore + macroScore).toFixed(2));
};

export const extractNutritionFromText = async (
  request: NutritionExtractRequest
): Promise<NutritionExtractionRecord> => {
  const takenAt = request.takenAt ? new Date(request.takenAt).toISOString() : new Date().toISOString();
  const foods = parseFoods(request.rawText);
  const macros = extractMacros(request.rawText);
  const confidence = estimateConfidence(macros, foods);

  const record: NutritionExtractionRecord = {
    id: randomUUID(),
    userId: request.userId,
    takenAt,
    mealLabel: request.mealLabel,
    rawText: request.rawText,
    foods,
    macros,
    confidence,
    notes: request.notes,
    createdAt: new Date().toISOString(),
  };

  const existing = nutritionStore.get(request.userId) ?? [];
  nutritionStore.set(request.userId, [record, ...existing]);

  return record;
};

export const getNutritionExtractionsForUser = async (userId: string): Promise<NutritionExtractionRecord[]> => {
  return nutritionStore.get(userId) ?? [];
};

export const getLatestNutritionExtraction = async (userId: string): Promise<NutritionExtractionRecord | null> => {
  const records = nutritionStore.get(userId) ?? [];
  return records.length > 0 ? records[0] : null;
};
