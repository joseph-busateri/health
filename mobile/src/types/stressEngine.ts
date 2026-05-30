export type StressStatus = 'low' | 'moderate' | 'high';

export interface StressSourceInputs {
  interviewStressLevel?: number;
  hrv?: number;
  sleepDurationHours?: number;
  workoutLoad?: number;
  recoveryScore?: number;
}

export interface StressRecommendation {
  summary: string;
  actions: string[];
}

export interface StressRecord {
  id: string;
  userId: string;
  date: string;
  stressScore: number;
  stressStatus: StressStatus;
  cnsLoadStatus: StressStatus;
  sourceInputs: StressSourceInputs;
  recommendation: StressRecommendation;
  createdAt: string;
}
