export interface StrengthSetInput {
  setNumber?: number;
  reps: number;
  loadKg?: number;
  loadLbs?: number;
  rpe?: number;
  notes?: string;
}

export interface StrengthExerciseEntryInput {
  exerciseName: string;
  muscleGroup?: string;
  sets: StrengthSetInput[];
  notes?: string;
}

export interface StrengthSessionInput {
  userId: string;
  sessionDate?: string;
  programName?: string;
  notes?: string;
  entries: StrengthExerciseEntryInput[];
}

export interface StrengthExerciseSummary {
  exerciseName: string;
  totalSets: number;
  totalReps: number;
  topSetLoadKg?: number;
  estimatedOneRepMaxKg?: number;
}

export interface StrengthSessionRecord extends StrengthSessionInput {
  id: string;
  sessionDate: string;
  createdAt: string;
  summaries: StrengthExerciseSummary[];
}
