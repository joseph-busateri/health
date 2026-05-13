export type MealLabel = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealAiStatus = 'pending' | 'skipped' | 'complete' | 'failed';

export interface MealLogInput {
  userId: string;
  takenAt?: string;
  photoUri: string;
  mealLabel?: MealLabel;
  notes?: string;
}

export interface MealLogRecord extends MealLogInput {
  id: string;
  takenAt: string;
  aiStatus: MealAiStatus;
  createdAt: string;
}
