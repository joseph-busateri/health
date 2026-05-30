import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { getWorkoutBaseline } from './workoutDocumentService';
import { getEngineSnapshot } from './engineStateService';
import { getCrossEngineIntelligenceToday } from './crossEngineIntelligenceService';
import { getExerciseClassification, classifyExercises, identifyPrimaryCompounds } from './exerciseClassificationService';
import { getTrainingPhase } from './trainingPhaseService';
import { generateProgressiveOverload } from './overloadPlannerService';
import type {
  WorkoutTodayIntegrated,
  WorkoutExerciseIntegrated,
  WorkoutAdjustmentApplied,
  WorkoutTodayContext,
} from '../types/workoutTodayIntegrated';
import type { WorkoutBaseline } from '../types/workoutDocument';
import type { OverloadContext, OverloadContextExercise, OverloadHistoryEntry } from '../services/overloadPlannerService';

// Feature flags
const ENABLE_AI_OVERLOAD = process.env.ENABLE_AI_OVERLOAD === 'true';
const AI_OVERLOAD_CONFIDENCE_THRESHOLD = parseFloat(process.env.AI_OVERLOAD_CONFIDENCE_THRESHOLD || '0.60');
const ENABLE_EXERCISE_CLASSIFICATION = process.env.ENABLE_EXERCISE_CLASSIFICATION === 'true';
const ENABLE_TRAINING_PHASE_LOGIC = process.env.ENABLE_TRAINING_PHASE_LOGIC === 'true';

// Default config (can be overridden per user in future)
const DEFAULT_CONFIG = {
  adherenceThreshold: 85,
  maxLoadDeltaPercent: 5.0,
  maxSetAdditions: 1,
  enableAIOverload: ENABLE_AI_OVERLOAD,
  aiConfidenceThreshold: AI_OVERLOAD_CONFIDENCE_THRESHOLD,
};

// In-memory cache
const workoutTodayV2Store = new Map<string, WorkoutTodayIntegrated[]>();

/**
 * Build workout context for AI overload planner
 */
const buildOverloadContext = (
  userId: string,
  date: string,
  exercises: WorkoutExerciseIntegrated[],
  snapshot: any,
  baseline: WorkoutBaseline,
): OverloadContext => {
  const readiness = {
    recoveryScore: snapshot?.recoveryCluster?.recoveryScore,
    stressScore: snapshot?.recoveryCluster?.stressScore,
    jointScore: snapshot?.recoveryCluster?.jointScore,
    adherenceScore: snapshot?.workout?.adherenceScore,
  };

  const overloadExercises: OverloadContextExercise[] = exercises.map(ex => ({
    key: ex.exerciseKey || ex.name.toLowerCase().replace(/\s+/g, '_'),
    name: ex.name,
    grouping: ex.movementPattern,
    setRepLoadNotes: `${ex.sets} × ${ex.reps}${ex.intensity ? ` @ ${ex.intensity}` : ''}`,
    recentAdjustments: ex.adjustmentReason,
  }));

  // Build history (empty for now - can be enhanced with actual history)
  const history: OverloadHistoryEntry[] = [];

  return {
    date,
    readiness,
    baselineDay: baseline.mondayPlan || 'unknown',
    baselinePlan: baseline.programNotes,
    exercises: overloadExercises,
    history,
    adherenceTrend: snapshot?.workout?.adherenceScore >= 80 ? 'high' : snapshot?.workout?.adherenceScore >= 65 ? 'moderate' : 'low',
    jointTrend: snapshot?.recoveryCluster?.riskLevel || 'low',
    laggingMuscleGroup: undefined, // Can be enhanced with actual data
  };
};

/**
 * Apply AI overload decision to exercises
 */
