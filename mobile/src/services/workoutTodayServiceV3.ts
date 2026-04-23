import api from './api';
import { getWorkoutTodayV2 } from './workoutTodayServiceV2';
import type { WorkoutTodayRecord } from '../types/workoutToday';
import type { WorkoutTodayIntegratedV3, OverloadCompletionRecord, OverloadCompletionStats } from '../types/workoutTodayV3';

// Feature flag for V3 enhanced features
const USE_ENHANCED_OVERLOAD = process.env.EXPO_PUBLIC_USE_ENHANCED_OVERLOAD === 'true';

/**
 * Get workout today V3 with enhanced overload features
 */
export const getWorkoutTodayV3 = async (
  userId: string,
  options?: { regenerate?: boolean },
): Promise<WorkoutTodayRecord> => {
  // If enhanced features not enabled, fall back to V2
  if (!USE_ENHANCED_OVERLOAD) {
    return getWorkoutTodayV2(userId, options);
  }

  try {
    const response = await api.get<{ data: WorkoutTodayIntegratedV3 }>(
      `/workout-today-v2/${userId}/today${options?.regenerate ? '?regenerate=true' : ''}`
    );
    const integrated = response.data.data;
    return transformV3ToBasic(integrated);
  } catch (error) {
    console.warn('V3 service failed, falling back to V2', error);
    return getWorkoutTodayV2(userId, options);
  }
};

/**
 * Transform V3 integrated response to basic format
 */
const transformV3ToBasic = (integrated: WorkoutTodayIntegratedV3): WorkoutTodayRecord => {
  // Transform exercises
  const exercises = integrated.exercises.map(ex => ({
    name: ex.name,
    sets: ex.sets,
    reps: ex.reps,
    intensity: ex.intensity,
    rest: ex.rest,
    notes: buildExerciseNotes(ex),
    setRepLoadNotes: `${ex.sets} × ${ex.reps}${ex.intensity ? ` @ ${ex.intensity}` : ''}`,
  }));

  // Transform adjustments
  const adjustments = (integrated.adjustments || []).map(adj => ({
    code: adj.type,
    description: adj.change,
    rationale: adj.reason,
  }));

  // Map workout status to readiness status
  const readinessStatus = mapWorkoutStatusToReadiness(integrated.workoutStatus);

  return {
    id: integrated.id,
    userId: integrated.userId,
    date: integrated.date,
    workoutPlan: {
      dayPlan: buildDayPlan(integrated),
      exercises,
      notes: buildWorkoutNotes(integrated),
    },
    readinessStatus,
    rationale: buildRationale(integrated),
    adjustments,
    baselineSnapshot: {
      id: integrated.id,
      userId: integrated.userId,
      documentId: integrated.id,
      programName: integrated.workoutType,
      splitName: integrated.cyclePhase || '',
      mondayPlan: '',
      tuesdayPlan: '',
      wednesdayPlan: '',
      thursdayPlan: '',
      fridayPlan: '',
      saturdayPlan: '',
      sundayPlan: '',
      exercises: exercises.map(ex => ({
        name: ex.name,
        dayAssociation: '',
        setRepLoadNotes: ex.setRepLoadNotes,
      })),
      extractedAt: integrated.createdAt,
      createdAt: integrated.createdAt,
      updatedAt: integrated.createdAt,
    },
    createdAt: integrated.createdAt,
  };
};

/**
 * Build exercise notes with enhanced information
 */
const buildExerciseNotes = (exercise: any): string[] => {
  const notes: string[] = [];

  if (exercise.notes) {
    notes.push(exercise.notes);
  }

  if (exercise.adjustmentReason) {
    notes.push(exercise.adjustmentReason);
  }

  if (exercise.classification) {
    const classLabel = exercise.classification === 'compound' ? '🏋️ Compound' : '💪 Isolation';
    if (exercise.movementPattern) {
      notes.push(`${classLabel} (${exercise.movementPattern})`);
    } else {
      notes.push(classLabel);
    }
  }

  if (exercise.loadDeltaPercent) {
    const sign = exercise.loadDeltaPercent > 0 ? '+' : '';
    notes.push(`Load: ${sign}${exercise.loadDeltaPercent.toFixed(1)}%`);
  }

  if (exercise.aiCue) {
    notes.push(`💡 ${exercise.aiCue}`);
  }

  return notes;
};

