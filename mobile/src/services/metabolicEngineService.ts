import api from './api';
import type { MetabolicRecord } from '../types/metabolicEngine';

// V1 methods (with hardcoded defaults)
export const getMetabolicToday = async (userId: string): Promise<MetabolicRecord> => {
  const response = await api.get<{ success: boolean; data: MetabolicRecord }>(`/metabolic/${userId}/today`);
  return response.data.data;
};

export const getMetabolicHistory = async (userId: string): Promise<MetabolicRecord[]> => {
  const response = await api.get<{ success: boolean; data: MetabolicRecord[] }>(`/metabolic/${userId}/history`);
  return response.data.data;
};

// V2 methods (no hardcoded defaults, weight trend calculation, HOMA-IR)
export const getMetabolicTodayV2 = async (userId: string): Promise<MetabolicRecord> => {
  const response = await api.get<{ success: boolean; data: MetabolicRecord }>(`/metabolic/v2/${userId}/today`);
  return response.data.data;
};

export const getMetabolicHistoryV2 = async (userId: string): Promise<MetabolicRecord[]> => {
  const response = await api.get<{ success: boolean; data: MetabolicRecord[] }>(`/metabolic/v2/${userId}/history`);
  return response.data.data;
};
