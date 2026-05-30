import api from './api';
import type { RecoveryRecord } from '../types/recoveryEngine';

export const getRecoveryToday = async (userId: string, options?: { regenerate?: boolean }): Promise<RecoveryRecord> => {
  const params = options?.regenerate ? '?regenerate=true' : '';
  const response = await api.get<{ success: boolean; data: RecoveryRecord }>(`/recovery/${userId}/today${params}`);
  return response.data.data;
};

export const getRecoveryHistory = async (userId: string): Promise<RecoveryRecord[]> => {
  const response = await api.get<{ success: boolean; data: RecoveryRecord[] }>(`/recovery/${userId}/history`);
  return response.data.data;
};
