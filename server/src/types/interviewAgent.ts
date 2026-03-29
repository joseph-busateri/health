export type InterviewSessionStatus = 'pending' | 'completed';

export interface WorkoutInterviewInput {
  plannedSessions?: number;
  completedSessions?: number;
  barriers?: string;
  nextAction?: string;
}

export interface SupplementInterviewInput {
  missedItems?: number;
  sideEffects?: string;
  timingConsistency?: number;
  nextAction?: string;
}

export interface RecoveryClusterInterviewInput {
  sleepHours?: number;
  recoveryFeeling?: number;
  stressLevel?: number;
  jointPainLevel?: number;
  adherenceLevel?: number;
  notes?: string;
}

export interface InterviewSubmissionInput {
  primaryResponse?: string;
  followUpResponse?: string;
  workout?: WorkoutInterviewInput;
  supplement?: SupplementInterviewInput;
  recoveryCluster?: RecoveryClusterInterviewInput;
}

export interface DailyInterviewSession {
  id: string;
  userId: string;
  date: string;
  primaryPrompt: string;
  followUpPrompt?: string;
  dynamicQuestions: string[];
  focusComponents: string[];
  status: InterviewSessionStatus;
  reason: string;
  createdAt: string;
  completedAt?: string;
  submission?: InterviewSubmissionInput;
}

export interface WorkoutEngineState {
  userId: string;
  adherenceScore: number;
  plannedSessions: number;
  completedSessions: number;
  barriers?: string;
  nextAction?: string;
  updatedAt: string;
}

export interface SupplementEngineState {
  userId: string;
  adherenceScore: number;
  missedItems: number;
  timingConsistency: number;
  sideEffects?: string;
  nextAction?: string;
  updatedAt: string;
}

export interface RecoveryClusterEngineState {
  userId: string;
  recoveryScore: number;
  stressScore: number;
  jointScore: number;
  adherenceScore: number;
  riskLevel: 'low' | 'moderate' | 'high';
  notes?: string;
  updatedAt: string;
}

export interface EngineSnapshot {
  workout?: WorkoutEngineState;
  supplement?: SupplementEngineState;
  recoveryCluster?: RecoveryClusterEngineState;
}
