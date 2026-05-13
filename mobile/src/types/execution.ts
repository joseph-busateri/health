/**
 * Execution Intelligence Types - Phase 15
 * 
 * Closed-Loop Autonomous Execution System
 * Recommendation → Execution → Adherence → Outcome → Learning
 */

// ============================================================================
// EXECUTION PLAN
// ============================================================================

export type ExecutionDomain = 'workout' | 'recovery' | 'nutrition' | 'supplements';
export type ExecutionPriority = 'critical' | 'high' | 'moderate' | 'low';
export type ExecutionStatus = 'pending' | 'completed' | 'partial' | 'skipped';
export type ExecutionSource = 'manual' | 'device' | 'ai-inferred';

export interface ExecutionTask {
  id: string;
  domain: ExecutionDomain;
  title: string;
  description?: string;
  targetValue?: number;
  targetUnit?: string;
  priority: ExecutionPriority;
  status: ExecutionStatus;
  expectedImpact?: string;
  completedAt?: string;
  completedValue?: number;
}

export interface DailyExecutionPlan {
  id: string;
  userId: string;
  date: string;
  decisionType: string;
  confidence?: number;
  tasks: ExecutionTask[];
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// EXECUTION EVENTS
// ============================================================================

export interface ExecutionEvent {
  id: string;
  taskId: string;
  timestamp: string;
  source: ExecutionSource;
  value?: number;
  unit?: string;
  notes?: string;
}

// ============================================================================
// ADHERENCE INTELLIGENCE
// ============================================================================

export type AdherenceStatus = 'onTrack' | 'partial' | 'missed' | 'exceeded';

export interface AdherenceAssessment {
  taskId: string;
  score: number; // 0-100
  status: AdherenceStatus;
  confidence: number; // 0-1
  reasoning?: string;
}

export interface DomainAdherence {
  domain: ExecutionDomain;
  score: number; // 0-100
  completedTasks: number;
  totalTasks: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface AdherenceSummary {
  userId: string;
  date: string;
  overallScore: number; // 0-100
  domains: DomainAdherence[];
  streak: number; // consecutive days
  weeklyAverage: number;
  monthlyAverage: number;
}

// ============================================================================
// OUTCOME INTELLIGENCE
// ============================================================================

export type OutcomeType = 'positive' | 'neutral' | 'negative';
export type OutcomeConfidence = 'low' | 'medium' | 'high';

export interface OutcomeFeedback {
  id: string;
  taskId?: string;
  domain: ExecutionDomain;
  outcomeType: OutcomeType;
  description: string;
  attribution: string; // What caused this outcome
  confidence: OutcomeConfidence;
  timestamp: string;
  metrics?: {
    before: number;
    after: number;
    change: number;
    unit: string;
  };
}

// ============================================================================
// LEARNING INTELLIGENCE
// ============================================================================

export interface LearningInsight {
  id: string;
  type: 'pattern' | 'correlation' | 'optimization' | 'warning';
  title: string;
  description: string;
  evidence: string[];
  confidence: number; // 0-1
  actionable: boolean;
  recommendation?: string;
}

export interface LearningSignal {
  userId: string;
  date: string;
  insights: LearningInsight[];
  adaptations: string[]; // What the AI learned
}

// ============================================================================
// INTERVENTION INTELLIGENCE
// ============================================================================

export type InterventionUrgency = 'low' | 'medium' | 'high' | 'critical';
export type InterventionType = 'reminder' | 'adjustment' | 'warning' | 'opportunity';

export interface Intervention {
  id: string;
  type: InterventionType;
  urgency: InterventionUrgency;
  title: string;
  description: string;
  taskId?: string;
  domain: ExecutionDomain;
  suggestedAction: string;
  timing: string; // When to intervene
  dismissed: boolean;
}

// ============================================================================
// EXECUTION CHECKPOINT
// ============================================================================

export type CheckpointType = 'morning' | 'midday' | 'evening' | 'bedtime';

export interface ExecutionCheckpoint {
  type: CheckpointType;
  time: string;
  completedTasks: number;
  pendingTasks: number;
  interventions: Intervention[];
  onTrack: boolean;
}

// ============================================================================
// UNIFIED EXECUTION INTELLIGENCE
// ============================================================================

export interface ExecutionIntelligence {
  userId: string;
  date: string;
  
  // Core execution
  plan: DailyExecutionPlan;
  events: ExecutionEvent[];
  
  // Adherence
  adherence: AdherenceSummary;
  assessments: AdherenceAssessment[];
  
  // Outcomes
  outcomes: OutcomeFeedback[];
  
  // Learning
  learning: LearningSignal;
  
  // Interventions
  interventions: Intervention[];
  checkpoints: ExecutionCheckpoint[];
  
  // Metadata
  lastUpdated: string;
  dataQuality: 'high' | 'medium' | 'low' | 'none';
}

// ============================================================================
// EXECUTION SCORING
// ============================================================================

export interface ExecutionScore {
  overall: number; // 0-100
  weighted: number; // 0-100 (priority-weighted)
  byDomain: Record<ExecutionDomain, number>;
  byPriority: Record<ExecutionPriority, number>;
  trend: 'improving' | 'stable' | 'declining';
}

// ============================================================================
// TASK COMPLETION REQUEST
// ============================================================================

export interface TaskCompletionRequest {
  taskId: string;
  status: ExecutionStatus;
  value?: number;
  notes?: string;
  source: ExecutionSource;
  timestamp: string;
}
