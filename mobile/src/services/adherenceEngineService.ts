import api from './api';
import type { AdherenceRecord } from '../types/adherenceEngine';

export const getAdherenceToday = async (userId: string): Promise<AdherenceRecord> => {
  const response = await api.get<{ success: boolean; data: AdherenceRecord }>(`/adherence/${userId}/today`);
  return response.data.data;
};

export const getAdherenceHistory = async (userId: string): Promise<AdherenceRecord[]> => {
  const response = await api.get<{ success: boolean; data: AdherenceRecord[] }>(`/adherence/${userId}/history`);
  return response.data.data;
};
