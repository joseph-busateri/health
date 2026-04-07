/**
 * Control Tower Types - Autonomous AI Health Operating System
 * Unified type definitions for the decision-first Control Tower UI
 */

// ============================================================================
// CORE CONTROL TOWER TYPES
// ============================================================================

export type DecisionType = 
  | 'train_normal'
  | 'train_reduced'
  | 'recovery_focus'
  | 'maintain_plan'
  | 'reduce_intensity'
  | 'rest_day';

export type PriorityLevel = 'critical' | 'important' | 'optimization';
export type RiskLevel = 'low' | 'moderate' | 'high' | 'critical';
export type ConfidenceLevel = 'low' | 'medium' | 'high';

// ============================================================================
// TODAY'S DECISION
// ============================================================================

export interface TodayDecision {
  decisionType: DecisionType;
  title: string;
  summary: string;
  rationale: string;
  confidence: ConfidenceLevel;
  
  // Supporting status
  recoveryStatus: {
    score: number;
    label: string;
  };
  fatigueRisk: RiskLevel;
  
  // AI adjustments
  adjustments: string[];
  
  // Actions
  canAccept: boolean;
  canModify: boolean;
}

// ============================================================================
// PRIORITY ALERTS
// ============================================================================

export interface PriorityAlert {
  id: string;
  priority: PriorityLevel;
  type: 'risk' | 'opportunity' | 'optimization';
  title: string;
  description: string;
  evidence?: string[];
  source: string;
  action?: string;
}

// ============================================================================
// TODAY'S PLAN
// ============================================================================

export interface TodayPlanItem {
  domain: 'workout' | 'recovery' | 'nutrition' | 'supplements';
  title: string;
  recommendation: string;
  adjustments?: string[];
  reason?: string;
}

export interface TodayPlan {
  workout?: TodayPlanItem;
  recovery?: TodayPlanItem;
  nutrition?: TodayPlanItem;
  supplements?: TodayPlanItem;
}

// ============================================================================
// PREDICTIVE INTELLIGENCE
// ============================================================================

export interface PredictiveInsight {
  timeframe: '24h' | '3d' | '7d';
  type: 'recovery' | 'fatigue' | 'performance' | 'cardiovascular' | 'metabolic';
  prediction: string;
  riskLevel: RiskLevel;
  confidence: ConfidenceLevel;
  preventiveAction?: string;
}

// ============================================================================
// DEVICE INTELLIGENCE
// ============================================================================

export interface DeviceData {
  deviceType: 'sleep_number' | 'apple_watch' | 'oura_ring' | 'bp_monitor' | 'inbody';
  deviceName: string;
  connected: boolean;
  lastSync?: string;
  highlights: {
    label: string;
    value: string | number;
    status?: 'good' | 'warning' | 'critical';
  }[];
}

export interface DeviceIntelligence {
  devices: DeviceData[];
  hasData: boolean;
  dataQuality: 'high' | 'medium' | 'low' | 'none';
}

// ============================================================================
// GOAL PROGRESS
// ============================================================================

export interface GoalProgress {
  goalType: 'bodybuilding' | 'a1c_reduction' | 'recovery' | 'longevity';
  goalName: string;
  status: 'on_track' | 'at_risk' | 'off_track';
  progress: number; // 0-100
  trend: 'improving' | 'stable' | 'declining';
  explanation?: string;
}

// ============================================================================
// ADVANCED INTELLIGENCE
// ============================================================================

export interface AdvancedIntelligenceSection {
  id: string;
  title: string;
  description: string;
  available: boolean;
  navigationTarget?: string;
}

// ============================================================================
// UNIFIED CONTROL TOWER PAYLOAD
// ============================================================================

export interface ControlTowerPayload {
  userId: string;
  timestamp: string;
  
  // Core sections
  todayDecision: TodayDecision;
  priorityAlerts: PriorityAlert[];
  todayPlan: TodayPlan;
  predictiveInsights: PredictiveInsight[];
  deviceIntelligence: DeviceIntelligence;
  goalProgress: GoalProgress[];
  advancedIntelligence: AdvancedIntelligenceSection[];
  
  // Metadata
  dataQuality: 'high' | 'medium' | 'low' | 'none';
  lastUpdated: string;
}
