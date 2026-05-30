import api from './api';
import type { SexualHealthRecord, SexualHealthRecordV3 } from '../types/sexualHealthEngine';

export const getSexualHealthToday = async (userId: string): Promise<SexualHealthRecord> => {
  const response = await api.get<{ success: boolean; data: SexualHealthRecord }>(`/api/sexual-health-v2/${userId}/today`);
  return response.data.data;
};

export const getSexualHealthHistory = async (userId: string): Promise<SexualHealthRecord[]> => {
  const response = await api.get<{ success: boolean; data: SexualHealthRecord[] }>(`/api/sexual-health-v2/${userId}/history`);
  return response.data.data;
};

// V3: With raw hormone values
export const getSexualHealthTodayV3 = async (userId: string): Promise<SexualHealthRecordV3> => {
  const response = await api.get<{ success: boolean; data: SexualHealthRecordV3 }>(`/api/sexual-health-v3/${userId}/today`);
  return response.data.data;
};

export const getSexualHealthHistoryV3 = async (userId: string): Promise<SexualHealthRecordV3[]> => {
  const response = await api.get<{ success: boolean; data: SexualHealthRecordV3[] }>(`/api/sexual-health-v3/${userId}/history`);
  return response.data.data;
};
