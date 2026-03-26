import api from './api';
import type { BaselineConfig } from '../types/baselineConfig';

const USER_ID = process.env.EXPO_PUBLIC_SAMPLE_USER_ID || 'mobile-demo-user';

export const fetchBaselineConfig = async (): Promise<BaselineConfig> => {
  const response = await api.get<{ config: BaselineConfig }>(`/baseline-config/${USER_ID}`);
  return response.data.config;
};

export const updateBaselineConfig = async (payload: {
  defaultSleepTarget: number;
  stressTolerance: number;
  recoverySensitivity: number;
}): Promise<BaselineConfig> => {
  const response = await api.post<{ config: BaselineConfig }>(
    '/baseline-config',
    {
      user_id: USER_ID,
      default_sleep_target: payload.defaultSleepTarget,
      stress_tolerance: payload.stressTolerance,
      recovery_sensitivity: payload.recoverySensitivity,
    },
  );

  return response.data.config;
};
