import { randomUUID } from 'crypto';

import { getWorkoutBaseline } from './workoutDocumentService';
import { getWorkoutRecommendationToday } from './workoutEngineService';
import { getCrossEngineIntelligenceToday } from './crossEngineIntelligenceService';
import { getEngineSnapshot } from './engineStateService';
import { getGoalOptimizationRecommendations } from './goalDrivenOptimizationService';
import { createChangeEvent } from './pointInTimeService';
import { logger } from '../utils/logger';
import type {
  WorkoutTodayIntegrated,
  WorkoutExerciseIntegrated,
  WorkoutAdjustmentApplied,
  WorkoutCrossEngineInfluence,
  WorkoutTodayContext,
  CyclePhase,
  WorkoutSource,
} from '../types/workoutTodayIntegrated';
import type { WorkoutBaseline, WorkoutExercise } from '../types/workoutDocument';

const workoutTodayStore = new Map<string, WorkoutTodayIntegrated[]>();

function getDayOfWeek(): string {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days[new Date().getDay()];
}

function getBaselineExercisesForDay(baseline: WorkoutBaseline, day: string): WorkoutExercise[] {
  const dayPrefix = day.slice(0, 3).toLowerCase();
  const exercises = baseline.exercises ?? [];
  const filtered = exercises.filter(exercise => 
    exercise.dayAssociation.toLowerCase().includes(dayPrefix)
  );
  return filtered.length > 0 ? filtered : exercises;
}

function getDayPlan(baseline: WorkoutBaseline, day: string): string {
  const mapping: Record<string, string | undefined> = {
    monday: baseline.mondayPlan,
    tuesday: baseline.tuesdayPlan,
    wednesday: baseline.wednesdayPlan,
    thursday: baseline.thursdayPlan,
    friday: baseline.fridayPlan,
    saturday: baseline.saturdayPlan,
    sunday: baseline.sundayPlan,
  };
  return mapping[day] || 'Rest Day';
}

function parseSetReps(exercise: WorkoutExercise): { sets: number; reps: string } {
  const notes = exercise.setRepLoadNotes || '';
  const setsMatch = notes.match(/(\d+)\s*(?:sets?|x)/i);
  const repsMatch = notes.match(/(\d+(?:-\d+)?)\s*(?:reps?)/i);
  
  return {
    sets: setsMatch ? parseInt(setsMatch[1]) : 3,
    reps: repsMatch ? repsMatch[1] : '8-12',
  };
}

function applyVolumeReduction(
  exercises: WorkoutExerciseIntegrated[],
  reductionPercent: number,
  reason: string,
): { exercises: WorkoutExerciseIntegrated[]; adjustment: WorkoutAdjustmentApplied } {
  const adjustedExercises = exercises.map(exercise => {
    const originalSets = exercise.originalSets || exercise.sets;
    const reducedSets = Math.max(1, Math.round(originalSets * (1 - reductionPercent / 100)));
    
    return {
      ...exercise,
      sets: reducedSets,
      originalSets,
      adjustmentReason: `Volume reduced by ${reductionPercent}% (${originalSets} → ${reducedSets} sets)`,
    };
  });

  return {
    exercises: adjustedExercises,
    adjustment: {
      type: 'volume',
      description: `Reduced volume by ${reductionPercent}%`,
      reason,
    },
  };
}

function applyIntensityCap(
  exercises: WorkoutExerciseIntegrated[],
  intensityCap: string,
  reason: string,
): { exercises: WorkoutExerciseIntegrated[]; adjustment: WorkoutAdjustmentApplied } {
  const adjustedExercises = exercises.map(exercise => ({
    ...exercise,
    intensity: intensityCap,
    notes: exercise.notes 
      ? `${exercise.notes}. ${intensityCap}`
      : intensityCap,
  }));

  return {
    exercises: adjustedExercises,
    adjustment: {
      type: 'intensity',
      description: `Intensity capped at ${intensityCap}`,
      reason,
    },
  };
}

