import type { WorkoutBaseline, WorkoutExercise } from './workoutDocument';

export type WorkoutReadinessStatus = 'ready' | 'moderate' | 'low';

export interface WorkoutTodayPlan {
  day: string;
  dayPlan?: string;
  exercises: WorkoutExercise[];
  notes: string[];
}

export interface WorkoutAdjustment {
  code: 'recovery_deload' | 'joint_pain_modification' | 'targeted_emphasis';
  description: string;
}

export interface WorkoutTodayRecord {
  id: string;
  userId: string;
  date: string;
  baselineWorkout: WorkoutTodayPlan;
  adjustedWorkout: WorkoutTodayPlan;
  readinessStatus: WorkoutReadinessStatus;
  rationale: string;
  adjustments: WorkoutAdjustment[];
  baselineSnapshot: WorkoutBaseline;
  createdAt: string;
}
