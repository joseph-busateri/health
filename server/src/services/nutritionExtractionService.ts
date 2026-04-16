import { supabase } from '../config/supabase';
import type {
  NutritionExtractRequest,
  NutritionExtractionRecord,
  NutritionMacros,
} from '../types/nutritionExtraction';

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
  const timestamp = request.takenAt ? new Date(request.takenAt).toISOString() : new Date().toISOString();
  const foods = parseFoods(request.rawText);
  const macros = extractMacros(request.rawText);
  const confidence = estimateConfidence(macros, foods);

  const { data, error } = await supabase
    .from('nutrition_extractions')
    .insert({
      user_id: request.userId,
      photo_uri: request.photoUri || '',
      timestamp,
      extracted_foods: foods,
      calories: macros.calories,
      protein_g: macros.proteinG,
      carbs_g: macros.carbsG,
      fat_g: macros.fatG,
      fiber_g: macros.fiberG,
      confidence,
      extraction_status: 'completed',
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Failed to create nutrition extraction: ${error.message}`);
  }

  const record: NutritionExtractionRecord = {
    id: data.id,
    userId: data.user_id,
    takenAt: data.timestamp,
    mealLabel: request.mealLabel,
    rawText: request.rawText,
    foods: data.extracted_foods || [],
    macros: {
      calories: data.calories,
      proteinG: data.protein_g,
      carbsG: data.carbs_g,
      fatG: data.fat_g,
      fiberG: data.fiber_g,
    },
    confidence: data.confidence,
    notes: request.notes,
    createdAt: data.created_at,
  };

  return record;
};

export const getNutritionExtractionsForUser = async (userId: string): Promise<NutritionExtractionRecord[]> => {
  const { data, error } = await supabase
    .from('nutrition_extractions')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false });

  if (error) {
    throw new Error(`Failed to fetch nutrition extractions: ${error.message}`);
  }

  return (data || []).map(row => ({
    id: row.id,
    userId: row.user_id,
    takenAt: row.timestamp,
    mealLabel: undefined,
    rawText: '',
    foods: row.extracted_foods || [],
    macros: {
      calories: row.calories,
      proteinG: row.protein_g,
      carbsG: row.carbs_g,
      fatG: row.fat_g,
      fiberG: row.fiber_g,
    },
    confidence: row.confidence,
    createdAt: row.created_at,
  }));
};

export const getLatestNutritionExtraction = async (userId: string): Promise<NutritionExtractionRecord | null> => {
  const { data, error } = await supabase
    .from('nutrition_extractions')
    .select('*')
    .eq('user_id', userId)
    .order('timestamp', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw new Error(`Failed to fetch latest nutrition extraction: ${error.message}`);
  }

  if (!data) {
    return null;
  }

  return {
    id: data.id,
    userId: data.user_id,
    takenAt: data.timestamp,
    mealLabel: undefined,
    rawText: '',
    foods: data.extracted_foods || [],
    macros: {
      calories: data.calories,
      proteinG: data.protein_g,
      carbsG: data.carbs_g,
      fatG: data.fat_g,
      fiberG: data.fiber_g,
    },
    confidence: data.confidence,
    createdAt: data.created_at,
  };
};