function applyExerciseSubstitutions(
  exercises: WorkoutExerciseIntegrated[],
  jointRisk: string,
  reason: string,
): { exercises: WorkoutExerciseIntegrated[]; adjustments: WorkoutAdjustmentApplied[] } {
  const adjustments: WorkoutAdjustmentApplied[] = [];
  const adjustedExercises = exercises.map(exercise => {
    const lower = exercise.name.toLowerCase();
    
    if (lower.includes('squat') && !lower.includes('goblet') && !lower.includes('machine')) {
      adjustments.push({
        type: 'substitution',
        description: `${exercise.name} → Goblet Squat or Machine Squat`,
        reason: `Joint risk (${jointRisk}) - safer squat variation`,
      });
      return {
        ...exercise,
        substitution: 'Goblet Squat or Machine Squat',
        notes: exercise.notes 
          ? `${exercise.notes}. Use joint-friendly variation`
          : 'Use joint-friendly variation',
      };
    }
    
    if (lower.includes('deadlift') && !lower.includes('rdl') && !lower.includes('trap bar')) {
      adjustments.push({
        type: 'substitution',
        description: `${exercise.name} → RDL or Trap Bar Deadlift`,
        reason: `Joint risk (${jointRisk}) - safer deadlift variation`,
      });
      return {
        ...exercise,
        substitution: 'RDL or Trap Bar Deadlift',
        notes: exercise.notes 
          ? `${exercise.notes}. Use joint-friendly variation`
          : 'Use joint-friendly variation',
      };
    }
    
    if (lower.includes('press') && lower.includes('overhead')) {
      adjustments.push({
        type: 'substitution',
        description: `${exercise.name} → Neutral-Grip Press or Machine Press`,
        reason: `Joint risk (${jointRisk}) - safer pressing variation`,
      });
      return {
        ...exercise,
        substitution: 'Neutral-Grip Press or Machine Press',
        notes: exercise.notes 
          ? `${exercise.notes}. Use neutral-grip or machine variation`
          : 'Use neutral-grip or machine variation',
      };
    }
    
    return exercise;
  });

  return { exercises: adjustedExercises, adjustments };
}

function applyRestPeriodAdjustment(
  exercises: WorkoutExerciseIntegrated[],
  restPeriod: string,
  reason: string,
): { exercises: WorkoutExerciseIntegrated[]; adjustment: WorkoutAdjustmentApplied } {
  const adjustedExercises = exercises.map(exercise => ({
    ...exercise,
    rest: restPeriod,
  }));

  return {
    exercises: adjustedExercises,
    adjustment: {
      type: 'rest',
      description: `Rest periods set to ${restPeriod}`,
      reason,
    },
  };
}

function applyProgressiveOverload(
  exercises: WorkoutExerciseIntegrated[],
  adherenceScore: number,
  reason: string,
): { exercises: WorkoutExerciseIntegrated[]; adjustment: WorkoutAdjustmentApplied } {
  const adjustedExercises = exercises.map((exercise, index) => {
    if (index === 0) {
      const originalSets = exercise.originalSets || exercise.sets;
      const newSets = originalSets + 1;
      
      return {
        ...exercise,
        sets: newSets,
        originalSets,
        notes: exercise.notes 
          ? `${exercise.notes}. Progressive overload: +1 set`
          : 'Progressive overload: +1 set',
        adjustmentReason: `Progressive overload applied (${originalSets} → ${newSets} sets)`,
      };
    }
    return exercise;
  });

  return {
    exercises: adjustedExercises,
    adjustment: {
      type: 'progressive_overload',
      description: 'Added 1 set to primary movement',
      reason,
    },
  };
}

function simplifyWorkoutForLowAdherence(
  exercises: WorkoutExerciseIntegrated[],
  adherenceScore: number,
): { exercises: WorkoutExerciseIntegrated[]; adjustment: WorkoutAdjustmentApplied } {
  const primaryExercises = exercises.slice(0, Math.max(2, Math.ceil(exercises.length * 0.6)));
  
  return {
    exercises: primaryExercises,
    adjustment: {
      type: 'volume',
      description: `Simplified workout to ${primaryExercises.length} exercises`,
      reason: `Low adherence (${adherenceScore}) - reduced complexity to improve consistency`,
    },
  };
}

