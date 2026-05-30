import api from './api';
import type { WorkoutTodayRecord } from '../types/workoutToday';
import type { WorkoutTodayIntegrated, WorkoutExerciseIntegrated, WorkoutAdjustmentApplied } from '../types/workoutTodayV2';
import { getWorkoutToday } from './workoutTodayService';

const USE_INTEGRATED_WORKOUT = process.env.EXPO_PUBLIC_USE_INTEGRATED_WORKOUT === 'true';

/**
 * Transform WorkoutExerciseIntegrated to basic WorkoutExercise format
 * Converts sets, reps, intensity, rest into setRepLoadNotes string
 */
const transformExercise = (exercise: WorkoutExerciseIntegrated) => {
  const parts: string[] = [];
  
  if (exercise.sets) {
    parts.push(`${exercise.sets} sets`);
  }
  
  if (exercise.reps) {
    parts.push(`${exercise.reps} reps`);
  }
  
  if (exercise.intensity) {
    parts.push(`@ ${exercise.intensity}`);
  }
  
  if (exercise.rest) {
    parts.push(`rest: ${exercise.rest}`);
  }
  
  const setRepLoadNotes = parts.length > 0 ? parts.join(', ') : (exercise.notes || '');
  
  return {
    name: exercise.name,
    dayAssociation: '', // Not provided by integrated service
    setRepLoadNotes: setRepLoadNotes,
    grouping: undefined,
  };
};

/**
 * Transform WorkoutAdjustmentApplied to basic WorkoutAdjustment format
 * Maps adjustment types to codes
 */
const transformAdjustment = (adjustment: WorkoutAdjustmentApplied) => {
  const codeMap: Record<string, WorkoutTodayRecord['adjustments'][number]['code']> = {
    'progressive_overload': 'targeted_emphasis',
    'volume': 'recovery_deload',
    'intensity': 'recovery_deload',
    'deload': 'recovery_deload',
    'substitution': 'joint_pain_modification',
    'rest': 'recovery_deload',
  };
  
  return {
    code: codeMap[adjustment.type] || 'targeted_emphasis',
    description: adjustment.change || adjustment.reason,
  };
};

/**
 * Map workoutStatus to readinessStatus
 */
const mapWorkoutStatusToReadiness = (status: WorkoutTodayIntegrated['workoutStatus']): WorkoutTodayRecord['readinessStatus'] => {
  const statusMap: Record<WorkoutTodayIntegrated['workoutStatus'], WorkoutTodayRecord['readinessStatus']> = {
    'optimal': 'ready',
    'moderate': 'moderate',
    'constrained': 'moderate',
    'deload': 'low',
  };
  
  return statusMap[status] || 'moderate';
};

/**
 * Transform WorkoutTodayIntegrated to WorkoutTodayRecord
 * Adapts the integrated service response to match the basic service structure
 */
const transformIntegratedToBasic = (integrated: WorkoutTodayIntegrated): WorkoutTodayRecord => {
  const exercises = integrated.exercises.map(transformExercise);
  
  const adjustments = integrated.adjustmentsApplied?.map(transformAdjustment) || [];
  
  // If no adjustments but source is ai_optimized, add a note about progressive overload
  if (adjustments.length === 0 && integrated.source === 'ai_optimized') {
    adjustments.push({
      code: 'targeted_emphasis',
      description: 'AI-optimized workout based on cross-engine intelligence',
    });
  }
  
  return {
    id: integrated.id,
    userId: integrated.userId,
    date: integrated.date,
    baselineWorkout: {
      day: integrated.workoutType,
      dayPlan: integrated.summary,
      exercises: exercises,
      notes: [],
    },
    adjustedWorkout: {
      day: integrated.workoutType,
      dayPlan: integrated.summary,
      exercises: exercises, // Integrated service doesn't separate baseline/adjusted
      notes: integrated.adjustmentsApplied?.map(adj => adj.reason).filter(Boolean) || [],
    },
    readinessStatus: mapWorkoutStatusToReadiness(integrated.workoutStatus),
    rationale: integrated.summary,
    adjustments: adjustments,
    baselineSnapshot: {
      id: integrated.id,
      userId: integrated.userId,
      documentId: integrated.id, // Use workout ID as document ID
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
 * Get workout today with integrated service (V2)
 * Falls back to basic service if integrated service fails or is disabled
 */
export const getWorkoutTodayV2 = async (userId: string, options?: { regenerate?: boolean }): Promise<WorkoutTodayRecord> => {
  if (!USE_INTEGRATED_WORKOUT) {
    // Feature flag disabled - use basic service
    return getWorkoutToday(userId, options);
  }
  
  try {
    const response = await api.get<{ success: boolean; data: WorkoutTodayIntegrated }>(
      `/workout-today/${userId}/today${options?.regenerate ? '?regenerate=true' : ''}`,
    );
    
    const integrated = response.data.data;
    
    // Transform integrated response to basic format
    return transformIntegratedToBasic(integrated);
  } catch (error) {
    console.warn('[WorkoutTodayV2] Integrated service failed, falling back to basic service', error);
    
    // Fallback to basic service
    return getWorkoutToday(userId, options);
  }
};

/**
 * Get workout today history (V2)
 * Currently uses basic service history as integrated service history may differ
 */
export const getWorkoutTodayHistoryV2 = async (userId: string): Promise<WorkoutTodayRecord[]> => {
  // For now, use basic service history
  // Could be enhanced to use integrated service history if needed
  const { getWorkoutTodayHistory } = await import('./workoutTodayService');
  return getWorkoutTodayHistory(userId);
};