const applyAIOverloadToExercises = (
  exercises: WorkoutExerciseIntegrated[],
  decision: any,
  config: typeof DEFAULT_CONFIG,
): { exercises: WorkoutExerciseIntegrated[]; adjustments: WorkoutAdjustmentApplied[] } => {
  const adjustments: WorkoutAdjustmentApplied[] = [];
  const exerciseMap = new Map(
    exercises.map(ex => [ex.exerciseKey || ex.name.toLowerCase().replace(/\s+/g, '_'), ex])
  );

  for (const adj of decision.adjustments || []) {
    const exercise = exerciseMap.get(adj.exerciseKey);
    if (!exercise) {
      logger.warn('AI overload: exercise not found', { exerciseKey: adj.exerciseKey });
      continue;
    }

    // Validate load delta
    if (adj.loadDeltaPercent !== undefined) {
      if (Math.abs(adj.loadDeltaPercent) > config.maxLoadDeltaPercent / 100) {
        logger.warn('AI overload: load delta exceeds max', {
          exerciseKey: adj.exerciseKey,
          loadDeltaPercent: adj.loadDeltaPercent,
          max: config.maxLoadDeltaPercent / 100,
        });
        continue;
      }

      // Apply load delta (note: this is a placeholder - actual load calculation depends on how load is stored)
      exercise.originalLoad = exercise.intensity || 'unknown';
      exercise.newLoad = `${exercise.originalLoad} (${adj.loadDeltaPercent > 0 ? '+' : ''}${(adj.loadDeltaPercent * 100).toFixed(1)}%)`;
      exercise.loadDeltaPercent = adj.loadDeltaPercent * 100;
      exercise.adjustmentReason = adj.justification || `Load adjusted by ${(adj.loadDeltaPercent * 100).toFixed(1)}%`;
    }

    // Validate set addition
    if (adj.addSet) {
      exercise.originalSets = exercise.sets;
      exercise.sets = exercise.sets + 1;
      exercise.adjustmentReason = adj.justification || `Added 1 set (${exercise.originalSets} → ${exercise.sets})`;
    }

    // Validate set removal
    if (adj.removeSet && exercise.sets > 1) {
      exercise.originalSets = exercise.sets;
      exercise.sets = exercise.sets - 1;
      exercise.adjustmentReason = adj.justification || `Removed 1 set (${exercise.originalSets} → ${exercise.sets})`;
    }

    // Add cue to notes
    if (adj.cue) {
      exercise.notes = exercise.notes ? `${exercise.notes}. ${adj.cue}` : adj.cue;
    }

    // Create adjustment record
    adjustments.push({
      type: 'progressive_overload',
      change: adj.loadDeltaPercent !== undefined
        ? `Load ${adj.loadDeltaPercent > 0 ? '+' : ''}${(adj.loadDeltaPercent * 100).toFixed(1)}%`
        : adj.addSet
        ? '+1 set'
        : adj.removeSet
        ? '-1 set'
        : 'Cue added',
      reason: adj.justification || decision.summary,
      source: 'ai_overload_planner',
    });
  }

  return { exercises, adjustments };
};

/**
 * Apply exercise classifications to exercises
 */
const applyExerciseClassifications = (
  exercises: WorkoutExerciseIntegrated[],
): { exercises: WorkoutExerciseIntegrated[]; classifications: any[] } => {
  const exerciseNames = exercises.map(ex => ex.name);
  const classifications = classifyExercises(exerciseNames);

  const updatedExercises = exercises.map(ex => {
    const classification = classifications.find(
      c => c.exerciseName.toLowerCase() === ex.name.toLowerCase()
    );
    if (classification) {
      return {
        ...ex,
        exerciseKey: classification.exerciseKey,
        classification: classification.classification,
        movementPattern: classification.movementPattern,
        isPrimaryCompound: classification.isPrimaryCompound,
      };
    }
    return ex;
  });

  const classificationData = classifications.map(c => ({
    exerciseKey: c.exerciseKey,
    classification: c.classification,
    movementPattern: c.movementPattern,
  }));

  return { exercises: updatedExercises, classifications: classificationData };
};

/**
 * Get workout today V2 with enhanced overload logic
 */