function applyWorkoutAdjustments(
  baselineExercises: WorkoutExercise[],
  context: WorkoutTodayContext,
  workoutStatus: 'optimal' | 'moderate' | 'constrained' | 'deload',
): { exercises: WorkoutExerciseIntegrated[]; adjustments: WorkoutAdjustmentApplied[] } {
  let exercises: WorkoutExerciseIntegrated[] = baselineExercises.map(exercise => {
    const { sets, reps } = parseSetReps(exercise);
    return {
      name: exercise.name,
      sets,
      reps,
      intensity: undefined,
      rest: '2-3 minutes',
      substitution: undefined,
      notes: exercise.setRepLoadNotes,
      originalSets: sets,
      originalReps: reps,
    };
  });

  const adjustments: WorkoutAdjustmentApplied[] = [];

  logger.info('🔵 [WORKOUT TODAY] Applying adjustments', {
    userId: context.userId,
    workoutStatus,
    exerciseCount: exercises.length,
  });

  if (workoutStatus === 'deload') {
    const volumeResult = applyVolumeReduction(
      exercises,
      35,
      `Deload protocol - recovery (${context.recoveryScore}), stress (${context.stressScore})`,
    );
    exercises = volumeResult.exercises;
    adjustments.push(volumeResult.adjustment);

    const intensityResult = applyIntensityCap(
      exercises,
      'RPE 5-6, focus on form',
      'Deload protocol - minimize fatigue',
    );
    exercises = intensityResult.exercises;
    adjustments.push(intensityResult.adjustment);

    const restResult = applyRestPeriodAdjustment(
      exercises,
      '3-4 minutes',
      'Deload protocol - maximize recovery',
    );
    exercises = restResult.exercises;
    adjustments.push(restResult.adjustment);
  } else if (workoutStatus === 'constrained') {
    const volumeResult = applyVolumeReduction(
      exercises,
      22,
      `Constrained capacity - recovery (${context.recoveryScore}), stress (${context.stressScore})`,
    );
    exercises = volumeResult.exercises;
    adjustments.push(volumeResult.adjustment);

    const intensityResult = applyIntensityCap(
      exercises,
      'RPE 7-8, cap intensity at 75-80%',
      'Constrained capacity - protect recovery',
    );
    exercises = intensityResult.exercises;
    adjustments.push(intensityResult.adjustment);
  } else if (workoutStatus === 'moderate') {
    const intensityResult = applyIntensityCap(
      exercises,
      'RPE 7-8, leave 2-3 reps in reserve',
      `Moderate readiness - recovery (${context.recoveryScore})`,
    );
    exercises = intensityResult.exercises;
    adjustments.push(intensityResult.adjustment);
  } else if (workoutStatus === 'optimal') {
    if ((context.adherenceScore ?? 0) >= 85) {
      const overloadResult = applyProgressiveOverload(
        exercises,
        context.adherenceScore!,
        `High adherence (${context.adherenceScore}) + optimal readiness`,
      );
      exercises = overloadResult.exercises;
      adjustments.push(overloadResult.adjustment);
    }

    const intensityResult = applyIntensityCap(
      exercises,
      'RPE 8-9, push working sets',
      'Optimal readiness - maximize stimulus',
    );
    exercises = intensityResult.exercises;
    adjustments.push(intensityResult.adjustment);
  }

  if (context.jointRisk && (context.jointRisk === 'moderate' || context.jointRisk === 'high')) {
    const substitutionResult = applyExerciseSubstitutions(
      exercises,
      context.jointRisk,
      `Joint risk detected (${context.jointRisk})`,
    );
    exercises = substitutionResult.exercises;
    adjustments.push(...substitutionResult.adjustments);
  }

  if ((context.adherenceScore ?? 100) < 60 && workoutStatus !== 'deload') {
    const simplifyResult = simplifyWorkoutForLowAdherence(exercises, context.adherenceScore!);
    exercises = simplifyResult.exercises;
    adjustments.push(simplifyResult.adjustment);
  }

  logger.info('✅ [WORKOUT TODAY] Adjustments applied', {
    userId: context.userId,
    adjustmentCount: adjustments.length,
    finalExerciseCount: exercises.length,
  });

  return { exercises, adjustments };
}

