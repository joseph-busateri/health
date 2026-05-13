import { logger } from '../utils/logger';
import { getCurrentSupplementStack } from './supplementBaselineService';
import type { Supplement, CompleteSupplementStack } from '../types/supplementBaseline';

/**
 * Supplement Context Service
 * 
 * Purpose: Provide read-only supplement stack access for engine consumption
 * - Fetches current structured supplement stack for a user
 * - Normalizes ingredient/dose/frequency access for engines
 * - Provides safe null handling
 * - Enables ingredient-aware, dose-aware, and timing-aware reasoning
 * - Reuses existing supplementBaselineService retrieval logic
 */

export interface SupplementIngredient {
  name: string;
  dosageAmount: number;
  dosageUnit: string;
  timing: string;
  frequency: string;
  timesPerDay: number;
  goal?: string;
  reasonToTake?: string;
  brand?: string;
  form?: string;
}

export interface SupplementStackContext {
  hasSupplementStack: boolean;
  stackVersionId: string | null;
  totalSupplements: number;
  
  // Raw supplements
  supplements: Supplement[];
  
  // Ingredient-level view (flattened)
  ingredients: SupplementIngredient[];
  
  // Categorized by goal
  supplementsByGoal: Map<string, Supplement[]>;
  
  // Categorized by timing
  supplementsByTiming: Map<string, Supplement[]>;
  
  // Ingredient overlap detection
  ingredientCounts: Map<string, number>;
  potentialOverlaps: string[];
  
  // Dosage summary
  totalDailyPills: number;
  
  // Raw stack for advanced usage
  rawStack: CompleteSupplementStack | null;
}

/**
 * Get current supplement stack context for a user
 * Returns structured supplement data with ingredient-aware analysis
 * Reuses existing getCurrentSupplementStack from supplementBaselineService
 */
export async function getCurrentSupplementStackContext(userId: string): Promise<SupplementStackContext> {
  try {
    logger.info('🔵 [SUPPLEMENT CONTEXT] Fetching current supplement stack', { userId });

    // Reuse existing service method
    const stack = await getCurrentSupplementStack(userId);

    if (!stack || !stack.supplements || stack.supplements.length === 0) {
      logger.info('⚠️ [SUPPLEMENT CONTEXT] No supplement stack found', { userId });
      return createEmptySupplementStackContext();
    }

    // Build ingredient-level view
    const ingredients: SupplementIngredient[] = stack.supplements.map(supp => ({
      name: supp.supplementName,
      dosageAmount: supp.dosageAmount,
      dosageUnit: supp.dosageUnit,
      timing: supp.timing,
      frequency: supp.frequency,
      timesPerDay: supp.timesPerDay,
      goal: supp.goal,
      reasonToTake: supp.reasonToTake,
      brand: supp.brand,
      form: supp.form,
    }));

    // Categorize by goal
    const supplementsByGoal = new Map<string, Supplement[]>();
    for (const supp of stack.supplements) {
      if (supp.goal) {
        const existing = supplementsByGoal.get(supp.goal) || [];
        existing.push(supp);
        supplementsByGoal.set(supp.goal, existing);
      }
    }

    // Categorize by timing
    const supplementsByTiming = new Map<string, Supplement[]>();
    for (const supp of stack.supplements) {
      const existing = supplementsByTiming.get(supp.timing) || [];
      existing.push(supp);
      supplementsByTiming.set(supp.timing, existing);
    }

    // Detect ingredient overlaps (basic name matching)
    const ingredientCounts = new Map<string, number>();
    for (const supp of stack.supplements) {
      const normalizedName = normalizeIngredientName(supp.supplementName);
      ingredientCounts.set(normalizedName, (ingredientCounts.get(normalizedName) || 0) + 1);
    }

    // Find potential overlaps (same ingredient appearing multiple times)
    const potentialOverlaps: string[] = [];
    for (const [ingredient, count] of ingredientCounts.entries()) {
      if (count > 1) {
        potentialOverlaps.push(ingredient);
      }
    }

    // Calculate total daily pills
    const totalDailyPills = stack.supplements.reduce((sum, supp) => {
      const dailyFrequency = parseDailyFrequency(supp.frequency);
      return sum + (supp.timesPerDay * dailyFrequency);
    }, 0);

    const context: SupplementStackContext = {
      hasSupplementStack: true,
      stackVersionId: stack.version.id,
      totalSupplements: stack.supplements.length,
      supplements: stack.supplements,
      ingredients,
      supplementsByGoal,
      supplementsByTiming,
      ingredientCounts,
      potentialOverlaps,
      totalDailyPills,
      rawStack: stack,
    };

    // Log summary
    logger.info('✅ [SUPPLEMENT CONTEXT] Supplement stack loaded', {
      userId,
      totalSupplements: context.totalSupplements,
      totalDailyPills: context.totalDailyPills,
      goals: Array.from(supplementsByGoal.keys()),
      timings: Array.from(supplementsByTiming.keys()),
      potentialOverlaps: potentialOverlaps.length,
    });

    return context;
  } catch (error) {
    logger.error('❌ [SUPPLEMENT CONTEXT] Unexpected error', { userId, error });
    return createEmptySupplementStackContext();
  }
}

/**
 * Create empty supplement stack context for fallback
 */
function createEmptySupplementStackContext(): SupplementStackContext {
  return {
    hasSupplementStack: false,
    stackVersionId: null,
    totalSupplements: 0,
    supplements: [],
    ingredients: [],
    supplementsByGoal: new Map(),
    supplementsByTiming: new Map(),
    ingredientCounts: new Map(),
    potentialOverlaps: [],
    totalDailyPills: 0,
    rawStack: null,
  };
}

/**
 * Normalize ingredient name for overlap detection
 * Basic normalization - can be enhanced with ingredient database later
 */