export const getWorkoutTodayV2 = async (
  userId: string,
  date?: string,
  options?: { regenerate?: boolean },
): Promise<WorkoutTodayIntegrated> => {
  const targetDate = date || new Date().toISOString().slice(0, 10);

  // Check cache
  const existing = workoutTodayV2Store.get(userId)?.find(record => record.date === targetDate);
  if (existing && !options?.regenerate) {
    return existing;
  }

  logger.info('Workout Today V2: generating workout', {
    userId,
    date: targetDate,
    regenerate: options?.regenerate,
  });

  // Get baseline
  const baseline = await getWorkoutBaseline(userId);
  if (!baseline) {
    throw new Error('Workout baseline not found for user');
  }

  // Get engine snapshot
  const snapshot = await getEngineSnapshot(userId);

  // Build context
  const context: WorkoutTodayContext = {
    userId,
    date: targetDate,
    baselineWorkout: baseline,
    workoutEngineRecommendation: undefined, // Can be enhanced
    recoveryScore: snapshot?.recoveryCluster?.recoveryScore,
    stressScore: snapshot?.recoveryCluster?.stressScore,
    jointRisk: snapshot?.recoveryCluster?.riskLevel,
    adherenceScore: snapshot?.workout?.adherenceScore,
    goalAlignment: undefined, // Can be enhanced
    predictiveRisk: undefined,
  };

  // Initialize exercises from baseline
  let exercises: WorkoutExerciseIntegrated[] = (baseline.exercises || []).map(ex => ({
    name: ex.name,
    sets: 3, // Default
    reps: '8-12', // Default
    intensity: ex.setRepLoadNotes,
    rest: '90s',
    notes: '',
  }));

  let adjustments: WorkoutAdjustmentApplied[] = [];
  let workoutStatus: 'optimal' | 'moderate' | 'constrained' | 'deload' = 'moderate';

  // Determine workout status
  const recoveryScore = context.recoveryScore ?? 65;
  const stressScore = context.stressScore ?? 50;
  const jointRisk = snapshot?.recoveryCluster?.riskLevel?.toLowerCase() || 'low';

  if (recoveryScore < 50 || stressScore > 75 || jointRisk === 'high') {
    workoutStatus = 'deload';
  } else if (recoveryScore < 65 || stressScore > 60 || jointRisk === 'moderate') {
    workoutStatus = 'constrained';
  } else if (recoveryScore < 75 || stressScore > 45) {
    workoutStatus = 'moderate';
  } else {
    workoutStatus = 'optimal';
  }

  // Apply exercise classification if enabled
  let exerciseClassifications: any[] = [];
  if (ENABLE_EXERCISE_CLASSIFICATION) {
    const result = applyExerciseClassifications(exercises);
    exercises = result.exercises;
    exerciseClassifications = result.classifications;
    logger.info('Exercise classifications applied', {
      userId,
      count: exerciseClassifications.length,
    });
  }

  // Determine training phase if enabled
  let trainingPhase;
  let trainingPhaseRationale;
  if (ENABLE_TRAINING_PHASE_LOGIC) {
    const phaseDetermination = await getTrainingPhase(userId);
    trainingPhase = phaseDetermination.phase;
    trainingPhaseRationale = phaseDetermination.rationale;
    logger.info('Training phase determined', {
      userId,
      phase: trainingPhase,
      rationale: trainingPhaseRationale,
    });
  }

  // Apply overload logic
  const adherenceScore = context.adherenceScore ?? 0;
  const config = DEFAULT_CONFIG;

  if (workoutStatus === 'optimal' && adherenceScore >= config.adherenceThreshold) {
    // Try AI overload if enabled
    if (config.enableAIOverload) {
      try {
        logger.info('Attempting AI overload planner', {
          userId,
          adherenceScore,
          confidenceThreshold: config.aiConfidenceThreshold,
        });

        const overloadContext = buildOverloadContext(userId, targetDate, exercises, snapshot, baseline);
        const decision = await generateProgressiveOverload(overloadContext);

        if (decision && decision.confidence >= config.aiConfidenceThreshold) {
          logger.info('AI overload decision accepted', {
            userId,
            confidence: decision.confidence,
            adjustmentsCount: decision.adjustments.length,
          });

          const result = applyAIOverloadToExercises(exercises, decision, config);
          exercises = result.exercises;
          adjustments.push(...result.adjustments);

          // Add AI decision to response
          return createWorkoutTodayRecord(
            userId,
            targetDate,
            baseline,
            exercises,
            adjustments,
            workoutStatus,
            context,
            {
              trainingPhase,
              trainingPhaseRationale,
              aiOverloadDecision: decision,
              overloadConfig: config,
              exerciseClassifications,
            },
          );
        } else {
          logger.info('AI overload decision rejected (low confidence or null)', {
            userId,
            confidence: decision?.confidence,
            threshold: config.aiConfidenceThreshold,
          });
        }
      } catch (error) {
        logger.error('AI overload planner failed, falling back to simple overload', {
          userId,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    // Fallback to simple overload (+1 set to first compound exercise)
    if (ENABLE_EXERCISE_CLASSIFICATION) {
      const primaries = identifyPrimaryCompounds(
        exerciseClassifications.map(c => ({
          exerciseKey: c.exerciseKey,
          exerciseName: c.exerciseKey.replace(/_/g, ' '),
          classification: c.classification,
          movementPattern: c.movementPattern,
          isPrimaryCompound: c.classification === 'compound' && c.movementPattern !== undefined,
        }))
      );

      if (primaries.length > 0) {
        const primary = primaries[0];
        const exercise = exercises.find(ex =>
          ex.exerciseKey === primary.exerciseKey ||
          ex.name.toLowerCase() === primary.exerciseName.toLowerCase()
        );

        if (exercise) {
          exercise.originalSets = exercise.sets;
          exercise.sets = exercise.sets + 1;
          exercise.adjustmentReason = `Progressive overload: +1 set to primary ${primary.movementPattern} movement`;
          adjustments.push({
            type: 'progressive_overload',
            change: '+1 set',
            reason: `High adherence (${adherenceScore}) + optimal readiness - applied to primary ${primary.movementPattern} movement`,
          });
        }
      }
    } else {
      // Original simple overload (first exercise)
      if (exercises.length > 0) {
        const firstExercise = exercises[0];
        firstExercise.originalSets = firstExercise.sets;
        firstExercise.sets = firstExercise.sets + 1;
        firstExercise.adjustmentReason = 'Progressive overload: +1 set';
        adjustments.push({
          type: 'progressive_overload',
          change: '+1 set',
          reason: `High adherence (${adherenceScore}) + optimal readiness`,
        });
      }
    }
  }

  // Apply intensity cap for optimal status
  if (workoutStatus === 'optimal') {
    exercises = exercises.map(ex => ({
      ...ex,
      intensity: 'RPE 8-9',
    }));
    adjustments.push({
      type: 'intensity',
      change: 'RPE 8-9, push working sets',
      reason: 'Optimal readiness - maximize stimulus',
    });
  }

  return createWorkoutTodayRecord(
    userId,
    targetDate,
    baseline,
    exercises,
    adjustments,
    workoutStatus,
    context,
    {
      trainingPhase,
      trainingPhaseRationale,
      overloadConfig: config,
      exerciseClassifications,
    },
  );
};

/**
 * Create workout today record
 */
const createWorkoutTodayRecord = (
  userId: string,
  date: string,
  baseline: WorkoutBaseline,
  exercises: WorkoutExerciseIntegrated[],
  adjustments: WorkoutAdjustmentApplied[],
  workoutStatus: 'optimal' | 'moderate' | 'constrained' | 'deload',
  context: WorkoutTodayContext,
  enhancedFields?: {
    trainingPhase?: string;
    trainingPhaseRationale?: string;
    aiOverloadDecision?: any;
    overloadConfig?: typeof DEFAULT_CONFIG;
    exerciseClassifications?: any[];
  },
): WorkoutTodayIntegrated => {
  const record: WorkoutTodayIntegrated = {
    id: randomUUID(),
    userId,
    date,
    workoutType: baseline.programName || 'Custom',
    cycleWeek: undefined,
    cyclePhase: undefined,
    workoutStatus,
    adjustments,
    adjustmentsApplied: adjustments,
    exercises,
    summary: buildSummary(workoutStatus, adjustments.length),
    source: adjustments.length > 0 ? 'adjusted' : 'baseline',
    crossEngineInfluence: undefined, // Can be enhanced
    sourceSignals: {
      recoveryScore: context.recoveryScore,
      stressScore: context.stressScore,
      jointRisk: context.jointRisk,
      adherenceScore: context.adherenceScore,
      goalAlignment: context.goalAlignment,
      predictiveRisk: context.predictiveRisk,
    },
    trainingPhase: enhancedFields?.trainingPhase as any,
    trainingPhaseRationale: enhancedFields?.trainingPhaseRationale,
    aiOverloadDecision: enhancedFields?.aiOverloadDecision,
    overloadConfig: enhancedFields?.overloadConfig,
    exerciseClassifications: enhancedFields?.exerciseClassifications,
    createdAt: new Date().toISOString(),
  };

  // Cache record
  const history = workoutTodayV2Store.get(userId) ?? [];
  workoutTodayV2Store.set(userId, [record, ...history]);

  logger.info('Workout Today V2: record created', {
    userId,
    date,
    workoutStatus,
    adjustmentsCount: adjustments.length,
    hasAIOverload: !!enhancedFields?.aiOverloadDecision,
  });

  return record;
};

/**
 * Build summary string
 */
const buildSummary = (workoutStatus: string, adjustmentsCount: number): string => {
  if (adjustmentsCount === 0) {
    return `Workout readiness is ${workoutStatus}. No adjustments applied.`;
  }
  return `Workout readiness is ${workoutStatus}. ${adjustmentsCount} adjustment(s) applied.`;
};

/**
 * Clear cache for user
 */
export const clearWorkoutTodayV2Cache = (userId: string): void => {
  workoutTodayV2Store.delete(userId);
  logger.info('Workout Today V2: cache cleared', { userId });
};
