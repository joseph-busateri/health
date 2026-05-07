import type { InputMetadata } from './inputMetadata';

export type JointHealthStatus = 'stable' | 'caution' | 'aggravated';
export type JointRiskLevel = 'low' | 'moderate' | 'high';
export type JointArea = 'shoulder' | 'knee' | 'back' | 'elbow' | 'other';

export interface JointHealthInputs {
  painLevel?: number;
  tightnessLevel?: number;
  sorenessLevel?: number;
  affectedArea?: JointArea;
  workoutLoad?: number;
  recoveryScore?: number;
  verbalNotes?: string;
}

export interface JointWorkoutModificationRecommendation {
  summary: string;
  modifications: string[];
  safetyNotes: string[];
}

export interface JointHealthRecord {
  id: string;
  userId: string;
  date: string;
  affectedArea: JointArea;
  jointHealthStatus: JointHealthStatus;
  riskLevel: JointRiskLevel;
  inputs: JointHealthInputs;
  recommendation: JointWorkoutModificationRecommendation;
  createdAt: string;
  detailedInputs?: InputMetadata[];
}