export async function getWorkoutTodayIntegrated(
  userId: string,
  options?: { regenerate?: boolean },
): Promise<WorkoutTodayIntegrated> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = workoutTodayStore.get(userId)?.find(record => record.date === date);
  
  if (existing && !options?.regenerate) {
    logger.info('📋 [WORKOUT TODAY] Returning cached workout', { userId, date });
    return existing;
  }

  logger.info('🔵 [WORKOUT TODAY] Generating integrated workout', { userId, date });

  const baseline = await getWorkoutBaseline(userId);
  if (!baseline) {
    throw new Error('Workout baseline not found. Please upload a workout plan first.');
  }

  const snapshot = await getEngineSnapshot(userId);
  const workoutEngineRec = await getWorkoutRecommendationToday(userId, { regenerate: true });

  const context: WorkoutTodayContext = {
    userId,
    date,
    baselineWorkout: baseline,
    workoutEngineRecommendation: workoutEngineRec,
    recoveryScore: snapshot.recoveryCluster?.recoveryScore,
    stressScore: snapshot.recoveryCluster?.stressScore,
    jointRisk: snapshot.recoveryCluster?.jointRiskLevel,
    adherenceScore: snapshot.workout?.adherenceScore,
    goalAlignment: snapshot.goals?.goalAlignment,
    predictiveRisk: snapshot.predictive?.riskLevel,
  };

  const day = getDayOfWeek();
  const workoutType = getDayPlan(baseline, day);
  const baselineExercises = getBaselineExercisesForDay(baseline, day);

  logger.info('📋 [WORKOUT TODAY] Baseline loaded', {
    userId,
    day,
    workoutType,
    exerciseCount: baselineExercises.length,
  });

  const workoutStatus = workoutEngineRec.workoutStatus;
  const { exercises, adjustments } = applyWorkoutAdjustments(
    baselineExercises,
    context,
    workoutStatus,
  );

  const summary = workoutEngineRec.recommendation.summary;
  const source: WorkoutSource = adjustments.length > 0 ? 'ai_optimized' : 'baseline';

  // Load cross-engine intelligence for transparency
  let crossEngineInfluence: WorkoutCrossEngineInfluence | undefined;
  try {
    const crossEngine = await getCrossEngineIntelligenceToday(userId);
    if (crossEngine) {
      const uniqueEngines = new Set<string>();
      crossEngine.patterns?.forEach(p => {
        p.sourceEngines?.forEach(e => uniqueEngines.add(e));
      });

      crossEngineInfluence = {
        applied: true,
        overallStatus: crossEngine.overallStatus,
        influencingEngines: Array.from(uniqueEngines),
        patterns: crossEngine.patterns?.slice(0, 3).map(p => ({
          name: p.name,
          severity: p.severity,
          summary: p.summary,
        })),
        summary: crossEngine.recommendation?.summary,
      };

      logger.info('✅ [WORKOUT TODAY] Cross-engine influence loaded', {
        userId,
        overallStatus: crossEngine.overallStatus,
        patternCount: crossEngine.patterns?.length || 0,
      });
    }
  } catch (error) {
    logger.warn('⚠️ [WORKOUT TODAY] Cross-engine intelligence unavailable', {
      userId,
      error: (error as Error).message,
    });
  }

  // Build adjustmentsApplied with enhanced transparency
  const adjustmentsApplied: WorkoutAdjustmentApplied[] = adjustments.map(adj => ({
    type: adj.type,
    change: adj.description,
    reason: adj.reason,
    source: context.recoveryScore !== undefined ? 'Recovery Engine' : 'Workout Engine',
  }));

  const record: WorkoutTodayIntegrated = {
    id: randomUUID(),
    userId,
    date,
    workoutType,
    cycleWeek: undefined,
    cyclePhase: undefined,
    workoutStatus,
    adjustments,
    adjustmentsApplied,
    exercises,
    summary,
    source,
    crossEngineInfluence,
    sourceSignals: {
      recoveryScore: context.recoveryScore,
      stressScore: context.stressScore,
      jointRisk: context.jointRisk,
      adherenceScore: context.adherenceScore,
      goalAlignment: context.goalAlignment,
      predictiveRisk: context.predictiveRisk,
    },
    createdAt: new Date().toISOString(),
  };

  const history = workoutTodayStore.get(userId) ?? [];
  workoutTodayStore.set(userId, [record, ...history]);

  logger.info('✅ [WORKOUT TODAY] Integrated workout generated', {
    userId,
    workoutStatus,
    adjustmentCount: adjustments.length,
    exerciseCount: exercises.length,
    source,
  });

  await createChangeEvent({
    user_id: userId,
    entity_type: 'workout_today',
    entity_id: record.id,
    field_name: 'workout_status',
    new_value: workoutStatus,
    change_source: 'integrated_workout_engine',
    rationale: `Generated today's workout with ${adjustments.length} adjustments`,
    confidence: 0.95,
  }).catch(() => undefined);

  return record;
}

export async function getWorkoutTodayHistory(userId: string): Promise<WorkoutTodayIntegrated[]> {
  return workoutTodayStore.get(userId) ?? [];
}
