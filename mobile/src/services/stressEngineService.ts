import api from './api';
import type { StressRecord } from '../types/stressEngine';

export const getStressToday = async (userId: string): Promise<StressRecord> => {
  const response = await api.get<{ success: boolean; data: StressRecord }>(`/stress/${userId}/today`);
  return response.data.data;
};

export const getStressHistory = async (userId: string): Promise<StressRecord[]> => {
  const response = await api.get<{ success: boolean; data: StressRecord[] }>(`/stress/${userId}/history`);
  return response.data.data;
};