function normalizeIngredientName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    // Remove common suffixes
    .replace(/\s+(capsule|tablet|powder|liquid|softgel|gummy)s?$/i, '')
    // Remove dosage info from name
    .replace(/\s+\d+\s*(mg|g|iu|mcg|ml)/i, '')
    // Normalize common variations
    .replace(/vitamin\s+d3?/i, 'vitamin d')
    .replace(/vitamin\s+b12/i, 'vitamin b12')
    .replace(/omega-?3/i, 'omega-3')
    .replace(/coq-?10/i, 'coq10');
}

/**
 * Parse frequency string to daily multiplier
 * Examples: "daily" = 1, "twice daily" = 2, "every other day" = 0.5
 */
function parseDailyFrequency(frequency: string): number {
  const freq = frequency.toLowerCase();
  
  if (freq.includes('twice') || freq.includes('2x')) return 2;
  if (freq.includes('3x') || freq.includes('three times')) return 3;
  if (freq.includes('4x') || freq.includes('four times')) return 4;
  if (freq.includes('every other day')) return 0.5;
  if (freq.includes('weekly') || freq.includes('once a week')) return 1/7;
  if (freq.includes('as needed') || freq.includes('prn')) return 0.5; // Estimate
  
  return 1; // Default to daily
}

/**
 * Helper: Get supplements by goal
 */
export function getSupplementsByGoal(context: SupplementStackContext, goal: string): Supplement[] {
  return context.supplementsByGoal.get(goal) || [];
}

/**
 * Helper: Get supplements by timing
 */
export function getSupplementsByTiming(context: SupplementStackContext, timing: string): Supplement[] {
  return context.supplementsByTiming.get(timing) || [];
}

/**
 * Helper: Check if ingredient is in stack
 */
export function hasIngredient(context: SupplementStackContext, ingredientName: string): boolean {
  const normalized = normalizeIngredientName(ingredientName);
  return context.ingredientCounts.has(normalized);
}

/**
 * Helper: Get ingredient count (for overlap detection)
 */
export function getIngredientCount(context: SupplementStackContext, ingredientName: string): number {
  const normalized = normalizeIngredientName(ingredientName);
  return context.ingredientCounts.get(normalized) || 0;
}

/**
 * Helper: Get dose category (conservative, non-medical)
 * Returns: 'low' | 'moderate' | 'high' | 'unknown'
 */
export function getDoseCategory(ingredient: SupplementIngredient): string {
  const name = ingredient.name.toLowerCase();
  const amount = ingredient.dosageAmount;
  const unit = ingredient.dosageUnit.toLowerCase();

  // Vitamin D (IU or mcg)
  if (name.includes('vitamin d')) {
    if (unit === 'iu') {
      if (amount < 2000) return 'low';
      if (amount < 5000) return 'moderate';
      return 'high';
    }
    if (unit === 'mcg') {
      if (amount < 50) return 'low';
      if (amount < 125) return 'moderate';
      return 'high';
    }
  }

  // Magnesium (mg)
  if (name.includes('magnesium')) {
    if (unit === 'mg') {
      if (amount < 200) return 'low';
      if (amount < 400) return 'moderate';
      return 'high';
    }
  }

  // Omega-3 / Fish Oil (mg or g)
  if (name.includes('omega') || name.includes('fish oil')) {
    if (unit === 'mg') {
      if (amount < 1000) return 'low';
      if (amount < 2000) return 'moderate';
      return 'high';
    }
    if (unit === 'g') {
      if (amount < 1) return 'low';
      if (amount < 2) return 'moderate';
      return 'high';
    }
  }

  // Creatine (g)
  if (name.includes('creatine')) {
    if (unit === 'g') {
      if (amount < 3) return 'low';
      if (amount < 5) return 'moderate';
      return 'high';
    }
  }

  // Vitamin B12 (mcg)
  if (name.includes('b12') || name.includes('b-12')) {
    if (unit === 'mcg') {
      if (amount < 500) return 'low';
      if (amount < 1000) return 'moderate';
      return 'high';
    }
  }

  return 'unknown';
}

/**
 * Helper: Format supplement for display
 */
export function formatSupplement(ingredient: SupplementIngredient): string {
  const dose = `${ingredient.dosageAmount}${ingredient.dosageUnit}`;
  const timing = ingredient.timing;
  const frequency = ingredient.frequency;
  
  return `${ingredient.name} (${dose}, ${timing}, ${frequency})`;
}

/**
 * Helper: Get goal-aligned supplements for specific health domain
 */
export function getGoalAlignedSupplements(
  context: SupplementStackContext,
  domain: 'recovery' | 'performance' | 'cardiovascular' | 'metabolic' | 'sexual_health'
): Supplement[] {
  const goalKeywords: Record<string, string[]> = {
    recovery: ['recovery', 'sleep', 'rest', 'inflammation'],
    performance: ['performance', 'energy', 'strength', 'endurance', 'pre-workout', 'post-workout'],
    cardiovascular: ['cardiovascular', 'heart', 'cardio', 'blood pressure', 'circulation'],
    metabolic: ['metabolic', 'metabolism', 'blood sugar', 'insulin', 'weight'],
    sexual_health: ['sexual', 'testosterone', 'libido', 'hormonal', 'hormone'],
  };

  const keywords = goalKeywords[domain] || [];
  
  return context.supplements.filter(supp => {
    const goal = (supp.goal || '').toLowerCase();
    const reason = (supp.reasonToTake || '').toLowerCase();
    const name = supp.supplementName.toLowerCase();
    
    return keywords.some(keyword => 
      goal.includes(keyword) || 
      reason.includes(keyword) ||
      name.includes(keyword)
    );
  });
}
