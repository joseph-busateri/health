export type MealLabel = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type MealAiStatus = 'pending' | 'skipped' | 'complete' | 'failed';

export interface MealLog {
  id: string;
  userId: string;
  takenAt: string;
  photoUri: string;
  mealLabel?: MealLabel;
  notes?: string;
  aiStatus: MealAiStatus;
  createdAt: string;
}

export interface MealLogListResponse {
  mealLogs: MealLog[];
}
