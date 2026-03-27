import { WorkoutBaseline, WorkoutDocumentResult, ManualWorkoutData } from '../types/workoutDocument';

export type { ManualWorkoutData };

const API_BASE_URL = 'http://localhost:3000';

export const uploadWorkoutDocument = async (
  userId: string,
  documentType: string,
  manualWorkoutData?: ManualWorkoutData,
  fileReference?: string,
  storagePath?: string,
  programStartDate?: string,
  notes?: string
): Promise<WorkoutDocumentResult> => {
  try {
    const response = await fetch(`${API_BASE_URL}/workout-document`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        userId,
        documentType,
        manualWorkoutData,
        fileReference,
        storagePath,
        programStartDate,
        notes,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to upload workout document');
    }

    return data.data;
  } catch (error) {
    console.error('Error uploading workout document:', error);
    throw error;
  }
};

export const getWorkoutBaseline = async (userId: string): Promise<WorkoutBaseline | null> => {
  try {
    const response = await fetch(`${API_BASE_URL}/workout-baseline/${userId}`);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(data.error || 'Failed to get workout baseline');
    }

    return data.data;
  } catch (error) {
    console.error('Error getting workout baseline:', error);
    throw error;
  }
};

export const getLatestWorkoutDocument = async (userId: string) => {
  try {
    const response = await fetch(`${API_BASE_URL}/workout-document/${userId}/latest`);

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(data.error || 'Failed to get latest workout document');
    }

    return data.data;
  } catch (error) {
    console.error('Error getting latest workout document:', error);
    throw error;
  }
};
