import api from './api';
import type { SupplementRecommendation, SupplementStack } from '../types/supplementEngine';

export const generateSupplementRecommendations = async (
  userId: string,
  context?: Record<string, unknown>
): Promise<{ recommendations: SupplementRecommendation[]; summary: any }> => {
  const response = await api.post(`/supplements/recommendations/generate/${userId}`, context ?? {});
  return response.data.data;
};

export const getSupplementRecommendations = async (
  userId: string
): Promise<SupplementRecommendation[]> => {
  const response = await api.get(`/supplements/recommendations/${userId}`);
  return response.data.data;
};

export const getCurrentSupplementStack = async (userId: string): Promise<SupplementStack | null> => {
  try {
    const response = await api.get(`/supplements/current/${userId}`);
    return response.data.data;
  } catch (error: any) {
    if (error.response?.status === 404) {
      return null;
    }
    throw error;
  }
};
