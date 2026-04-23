import api from './api';
import type { WorkoutTodayRecord } from '../types/workoutToday';

export const getWorkoutToday = async (userId: string, options?: { regenerate?: boolean }): Promise<WorkoutTodayRecord> => {
  const response = await api.get<{ success: boolean; data: WorkoutTodayRecord }>(
    `/api/workout-document/workout/today/${userId}${options?.regenerate ? '?regenerate=true' : ''}`,
  );
  return response.data.data;
};

export const getWorkoutTodayHistory = async (userId: string): Promise<WorkoutTodayRecord[]> => {
  const response = await api.get<{ success: boolean; data: WorkoutTodayRecord[] }>(
    `/api/workout-document/workout/today/history/${userId}`,
  );
  return response.data.data;
};
