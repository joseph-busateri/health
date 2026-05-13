import api from './api';
import type {
  BaselineUploadRequest,
  BaselineUploadResult,
  BaselineProfile,
  BaselineDocument,
} from '../types/baselineDocument';

export const uploadBaselineDocument = async (
  userId: string,
  request: BaselineUploadRequest,
): Promise<BaselineUploadResult> => {
  const response = await api.post<{ success: boolean; data: BaselineUploadResult }>(
    '/baseline-document',
    {
      ...request,
      userId,
    },
  );
  return response.data.data;
};

export const getBaselineProfile = async (userId: string): Promise<BaselineProfile | null> => {
  try {
    const response = await api.get<{ success: boolean; data: BaselineProfile }>(
      `/baseline-profile/${userId}`,
    );
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getLatestBaselineDocument = async (userId: string): Promise<BaselineDocument | null> => {
  try {
    const response = await api.get<{ success: boolean; data: BaselineDocument }>(
      `/baseline-document/${userId}/latest`,
    );
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
