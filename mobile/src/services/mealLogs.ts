import api from './api';
import type { MealLog, MealLogListResponse } from '../types/mealLog';

const USER_ID = process.env.EXPO_PUBLIC_SAMPLE_USER_ID || 'mobile-demo-user';

export const fetchMealLogs = async (): Promise<MealLogListResponse> => {
  const response = await api.get<MealLogListResponse>(`/meal-logs/${USER_ID}`);
  return response.data;
};

export const submitMealLog = async (payload: {
  photoUri: string;
  takenAt?: string;
  mealLabel?: string;
  notes?: string;
}): Promise<MealLog> => {
  const response = await api.post<{ mealLog: MealLog }>(
    '/meal-log',
    {
      user_id: USER_ID,
      photo_uri: payload.photoUri,
      taken_at: payload.takenAt,
      meal_label: payload.mealLabel,
      notes: payload.notes,
    },
  );

  return response.data.mealLog;
};
