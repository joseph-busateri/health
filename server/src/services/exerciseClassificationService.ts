import { logger } from '../utils/logger';
import type {
  ExerciseClassification,
  ExerciseClassificationInput,
  ClassifiedExercise,
  ExerciseClassificationType,
  MovementPattern,
} from '../types/exerciseClassification';

// In-memory cache for exercise classifications
const classificationCache = new Map<string, ExerciseClassification>();

// Common exercise classifications (seed data)
const COMMON_CLASSIFICATIONS: Record<string, ExerciseClassificationInput> = {
  // Compound movements
  squat: { classification: 'compound', movementPattern: 'squat', primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'] },
  'back squat': { classification: 'compound', movementPattern: 'squat', primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'] },
  'front squat': { classification: 'compound', movementPattern: 'squat', primaryMuscles: ['quadriceps', 'glutes'] },
  'leg press': { classification: 'compound', movementPattern: 'squat', primaryMuscles: ['quadriceps', 'glutes'] },
  deadlift: { classification: 'compound', movementPattern: 'hinge', primaryMuscles: ['hamstrings', 'glutes', 'lower back'] },
  'romanian deadlift': { classification: 'compound', movementPattern: 'hinge', primaryMuscles: ['hamstrings', 'glutes'] },
  'sumo deadlift': { classification: 'compound', movementPattern: 'hinge', primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'] },
  bench: { classification: 'compound', movementPattern: 'push', primaryMuscles: ['chest', 'triceps', 'shoulders'] },
  'bench press': { classification: 'compound', movementPattern: 'push', primaryMuscles: ['chest', 'triceps', 'shoulders'] },
  'incline bench': { classification: 'compound', movementPattern: 'push', primaryMuscles: ['upper chest', 'triceps', 'shoulders'] },
  'overhead press': { classification: 'compound', movementPattern: 'push', primaryMuscles: ['shoulders', 'triceps'] },
  'military press': { classification: 'compound', movementPattern: 'push', primaryMuscles: ['shoulders', 'triceps'] },
  'pull up': { classification: 'compound', movementPattern: 'pull', primaryMuscles: ['lats', 'biceps', 'upper back'] },
  'pull-up': { classification: 'compound', movementPattern: 'pull', primaryMuscles: ['lats', 'biceps', 'upper back'] },
  chinup: { classification: 'compound', movementPattern: 'pull', primaryMuscles: ['lats', 'biceps'] },
  'chin up': { classification: 'compound', movementPattern: 'pull', primaryMuscles: ['lats', 'biceps'] },
  'lat pulldown': { classification: 'compound', movementPattern: 'pull', primaryMuscles: ['lats', 'biceps'] },
  row: { classification: 'compound', movementPattern: 'pull', primaryMuscles: ['lats', 'biceps', 'upper back'] },
  'barbell row': { classification: 'compound', movementPattern: 'pull', primaryMuscles: ['lats', 'biceps', 'upper back'] },
  'dumbbell row': { classification: 'compound', movementPattern: 'pull', primaryMuscles: ['lats', 'biceps', 'upper back'] },
  lunges: { classification: 'compound', movementPattern: 'lunge', primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'] },
  lunge: { classification: 'compound', movementPattern: 'lunge', primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'] },
  'walking lunge': { classification: 'compound', movementPattern: 'lunge', primaryMuscles: ['quadriceps', 'glutes', 'hamstrings'] },
  
  // Isolation movements
  'bicep curl': { classification: 'isolation', primaryMuscles: ['biceps'] },
  'dumbbell curl': { classification: 'isolation', primaryMuscles: ['biceps'] },
  'hammer curl': { classification: 'isolation', primaryMuscles: ['brachialis', 'biceps'] },
  'tricep extension': { classification: 'isolation', primaryMuscles: ['triceps'] },
  'tricep pushdown': { classification: 'isolation', primaryMuscles: ['triceps'] },
  'skullcrushers': { classification: 'isolation', primaryMuscles: ['triceps'] },
  'lateral raise': { classification: 'isolation', primaryMuscles: ['side delts'] },
  'front raise': { classification: 'isolation', primaryMuscles: ['front delts'] },
  'rear delt fly': { classification: 'isolation', primaryMuscles: ['rear delts'] },
  'leg extension': { classification: 'isolation', primaryMuscles: ['quadriceps'] },
  'leg curl': { classification: 'isolation', primaryMuscles: ['hamstrings'] },
  'calf raise': { classification: 'isolation', primaryMuscles: ['calves'] },
  'crunch': { classification: 'isolation', primaryMuscles: ['abs'] },
  'sit up': { classification: 'isolation', primaryMuscles: ['abs'] },
  'leg raise': { classification: 'isolation', primaryMuscles: ['abs', 'hip flexors'] },
  'face pull': { classification: 'isolation', primaryMuscles: ['rear delts', 'upper back'] },
  shrug: { classification: 'isolation', primaryMuscles: ['traps'] },
  'dumbbell shrug': { classification: 'isolation', primaryMuscles: ['traps'] },
  'fly': { classification: 'isolation', primaryMuscles: ['chest'] },
  'cable fly': { classification: 'isolation', primaryMuscles: ['chest'] },
  'pec deck': { classification: 'isolation', primaryMuscles: ['chest'] },
};

/**
 * Normalize exercise name for matching
 */
const normalizeExerciseName = (name: string): string => {
  return name.toLowerCase().trim().replace(/\s+/g, ' ');
};

/**
 * Classify a single exercise based on common patterns
 */
const classifyExercise = (exerciseName: string): ExerciseClassificationInput => {
  const normalized = normalizeExerciseName(exerciseName);
  
  // Check exact match
  if (COMMON_CLASSIFICATIONS[normalized]) {
    return COMMON_CLASSIFICATIONS[normalized];
  }
  
  // Check partial match (contains key terms)
  for (const [key, classification] of Object.entries(COMMON_CLASSIFICATIONS)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return classification;
    }
  }
  
  // Default to unknown
  return { classification: 'unknown' };
};

/**
 * Get classification for an exercise
 */
export const getExerciseClassification = (exerciseName: string): ClassifiedExercise => {
  const normalized = normalizeExerciseName(exerciseName);
  
  // Check cache
  if (classificationCache.has(normalized)) {
    const cached = classificationCache.get(normalized)!;
    return {
      exerciseKey: normalized,
      exerciseName,
      classification: cached.classification,
      movementPattern: cached.movementPattern,
      isPrimaryCompound: cached.classification === 'compound' && cached.movementPattern !== undefined,
    };
  }
  
  // Classify
  const classification = classifyExercise(exerciseName);
  
  // Cache result
  const cached: ExerciseClassification = {
    id: normalized,
    exerciseName,
    classification: classification.classification || 'unknown',
    movementPattern: classification.movementPattern,
    primaryMuscles: classification.primaryMuscles,
    secondaryMuscles: classification.secondaryMuscles,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  classificationCache.set(normalized, cached);
  
  logger.info('Exercise classified', {
    exerciseName,
    classification: cached.classification,
    movementPattern: cached.movementPattern,
  });
  
  return {
    exerciseKey: normalized,
    exerciseName,
    classification: cached.classification,
    movementPattern: cached.movementPattern,
    isPrimaryCompound: cached.classification === 'compound' && cached.movementPattern !== undefined,
  };
};

/**
 * Classify multiple exercises
 */
export const classifyExercises = (exerciseNames: string[]): ClassifiedExercise[] => {
  return exerciseNames.map(name => getExerciseClassification(name));
};

/**
 * Identify primary compound exercises (first compound movement of each pattern)
 */
export const identifyPrimaryCompounds = (classifications: ClassifiedExercise[]): ClassifiedExercise[] => {
  const seenPatterns = new Set<MovementPattern>();
  const primaries: ClassifiedExercise[] = [];
  
  for (const exercise of classifications) {
    if (exercise.isPrimaryCompound && exercise.movementPattern && !seenPatterns.has(exercise.movementPattern)) {
      seenPatterns.add(exercise.movementPattern);
      primaries.push(exercise);
    }
  }
  
  return primaries;
};

/**
 * Get all cached classifications
 */
export const getAllClassifications = (): ExerciseClassification[] => {
  return Array.from(classificationCache.values());
};

/**
 * Clear classification cache
 */
export const clearClassificationCache = (): void => {
  classificationCache.clear();
  logger.info('Exercise classification cache cleared');
};
