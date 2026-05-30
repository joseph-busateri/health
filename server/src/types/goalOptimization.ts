export type GoalType =
  | 'muscle_gain'
  | 'fat_loss'
  | 'performance'
  | 'recovery'
  | 'injury_prevention'
  | 'metabolic'
  | 'cardiovascular'
  | 'sexual_health';

export type GoalPriority = 'critical' | 'important' | 'optimization';

export interface UserGoal {
  type: GoalType;
  priority: number; // 1-10, higher = more important
  targetDate?: string;
  notes?: string;
}

export interface GoalAdjustment {
  goal: GoalType;
  adjustment: string;
  rationale: string;
  priority: GoalPriority;
  impact: 'high' | 'medium' | 'low';
}

export interface GoalDrivenPlan {
  adjustments: GoalAdjustment[];
  summary: string;
  primaryGoal?: GoalType;
  goalAlignment: number; // 0-100, how well plan aligns with goals
  source?: 'ai_enriched' | 'fallback';
}

export interface GoalDrivenRecord {
  id: string;
  userId: string;
  date: string;
  goals: UserGoal[];
  plan: GoalDrivenPlan;
  createdAt: string;
}

export interface GoalOptimizationContext {
  userId: string;
  goals: UserGoal[];
  recoveryScore?: number;
  recoveryStatus?: string;
  stressScore?: number;
  stressStatus?: string;
  jointRiskLevel?: string;
  predictiveTrends?: any;
  adaptiveInsights?: any;
  autonomousPlan?: any;
}

export interface GoalConflict {
  goal1: GoalType;
  goal2: GoalType;
  conflictType: 'direct' | 'indirect' | 'resource';
  severity: 'high' | 'medium' | 'low';
  resolution: string;
}
