export type AdjustmentCategory = 'workout' | 'recovery' | 'stress' | 'joint' | 'nutrition';

export type AdjustmentPriority = 'critical' | 'important' | 'optimization';

export interface AutonomousAdjustment {
  category: AdjustmentCategory;
  adjustment: string;
  rationale: string;
  priority: AdjustmentPriority;
}

export interface AutonomousPlan {
  adjustments: AutonomousAdjustment[];
  summary: string;
  priority: AdjustmentPriority;
  source?: 'ai_enriched' | 'fallback';
}

export interface AutonomousRecord {
  id: string;
  userId: string;
  date: string;
  plan: AutonomousPlan;
  createdAt: string;
}

export interface OptimizationContext {
  userId: string;
  recoveryScore?: number;
  recoveryStatus?: string;
  stressScore?: number;
  stressStatus?: string;
  jointRiskLevel?: string;
  predictiveTrends?: any;
  adaptiveInsights?: any;
}
