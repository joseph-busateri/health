export type AdherenceStatus = 'low' | 'moderate' | 'high';
export type AdherenceTrend = 'improving' | 'stable' | 'declining';

export interface AdherenceInputs {
  workoutAdherence?: number;
  nutritionAdherence?: number;
  sleepAdherence?: number;
  supplementAdherence?: number;
  verbalNotes?: string;
}

export interface AdherenceDomainBreakdown {
  workout: number;
  nutrition: number;
  sleep: number;
  supplement: number;
}

export interface AdherenceRecommendation {
  summary: string;
  note: string;
}

export interface AdherenceRecord {
  id: string;
  userId: string;
  date: string;
  adherenceScore: number;
  status: AdherenceStatus;
  breakdown: AdherenceDomainBreakdown;
  trend: AdherenceTrend;
  recommendation: AdherenceRecommendation;
  sourceInputs: AdherenceInputs;
  createdAt: string;
}
