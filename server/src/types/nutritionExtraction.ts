export interface NutritionExtractRequest {
  userId: string;
  rawText: string;
  takenAt?: string;
  mealLabel?: string;
  notes?: string;
}

export interface NutritionMacros {
  calories?: number;
  proteinG?: number;
  carbsG?: number;
  fatG?: number;
  fiberG?: number;
  sugarG?: number;
  sodiumMg?: number;
}

export interface NutritionExtractionRecord {
  id: string;
  userId: string;
  takenAt: string;
  mealLabel?: string;
  rawText: string;
  foods: string[];
  macros: NutritionMacros;
  confidence: number;
  notes?: string;
  createdAt: string;
}
