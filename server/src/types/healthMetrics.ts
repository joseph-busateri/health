export interface CardioMetricRecord {
  userId: string;
  takenAt: string; // ISO timestamp
  systolic: number; // mmHg
  diastolic: number; // mmHg
  restingHeartRate: number; // bpm
  source?: string;
  notes?: string;
}

export type SexualHealthStatusLevel = 'Aligned' | 'Monitoring' | 'Concerned';

export interface SexualHealthCheckInRecord {
  userId: string;
  takenAt: string; // ISO timestamp
  desireLevel: number; // 1-5
  satisfactionLevel: number; // 1-5
  stressImpact: number; // 1-5 (higher = more stress)
  status: SexualHealthStatusLevel;
  notes?: string;
}

export interface SexualHealthStatusRecord {
  userId: string;
  takenAt: string; // ISO timestamp
  status: SexualHealthStatusLevel;
  confidence?: number; // 0-1
  summary?: string;
}
