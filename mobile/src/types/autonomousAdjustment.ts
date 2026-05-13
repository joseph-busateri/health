/**
 * Autonomous Adjustment Types - Phase 17
 * 
 * System-generated plan adjustments based on:
 * - Execution drift
 * - Behavior predictions
 * - Device intelligence
 * - Real-time data
 */

import type { ExecutionDomain } from './execution';

// ============================================================================
// AUTONOMOUS ADJUSTMENTS
// ============================================================================

export type AdjustmentType = 
  | 'reduceIntensity'
  | 'increaseRecovery'
  | 'simplifyPlan'
  | 'adjustNutrition'
  | 'increaseHydration'
  | 'addRest'
  | 'modifyTiming'
  | 'splitTask';

export type AdjustmentStatus = 'pending' | 'accepted' | 'dismissed' | 'applied';

export interface AutonomousAdjustment {
  id: string;
  domain: ExecutionDomain;
  adjustmentType: AdjustmentType;
  reason: string;
  confidence: number; // 0-1
  impact: 'minor' | 'moderate' | 'major';
  status: AdjustmentStatus;
  
  // What changes
  originalValue?: string;
  adjustedValue?: string;
  
  // Why this adjustment
  triggers: string[];
  expectedOutcome: string;
  
  // Safety
  reversible: boolean;
  requiresConfirmation: boolean;
  
  // Metadata
  createdAt: string;
  appliedAt?: string;
  dismissedAt?: string;
}

// ============================================================================
// ADJUSTMENT TRIGGERS
// ============================================================================

export type TriggerType = 
  | 'adherenceRisk'
  | 'executionDrift'
  | 'deviceSignal'
  | 'fatigueDetected'
  | 'recoveryDeficit'
  | 'nutritionGap'
  | 'timeConstraint';

export interface AdjustmentTrigger {
  type: TriggerType;
  severity: 'low' | 'medium' | 'high';
  description: string;
  dataPoint?: {
    metric: string;
    value: number;
    threshold: number;
  };
}

// ============================================================================
// WORKOUT ADJUSTMENTS
// ============================================================================

export interface WorkoutAdjustment extends AutonomousAdjustment {
  domain: 'workout';
  workoutChanges: {
    originalVolume?: number;
    adjustedVolume?: number;
    originalIntensity?: string;
    adjustedIntensity?: string;
    originalDuration?: number;
    adjustedDuration?: number;
  };
}

// ============================================================================
// RECOVERY ADJUSTMENTS
// ============================================================================

export interface RecoveryAdjustment extends AutonomousAdjustment {
  domain: 'recovery';
  recoveryChanges: {
    addedRestTime?: number;
    sleepRecommendation?: string;
    activeRecoveryAdded?: boolean;
  };
}

// ============================================================================
// NUTRITION ADJUSTMENTS
// ============================================================================

export interface NutritionAdjustment extends AutonomousAdjustment {
  domain: 'nutrition';
  nutritionChanges: {
    proteinAdjustment?: number;
    calorieAdjustment?: number;
    hydrationAdjustment?: number;
    mealTimingChange?: string;
  };
}

// ============================================================================
// PLAN SIMPLIFICATION
// ============================================================================

export interface PlanSimplification {
  id: string;
  reason: string;
  tasksRemoved: string[];
  tasksMerged: Array<{
    original: string[];
    merged: string;
  }>;
  tasksSimplified: Array<{
    taskId: string;
    originalComplexity: number;
    simplifiedComplexity: number;
  }>;
  expectedAdherenceImprovement: number; // 0-100
}

// ============================================================================
// ADJUSTMENT HISTORY
// ============================================================================

export interface AdjustmentHistoryEntry {
  adjustmentId: string;
  appliedAt: string;
  outcome: 'successful' | 'neutral' | 'unsuccessful';
  adherenceChange: number; // -100 to 100
  userFeedback?: 'helpful' | 'neutral' | 'unhelpful';
  notes?: string;
}

// ============================================================================
// ADJUSTMENT RULES
// ============================================================================

export interface AdjustmentRule {
  id: string;
  name: string;
  condition: string;
  adjustmentType: AdjustmentType;
  priority: number;
  enabled: boolean;
  successRate: number; // 0-1
}

// ============================================================================
// UNIFIED AUTONOMOUS ADJUSTMENT INTELLIGENCE
// ============================================================================

export interface AutonomousAdjustmentIntelligence {
  userId: string;
  date: string;
  
  // Pending adjustments
  pendingAdjustments: AutonomousAdjustment[];
  
  // Applied adjustments
  appliedAdjustments: AutonomousAdjustment[];
  
  // Dismissed adjustments
  dismissedAdjustments: AutonomousAdjustment[];
  
  // Triggers that led to adjustments
  triggers: AdjustmentTrigger[];
  
  // Plan simplifications
  simplifications: PlanSimplification[];
  
  // History
  history: AdjustmentHistoryEntry[];
  
  // Rules applied
  rulesApplied: AdjustmentRule[];
  
  // Overall assessment
  adjustmentCount: number;
  autoAppliedCount: number;
  userConfirmedCount: number;
  successRate: number; // 0-1
  
  // Metadata
  generatedAt: string;
  lastUpdated: string;
}

// ============================================================================
// ADJUSTMENT APPLICATION REQUEST
// ============================================================================

export interface AdjustmentApplicationRequest {
  adjustmentId: string;
  userId: string;
  userConfirmed: boolean;
  feedback?: string;
  timestamp: string;
}

// ============================================================================
// ADJUSTMENT DISMISSAL REQUEST
// ============================================================================

export interface AdjustmentDismissalRequest {
  adjustmentId: string;
  userId: string;
  reason?: string;
  timestamp: string;
}
