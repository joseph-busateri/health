import api from './api';
import type { MetabolicRecord } from '../types/metabolicEngine';

export const getMetabolicToday = async (userId: string): Promise<MetabolicRecord> => {
  const response = await api.get<{ success: boolean; data: MetabolicRecord }>(`/metabolic/${userId}/today`);
  return response.data.data;
};

export const getMetabolicHistory = async (userId: string): Promise<MetabolicRecord[]> => {
  const response = await api.get<{ success: boolean; data: MetabolicRecord[] }>(`/metabolic/${userId}/history`);
  return response.data.data;
};
