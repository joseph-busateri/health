import api from './api';
import { WorkoutBaseline, WorkoutDocumentResult, ManualWorkoutData } from '../types/workoutDocument';

export type { ManualWorkoutData };

interface UploadWorkoutDocumentPayload {
  userId: string;
  documentType: string;
  manualWorkoutData?: ManualWorkoutData;
  fileReference?: string;
  storagePath?: string;
  programStartDate?: string;
  notes?: string;
}

export const uploadWorkoutDocument = async (
  payload: UploadWorkoutDocumentPayload,
): Promise<WorkoutDocumentResult> => {
  const response = await api.post<{ success: boolean; data: WorkoutDocumentResult }>(
    '/api/workout-document/workout-document',
    payload,
  );
  return response.data.data;
};

export const getWorkoutBaseline = async (userId: string): Promise<WorkoutBaseline | null> => {
  try {
    const response = await api.get<{ success: boolean; data: WorkoutBaseline }>(
      `/api/workout-document/workout-baseline/${userId}`,
    );
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getLatestWorkoutDocument = async (userId: string) => {
  try {
    const response = await api.get<{ success: boolean; data: WorkoutDocumentResult }>(
      `/api/workout-document/workout-document/${userId}/latest`,
    );
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
