import api from './api';
import {
  SupplementBaselineWithItems,
  SupplementDocumentResult,
  CreateSupplementDocumentRequest,
  ManualSupplementData,
} from '../types/supplementDocument';

export const uploadSupplementDocument = async (
  request: CreateSupplementDocumentRequest,
): Promise<SupplementDocumentResult> => {
  const response = await api.post<{ success: boolean; data: SupplementDocumentResult }>(
    '/supplement-document',
    request,
  );
  return response.data.data;
};

export const getSupplementBaseline = async (
  userId: string,
): Promise<SupplementBaselineWithItems | null> => {
  try {
    const response = await api.get<{ success: boolean; data: SupplementBaselineWithItems }>(
      `/supplement-baseline/${userId}`,
    );
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const getLatestSupplementDocument = async (
  userId: string,
): Promise<SupplementDocumentResult | null> => {
  try {
    const response = await api.get<{ success: boolean; data: SupplementDocumentResult }>(
      `/supplement-document/${userId}/latest`,
    );
    return response.data.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

// Export ManualSupplementData for use in screens
export type { ManualSupplementData } from '../types/supplementDocument';
