/**
 * Predictive Behavior Intelligence Types - Phase 16
 * 
 * Proactive prediction of user behavior and execution patterns
 * Enables system to predict adherence risks before they occur
 */

import type { ExecutionDomain } from './execution';

// ============================================================================
// BEHAVIOR PREDICTIONS
// ============================================================================

export type PredictionType = 
  | 'adherenceRisk'
  | 'executionDrift'
  | 'completionLikelihood'
  | 'interventionTiming';

export type PredictionTimeframe = 'morning' | 'midday' | 'evening' | 'day';

export interface BehaviorPrediction {
  id: string;
  taskId?: string;
  predictionType: PredictionType;
  probability: number; // 0-1
  confidence: number; // 0-1
  timeframe: PredictionTimeframe;
  explanation: string;
  recommendedAction?: string;
  timestamp: string;
}

// ============================================================================
// BEHAVIOR RISKS
// ============================================================================

export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';

export interface BehaviorRisk {
  id: string;
  domain: ExecutionDomain;
  riskLevel: RiskLevel;
  predictedFailure: string;
  recommendedMitigation: string;
  probability: number; // 0-1
  confidence: number; // 0-1
  evidence: string[];
  urgency: 'low' | 'medium' | 'high';
}

// ============================================================================
// BEHAVIOR INSIGHTS
// ============================================================================

export type BehaviorInsightType = 'pattern' | 'correlation' | 'optimization' | 'warning';

export interface BehaviorInsight {
  id: string;
  type: BehaviorInsightType;
  description: string;
  confidence: number; // 0-1
  evidence: string[];
  actionable: boolean;
  recommendation?: string;
  impact: 'low' | 'medium' | 'high';
}

// ============================================================================
// ADHERENCE PREDICTION
// ============================================================================

export interface AdherencePrediction {
  domain: ExecutionDomain;
  predictedScore: number; // 0-100
  currentScore: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  confidence: number; // 0-1
  factors: string[];
}

// ============================================================================
// EXECUTION DRIFT PREDICTION
// ============================================================================

export interface ExecutionDriftPrediction {
  taskId: string;
  taskTitle: string;
  driftProbability: number; // 0-1
  expectedCompletionTime: string;
  currentTime: string;
  driftMinutes: number;
  severity: 'minor' | 'moderate' | 'major';
  intervention: string;
}

// ============================================================================
// COMPLETION LIKELIHOOD
// ============================================================================

export interface CompletionLikelihood {
  taskId: string;
  taskTitle: string;
  domain: ExecutionDomain;
  likelihood: number; // 0-1
  confidence: number; // 0-1
  factors: {
    timeOfDay: number; // -1 to 1
    historicalAdherence: number; // -1 to 1
    currentFatigue: number; // -1 to 1
    taskComplexity: number; // -1 to 1
  };
  recommendation: string;
}

// ============================================================================
// INTERVENTION TIMING
// ============================================================================

export interface InterventionTiming {
  taskId: string;
  optimalTime: string;
  currentTime: string;
  minutesUntilOptimal: number;
  reason: string;
  urgency: 'low' | 'medium' | 'high';
}

// ============================================================================
// BEHAVIORAL PATTERNS
// ============================================================================

export interface BehaviorPattern {
  id: string;
  patternType: 'time' | 'sequence' | 'condition' | 'trigger';
  description: string;
  frequency: number; // How often this pattern occurs (0-1)
  strength: number; // How strong the pattern is (0-1)
  examples: string[];
  predictivePower: number; // How well this predicts future behavior (0-1)
}

// ============================================================================
// UNIFIED PREDICTIVE BEHAVIOR INTELLIGENCE
// ============================================================================

export interface PredictiveBehaviorIntelligence {
  userId: string;
  date: string;
  
  // Core predictions
  predictions: BehaviorPrediction[];
  risks: BehaviorRisk[];
  insights: BehaviorInsight[];
  
  // Specific predictions
  adherencePredictions: AdherencePrediction[];
  driftPredictions: ExecutionDriftPrediction[];
  completionLikelihoods: CompletionLikelihood[];
  interventionTimings: InterventionTiming[];
  
  // Patterns
  patterns: BehaviorPattern[];
  
  // Overall assessment
  overallRiskLevel: RiskLevel;
  predictedDayScore: number; // 0-100
  confidence: number; // 0-1
  
  // Metadata
  generatedAt: string;
  dataQuality: 'high' | 'medium' | 'low' | 'insufficient';
}

// ============================================================================
// BEHAVIOR PREDICTION REQUEST
// ============================================================================

export interface BehaviorPredictionRequest {
  userId: string;
  date: string;
  includeRisks: boolean;
  includeInsights: boolean;
  includePatterns: boolean;
}
