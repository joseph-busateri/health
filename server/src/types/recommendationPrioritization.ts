export interface PrioritizationInput {
  recovery?: any;
  stress?: any;
  joint?: any;
  crossEngine?: any;
  predictive?: any;
}

export type PriorityLevel = 'critical' | 'important' | 'optimization';

export interface PrioritizedRecommendation {
  id: string;
  source: string;
  priority: PriorityLevel;
  summary: string;
  rationale?: string;
  actions: string[];
  score: number;
  sourceEngine?: string;
  createdAt?: string;
}

export interface PrioritizationResult {
  topPriorities: PrioritizedRecommendation[];
  allRecommendations: PrioritizedRecommendation[];
  userId: string;
  date: string;
  createdAt: string;
}

export interface ScoringFactors {
  priorityScore: number;
  crossEngineBoost: number;
  multiEngineAlignment: number;
  recencyBoost: number;
  riskAmplification: number;
  totalScore: number;
}