/**
 * Build day plan with enhanced information
 */
const buildDayPlan = (integrated: WorkoutTodayIntegratedV3): string => {
  let plan = integrated.summary;

  if (integrated.trainingPhase) {
    const phaseLabel = integrated.trainingPhase.charAt(0).toUpperCase() + integrated.trainingPhase.slice(1);
    plan += ` | Training Phase: ${phaseLabel}`;
  }

  if (integrated.aiOverloadDecision) {
    plan += ` | AI Confidence: ${(integrated.aiOverloadDecision.confidence * 100).toFixed(0)}%`;
  }

  return plan;
};

/**
 * Build workout notes with enhanced information
 */
const buildWorkoutNotes = (integrated: WorkoutTodayIntegratedV3): string[] => {
  const notes: string[] = [];

  if (integrated.trainingPhaseRationale) {
    notes.push(`Training Phase: ${integrated.trainingPhaseRationale}`);
  }

  if (integrated.aiOverloadDecision) {
    notes.push(`AI Overload: ${integrated.aiOverloadDecision.summary}`);
    integrated.aiOverloadDecision.notes.forEach(note => notes.push(`  • ${note}`));
  }

  if (integrated.overloadConfig) {
    notes.push(`Config: Adherence threshold ${integrated.overloadConfig.adherenceThreshold}%, Max load delta ${integrated.overloadConfig.maxLoadDeltaPercent}%`);
  }

  return notes;
};

/**
 * Build rationale with enhanced information
 */
const buildRationale = (integrated: WorkoutTodayIntegratedV3): string => {
  let rationale = integrated.summary;

  if (integrated.trainingPhase) {
    rationale += ` Training phase: ${integrated.trainingPhase}.`;
  }

  if (integrated.aiOverloadDecision) {
    rationale += ` AI overload applied with ${(integrated.aiOverloadDecision.confidence * 100).toFixed(0)}% confidence.`;
  }

  return rationale;
};

/**
 * Map workout status to readiness status
 */
const mapWorkoutStatusToReadiness = (status: string): 'ready' | 'moderate' | 'low' => {
  switch (status) {
    case 'optimal':
      return 'ready';
    case 'moderate':
      return 'moderate';
    case 'constrained':
    case 'deload':
      return 'low';
    default:
      return 'moderate';
  }
};

/**
 * Get overload completion tracking for a date
 */
export const getOverloadTracking = async (
  userId: string,
  date: string,
): Promise<OverloadCompletionRecord[]> => {
  try {
    const response = await api.get<{ data: OverloadCompletionRecord[] }>(
      `/overload-tracking/${userId}/${date}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Failed to get overload tracking', error);
    return [];
  }
};

/**
 * Mark overload as completed
 */
export const markOverloadCompleted = async (
  userId: string,
  date: string,
  exerciseKey: string,
  completionNotes?: string,
): Promise<OverloadCompletionRecord | null> => {
  try {
    const response = await api.post<{ data: OverloadCompletionRecord }>(
      `/overload-tracking/${userId}/${date}/${exerciseKey}/complete`,
      { completionNotes }
    );
    return response.data.data;
  } catch (error) {
    console.error('Failed to mark overload as completed', error);
    return null;
  }
};

/**
 * Get overload completion statistics
 */
export const getOverloadStats = async (
  userId: string,
  days: number = 30,
): Promise<OverloadCompletionStats | null> => {
  try {
    const response = await api.get<{ data: OverloadCompletionStats }>(
      `/overload-tracking/${userId}/stats?days=${days}`
    );
    return response.data.data;
  } catch (error) {
    console.error('Failed to get overload stats', error);
    return null;
  }
};
