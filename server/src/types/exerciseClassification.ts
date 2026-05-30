// Exercise Classification Types

export type ExerciseClassificationType = 'compound' | 'isolation' | 'unknown';
export type MovementPattern = 'squat' | 'hinge' | 'push' | 'pull' | 'lunge' | 'rotation' | 'carry' | 'unknown';

export interface ExerciseClassification {
  id: string;
  exerciseName: string;
  classification: ExerciseClassificationType;
  movementPattern?: MovementPattern;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
  createdAt: string;
  updatedAt: string;
}

export interface ExerciseClassificationInput {
  classification?: ExerciseClassificationType;
  movementPattern?: MovementPattern;
  primaryMuscles?: string[];
  secondaryMuscles?: string[];
}

export interface ClassifiedExercise {
  exerciseKey: string;
  exerciseName: string;
  classification: ExerciseClassificationType;
  movementPattern?: MovementPattern;
  isPrimaryCompound: boolean;
}
