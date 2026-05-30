import api from './api';
import type { JointHealthRecord } from '../types/jointHealthEngine';

export const getJointHealthToday = async (userId: string): Promise<JointHealthRecord> => {
  const response = await api.get<{ success: boolean; data: JointHealthRecord }>(`/joint-health/${userId}/today`);
  return response.data.data;
};

export const getJointHealthHistory = async (userId: string): Promise<JointHealthRecord[]> => {
  const response = await api.get<{ success: boolean; data: JointHealthRecord[] }>(`/joint-health/${userId}/history`);
  return response.data.data;
};
