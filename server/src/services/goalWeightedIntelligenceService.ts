import { logger } from '../utils/logger';
import { getBaselineContext } from './baselineContextService';
import { getAdaptiveIntelligenceContext, type InterventionEffect, type AdaptiveSignal, type LearningSignal } from './adaptiveIntelligencePhase7Service';
import { getLongitudinalIntelligenceContext, type TrendAnalysis } from './longitudinalIntelligenceService';
import { getHealthIntelligenceFusionContext, type FusionSignal } from './healthIntelligenceFusionService';

/**
 * Goal-Weighted Intelligence Service - Phase 8
 * 
 * Purpose: Enable goal-driven adaptive prioritization and personalized optimization
 * - Aligns intelligence with user goals
 * - Prioritizes recommendations based on goal importance
 * - Weights adaptive intelligence by goal relevance
 * - Detects goal conflicts
 * - Tracks goal progress
 * - Enables personalized optimization
 * 
 * This is rule-based goal-weighted intelligence - no ML models
 */

// ============================================================================
// TYPES
// ============================================================================

export type GoalCategory = 
  | 'muscle_gain'
  | 'fat_loss'
  | 'metabolic_health'
  | 'cardiovascular_health'
  | 'hormonal_optimization'
  | 'recovery'
  | 'longevity'
  | 'performance';

export type GoalPriority = 'primary' | 'secondary' | 'tertiary';
export type GoalWeight = 1 | 2 | 3; // Tertiary=1, Secondary=2, Primary=3
export type GoalProgressStatus = 'improving' | 'stable' | 'declining' | 'insufficient_data';
export type ConflictSeverity = 'high' | 'moderate' | 'low';

export interface UserGoal {
  category: GoalCategory;
  priority: GoalPriority;
  weight: GoalWeight;
  description: string;
  source: 'baseline_profile' | 'inferred' | 'default';
}

export interface GoalWeights {
  muscle_gain: GoalWeight;
  fat_loss: GoalWeight;
  metabolic_health: GoalWeight;
  cardiovascular_health: GoalWeight;
  hormonal_optimization: GoalWeight;
  recovery: GoalWeight;
  longevity: GoalWeight;
  performance: GoalWeight;
}

export interface WeightedSignal {
  originalSignal: FusionSignal | AdaptiveSignal | LearningSignal;
  signalType: 'fusion' | 'adaptive' | 'learning';
  goalAlignment: GoalCategory[];
  baseScore: number;
  goalBoost: number;
  finalScore: number;
  priorityReason: string;
}

export interface GoalAlignedRecommendation {
  recommendationId: string;
  recommendationType: string;
  category: string;
  goalAlignment: GoalCategory[];
  baseScore: number;
  goalBoost: number;
  finalScore: number;
  priorityReason: string;
}

export interface GoalConflict {
  goal1: GoalCategory;
  goal2: GoalCategory;
  severity: ConflictSeverity;
  description: string;
  recommendation: string;
}

export interface GoalProgress {
  goal: GoalCategory;
  status: GoalProgressStatus;
  evidence: string[];
  metrics: {
    marker: string;
    trend: 'improving' | 'declining' | 'stable';
    changePercent: number | null;
  }[];
  confidence: 'high' | 'moderate' | 'low';
}

export interface PriorityAdjustment {
  itemId: string;
  itemType: 'signal' | 'recommendation' | 'intervention';
  originalPriority: number;
  adjustedPriority: number;
  adjustment: number;
  reason: string;
  goalCategories: GoalCategory[];
}

export interface GoalWeightedIntelligenceContext {
  userId: string;
  timestamp: string;
  
  // Goals
  goals: UserGoal[];
  goalWeights: GoalWeights;
  
  // Weighted signals
  weightedSignals: WeightedSignal[];
  
  // Goal-aligned recommendations
  goalAlignedRecommendations: GoalAlignedRecommendation[];
  
  // Goal conflicts
  goalConflicts: GoalConflict[];
  
  // Goal progress
  goalProgress: GoalProgress[];
  
  // Priority adjustments
  priorityAdjustments: PriorityAdjustment[];
  
  // Summary metrics
  totalGoals: number;
  primaryGoals: number;
  conflictCount: number;
  improvingGoals: number;
  
  // Data completeness
  dataCompleteness: {
    hasGoals: boolean;
    hasAdaptiveIntelligence: boolean;
    hasLongitudinalIntelligence: boolean;
    hasFusionIntelligence: boolean;
    completenessScore: number; // 0-100
  };
}

// ============================================================================
// GOAL LOADING AND WEIGHTING
// ============================================================================

/**
 * Load user goals from baseline profile
 */
async function loadUserGoals(userId: string): Promise<UserGoal[]> {
  const goals: UserGoal[] = [];
  
  try {
    const baselineContext = await getBaselineContext(userId);
    const { profile } = baselineContext;
    
    // Extract goals from baseline profile
    const parsedData = (profile as any).parsedData;
    
    if (parsedData?.overallHealthGoals) {
      const healthGoals = parsedData.overallHealthGoals;
      
      // Body fat goal → fat loss
      if (healthGoals.bodyFatGoal) {
        goals.push({
          category: 'fat_loss',
          priority: 'primary',
          weight: 3,
          description: `Body fat goal: ${healthGoals.bodyFatGoal}`,
          source: 'baseline_profile',
        });
      }
      
      // A1C goal → metabolic health
      if (healthGoals.a1cGoal) {
        goals.push({
          category: 'metabolic_health',
          priority: 'primary',
          weight: 3,
          description: `A1C goal: ${healthGoals.a1cGoal}`,
          source: 'baseline_profile',
        });
      }
      
      // Testosterone goal → hormonal optimization
      if (healthGoals.testosteroneGoal) {
        goals.push({
          category: 'hormonal_optimization',
          priority: 'primary',
          weight: 3,
          description: `Testosterone goal: ${healthGoals.testosteroneGoal}`,
          source: 'baseline_profile',
        });
      }
    }
    
    // Infer goals from training context
    if (parsedData?.trainingContext) {
      const trainingContext = parsedData.trainingContext;
      
      // If training frequently → muscle gain or performance
      if (trainingContext.trainingDaysPerWeek >= 4) {
        goals.push({
          category: 'muscle_gain',
          priority: 'secondary',
          weight: 2,
          description: 'Inferred from training frequency',
          source: 'inferred',
        });
      }
    }
    
    // Infer goals from conditions
    if (profile.diabetesStatus && profile.diabetesStatus !== 'none') {
      goals.push({
        category: 'metabolic_health',
        priority: 'primary',
        weight: 3,
        description: 'Inferred from diabetes status',
        source: 'inferred',
      });
    }
    
    // Infer cardiovascular health from age
    if (profile.age && profile.age >= 40) {
      goals.push({
        category: 'cardiovascular_health',
        priority: 'secondary',
        weight: 2,
        description: 'Inferred from age (cardiovascular health important)',
        source: 'inferred',
      });
      
      goals.push({
        category: 'longevity',
        priority: 'tertiary',
        weight: 1,
        description: 'Inferred from age (longevity focus)',
        source: 'inferred',
      });
    }
    
  } catch (error) {
    logger.error('[GOAL INTELLIGENCE] Error loading user goals', {
      userId,
      error: (error as Error).message,
    });
  }
  
  // If no goals found, use default balanced optimization
  if (goals.length === 0) {
    logger.info('[GOAL INTELLIGENCE] No goals found, using default balanced optimization', { userId });
    
    goals.push(
      {
        category: 'metabolic_health',
        priority: 'primary',
        weight: 3,
        description: 'Default: Metabolic health optimization',
        source: 'default',
      },
      {
        category: 'recovery',
        priority: 'secondary',
        weight: 2,
        description: 'Default: Recovery optimization',
        source: 'default',
      },
      {
        category: 'longevity',
        priority: 'tertiary',
        weight: 1,
        description: 'Default: Longevity focus',
        source: 'default',
      }
    );
  }
  
  return goals;
}

/**
 * Create goal weights from user goals
 */
function createGoalWeights(goals: UserGoal[]): GoalWeights {
  const weights: GoalWeights = {
    muscle_gain: 0 as GoalWeight,
    fat_loss: 0 as GoalWeight,
    metabolic_health: 0 as GoalWeight,
    cardiovascular_health: 0 as GoalWeight,
    hormonal_optimization: 0 as GoalWeight,
    recovery: 0 as GoalWeight,
    longevity: 0 as GoalWeight,
    performance: 0 as GoalWeight,
  };
  
  for (const goal of goals) {
    weights[goal.category] = Math.max(weights[goal.category], goal.weight) as GoalWeight;
  }
  
  return weights;
}

// ============================================================================
// GOAL-WEIGHTED SIGNALS
// ============================================================================

/**
 * Determine goal alignment for a signal
 */
function determineSignalGoalAlignment(signal: FusionSignal | AdaptiveSignal | LearningSignal): GoalCategory[] {
  const alignment: GoalCategory[] = [];
  const description = ('description' in signal ? signal.description : (signal as any).insight || '').toLowerCase();
  const title = ('title' in signal ? signal.title : '').toLowerCase();
  const text = `${title} ${description}`;
  
  // Muscle gain
  if (text.includes('lean mass') || text.includes('muscle') || text.includes('skeletal muscle')) {
    alignment.push('muscle_gain');
  }
  
  // Fat loss
  if (text.includes('body fat') || text.includes('weight') || text.includes('fat loss')) {
    alignment.push('fat_loss');
  }
  
  // Metabolic health
  if (text.includes('a1c') || text.includes('glucose') || text.includes('metabolic') || text.includes('triglyceride')) {
    alignment.push('metabolic_health');
  }
  
  // Cardiovascular health
  if (text.includes('ldl') || text.includes('hdl') || text.includes('cardiovascular') || text.includes('cholesterol')) {
    alignment.push('cardiovascular_health');
  }
  
  // Hormonal optimization
  if (text.includes('testosterone') || text.includes('hormone') || text.includes('hormonal')) {
    alignment.push('hormonal_optimization');
  }
  
  // Recovery
  if (text.includes('recovery') || text.includes('sleep') || text.includes('stress')) {
    alignment.push('recovery');
  }
  
  // Performance
  if (text.includes('performance') || text.includes('strength') || text.includes('endurance')) {
    alignment.push('performance');
  }
  
  return alignment;
}

/**
 * Calculate goal boost for a signal
 */
function calculateGoalBoost(goalAlignment: GoalCategory[], goalWeights: GoalWeights): number {
  if (goalAlignment.length === 0) {
    return 0;
  }
  
  // Get max weight from aligned goals
  const maxWeight = Math.max(...goalAlignment.map(goal => goalWeights[goal]));
  
  // Convert weight to boost
  // Primary (3) → +10 boost
  // Secondary (2) → +6 boost
  // Tertiary (1) → +3 boost
  const boostMap: Record<number, number> = {
    3: 10,
    2: 6,
    1: 3,
    0: 0,
  };
  
  return boostMap[maxWeight] || 0;
}

/**
 * Generate weighted signals from fusion, adaptive, and learning signals
 */
function generateWeightedSignals(
  fusionSignals: FusionSignal[],
  adaptiveSignals: AdaptiveSignal[],
  learningSignals: LearningSignal[],
  goalWeights: GoalWeights
): WeightedSignal[] {
  const weighted: WeightedSignal[] = [];
  
  // Weight fusion signals
  for (const signal of fusionSignals) {
    const goalAlignment = determineSignalGoalAlignment(signal);
    const baseScore = signal.severity === 'critical' ? 100 :
                     signal.severity === 'high' ? 75 :
                     signal.severity === 'moderate' ? 50 : 25;
    const goalBoost = calculateGoalBoost(goalAlignment, goalWeights);
    const finalScore = baseScore + goalBoost;
    
    weighted.push({
      originalSignal: signal,
      signalType: 'fusion',
      goalAlignment,
      baseScore,
      goalBoost,
      finalScore,
      priorityReason: goalBoost > 0 ? 
        `Prioritized because aligned with ${goalAlignment.join(', ')} goal(s)` :
        'No goal alignment',
    });
  }
  
  // Weight adaptive signals
  for (const signal of adaptiveSignals) {
    const goalAlignment = determineSignalGoalAlignment(signal);
    const baseScore = signal.type === 'intervention_effective' ? 70 :
                     signal.type === 'intervention_ineffective' ? 80 : 50;
    const goalBoost = calculateGoalBoost(goalAlignment, goalWeights);
    const finalScore = baseScore + goalBoost;
    
    weighted.push({
      originalSignal: signal,
      signalType: 'adaptive',
      goalAlignment,
      baseScore,
      goalBoost,
      finalScore,
      priorityReason: goalBoost > 0 ?
        `Prioritized because aligned with ${goalAlignment.join(', ')} goal(s)` :
        'No goal alignment',
    });
  }
  
  // Weight learning signals
  for (const signal of learningSignals) {
    const goalAlignment = determineSignalGoalAlignment(signal);
    const baseScore = 60;
    const goalBoost = calculateGoalBoost(goalAlignment, goalWeights);
    const finalScore = baseScore + goalBoost;
    
    weighted.push({
      originalSignal: signal,
      signalType: 'learning',
      goalAlignment,
      baseScore,
      goalBoost,
      finalScore,
      priorityReason: goalBoost > 0 ?
        `Prioritized because aligned with ${goalAlignment.join(', ')} goal(s)` :
        'No goal alignment',
    });
  }
  
  return weighted.sort((a, b) => b.finalScore - a.finalScore);
}

// ============================================================================
// GOAL CONFLICT DETECTION
// ============================================================================

/**
 * Detect conflicts between user goals
 */
function detectGoalConflicts(goals: UserGoal[]): GoalConflict[] {
  const conflicts: GoalConflict[] = [];
  
  // Check for muscle gain + aggressive fat loss conflict
  const hasMuscleGain = goals.some(g => g.category === 'muscle_gain' && g.priority === 'primary');
  const hasFatLoss = goals.some(g => g.category === 'fat_loss' && g.priority === 'primary');
  
  if (hasMuscleGain && hasFatLoss) {
    conflicts.push({
      goal1: 'muscle_gain',
      goal2: 'fat_loss',
      severity: 'moderate',
      description: 'Building muscle and aggressive fat loss are competing goals',
      recommendation: 'Consider body recomposition approach: moderate calorie deficit with high protein and progressive overload training',
    });
  }
  
  // Check for performance + recovery conflict
  const hasPerformance = goals.some(g => g.category === 'performance' && g.priority === 'primary');
  const hasRecovery = goals.some(g => g.category === 'recovery' && g.priority === 'primary');
  
  if (hasPerformance && hasRecovery) {
    conflicts.push({
      goal1: 'performance',
      goal2: 'recovery',
      severity: 'low',
      description: 'High performance training requires adequate recovery',
      recommendation: 'Balance training intensity with recovery protocols. Prioritize sleep and nutrition.',
    });
  }
  
  return conflicts;
}

// ============================================================================
// GOAL PROGRESS TRACKING
// ============================================================================

/**
 * Track progress toward user goals using longitudinal intelligence
 */
async function trackGoalProgress(
  userId: string,
  goals: UserGoal[],
  longitudinalContext: Awaited<ReturnType<typeof getLongitudinalIntelligenceContext>>
): Promise<GoalProgress[]> {
  const progress: GoalProgress[] = [];
  
  for (const goal of goals) {
    const goalProgress: GoalProgress = {
      goal: goal.category,
      status: 'insufficient_data',
      evidence: [],
      metrics: [],
      confidence: 'low',
    };
    
    // Muscle gain progress
    if (goal.category === 'muscle_gain') {
      const leanMassTrend = longitudinalContext.bodyCompositionTrends.find(
        t => t.marker.toLowerCase().includes('lean mass')
      );
      
      if (leanMassTrend) {
        goalProgress.status = leanMassTrend.direction === 'improving' ? 'improving' :
                             leanMassTrend.direction === 'declining' ? 'declining' : 'stable';
        goalProgress.evidence.push(leanMassTrend.summary);
        goalProgress.metrics.push({
          marker: 'Lean Mass',
          trend: leanMassTrend.direction as any,
          changePercent: leanMassTrend.changePercent,
        });
        goalProgress.confidence = leanMassTrend.confidence as any;
      }
    }
    
    // Fat loss progress
    if (goal.category === 'fat_loss') {
      const bodyFatTrend = longitudinalContext.bodyCompositionTrends.find(
        t => t.marker.toLowerCase().includes('body fat')
      );
      
      if (bodyFatTrend) {
        goalProgress.status = bodyFatTrend.direction === 'improving' ? 'improving' :
                             bodyFatTrend.direction === 'declining' ? 'declining' : 'stable';
        goalProgress.evidence.push(bodyFatTrend.summary);
        goalProgress.metrics.push({
          marker: 'Body Fat %',
          trend: bodyFatTrend.direction as any,
          changePercent: bodyFatTrend.changePercent,
        });
        goalProgress.confidence = bodyFatTrend.confidence as any;
      }
    }
    
    // Metabolic health progress
    if (goal.category === 'metabolic_health') {
      const a1cTrend = longitudinalContext.bloodworkTrends.find(
        t => t.marker.toLowerCase().includes('a1c')
      );
      
      if (a1cTrend) {
        goalProgress.status = a1cTrend.direction === 'improving' ? 'improving' :
                             a1cTrend.direction === 'declining' ? 'declining' : 'stable';
        goalProgress.evidence.push(a1cTrend.summary);
        goalProgress.metrics.push({
          marker: 'A1C',
          trend: a1cTrend.direction as any,
          changePercent: a1cTrend.changePercent,
        });
        goalProgress.confidence = a1cTrend.confidence as any;
      }
    }
    
    // Cardiovascular health progress
    if (goal.category === 'cardiovascular_health') {
      const ldlTrend = longitudinalContext.bloodworkTrends.find(
        t => t.marker.toLowerCase().includes('ldl')
      );
      const hdlTrend = longitudinalContext.bloodworkTrends.find(
        t => t.marker.toLowerCase().includes('hdl')
      );
      
      if (ldlTrend) {
        goalProgress.status = ldlTrend.direction === 'improving' ? 'improving' :
                             ldlTrend.direction === 'declining' ? 'declining' : 'stable';
        goalProgress.evidence.push(ldlTrend.summary);
        goalProgress.metrics.push({
          marker: 'LDL',
          trend: ldlTrend.direction as any,
          changePercent: ldlTrend.changePercent,
        });
        goalProgress.confidence = ldlTrend.confidence as any;
      }
      
      if (hdlTrend) {
        goalProgress.evidence.push(hdlTrend.summary);
        goalProgress.metrics.push({
          marker: 'HDL',
          trend: hdlTrend.direction as any,
          changePercent: hdlTrend.changePercent,
        });
      }
    }
    
    // Hormonal optimization progress
    if (goal.category === 'hormonal_optimization') {
      const testosteroneTrend = longitudinalContext.bloodworkTrends.find(
        t => t.marker.toLowerCase().includes('testosterone')
      );
      
      if (testosteroneTrend) {
        goalProgress.status = testosteroneTrend.direction === 'improving' ? 'improving' :
                             testosteroneTrend.direction === 'declining' ? 'declining' : 'stable';
        goalProgress.evidence.push(testosteroneTrend.summary);
        goalProgress.metrics.push({
          marker: 'Testosterone',
          trend: testosteroneTrend.direction as any,
          changePercent: testosteroneTrend.changePercent,
        });
        goalProgress.confidence = testosteroneTrend.confidence as any;
      }
    }
    
    if (goalProgress.evidence.length > 0) {
      progress.push(goalProgress);
    }
  }
  
  return progress;
}

// ============================================================================
// MAIN GOAL-WEIGHTED INTELLIGENCE FUNCTION
// ============================================================================

/**
 * Get goal-weighted intelligence context for a user
 */
export async function getGoalWeightedIntelligenceContext(
  userId: string
): Promise<GoalWeightedIntelligenceContext> {
  try {
    logger.info('🔵 [GOAL INTELLIGENCE] Starting goal-weighted intelligence analysis', { userId });
    
    // Load user goals
    const goals = await loadUserGoals(userId);
    const goalWeights = createGoalWeights(goals);
    
    logger.info('✅ [GOAL INTELLIGENCE] Goals loaded', {
      userId,
      totalGoals: goals.length,
      primaryGoals: goals.filter(g => g.priority === 'primary').length,
      goalCategories: goals.map(g => g.category),
    });
    
    // Load intelligence contexts
    const [fusionContext, adaptiveContext, longitudinalContext] = await Promise.all([
      getHealthIntelligenceFusionContext(userId),
      getAdaptiveIntelligenceContext(userId),
      getLongitudinalIntelligenceContext(userId),
    ]);
    
    logger.info('✅ [GOAL INTELLIGENCE] Intelligence contexts loaded', {
      userId,
      fusionSignals: fusionContext.fusionSignals.length,
      adaptiveSignals: adaptiveContext.adaptiveSignals.length,
      learningSignals: adaptiveContext.learningSignals.length,
    });
    
    // Generate weighted signals
    const weightedSignals = generateWeightedSignals(
      fusionContext.fusionSignals,
      adaptiveContext.adaptiveSignals,
      adaptiveContext.learningSignals,
      goalWeights
    );
    
    logger.info('✅ [GOAL INTELLIGENCE] Goal weighting applied', {
      userId,
      weightedSignals: weightedSignals.length,
      avgGoalBoost: weightedSignals.reduce((sum, s) => sum + s.goalBoost, 0) / weightedSignals.length,
    });
    
    // Detect goal conflicts
    const goalConflicts = detectGoalConflicts(goals);
    
    // Track goal progress
    const goalProgress = await trackGoalProgress(userId, goals, longitudinalContext);
    
    logger.info('✅ [GOAL INTELLIGENCE] Goal progress tracked', {
      userId,
      progressCount: goalProgress.length,
      improvingGoals: goalProgress.filter(p => p.status === 'improving').length,
    });
    
    // Calculate priority adjustments
    const priorityAdjustments: PriorityAdjustment[] = weightedSignals
      .filter(s => s.goalBoost > 0)
      .map(s => ({
        itemId: (s.originalSignal as any).id,
        itemType: 'signal' as const,
        originalPriority: s.baseScore,
        adjustedPriority: s.finalScore,
        adjustment: s.goalBoost,
        reason: s.priorityReason,
        goalCategories: s.goalAlignment,
      }));
    
    // Calculate data completeness
    const hasGoals = goals.length > 0;
    const hasAdaptiveIntelligence = adaptiveContext.totalInterventions > 0;
    const hasLongitudinalIntelligence = longitudinalContext.totalTrends > 0;
    const hasFusionIntelligence = fusionContext.fusionSignals.length > 0;
    
    let completenessScore = 0;
    if (hasGoals) completenessScore += 25;
    if (hasAdaptiveIntelligence) completenessScore += 25;
    if (hasLongitudinalIntelligence) completenessScore += 25;
    if (hasFusionIntelligence) completenessScore += 25;
    
    const context: GoalWeightedIntelligenceContext = {
      userId,
      timestamp: new Date().toISOString(),
      goals,
      goalWeights,
      weightedSignals,
      goalAlignedRecommendations: [], // Placeholder for future implementation
      goalConflicts,
      goalProgress,
      priorityAdjustments,
      totalGoals: goals.length,
      primaryGoals: goals.filter(g => g.priority === 'primary').length,
      conflictCount: goalConflicts.length,
      improvingGoals: goalProgress.filter(p => p.status === 'improving').length,
      dataCompleteness: {
        hasGoals,
        hasAdaptiveIntelligence,
        hasLongitudinalIntelligence,
        hasFusionIntelligence,
        completenessScore,
      },
    };
    
    logger.info('✅ [GOAL INTELLIGENCE] Goal-weighted intelligence analysis complete', {
      userId,
      totalGoals: goals.length,
      primaryGoals: context.primaryGoals,
      weightedSignals: weightedSignals.length,
      goalConflicts: goalConflicts.length,
      improvingGoals: context.improvingGoals,
      completenessScore,
    });
    
    return context;
  } catch (error) {
    logger.error('❌ [GOAL INTELLIGENCE] Failed to generate goal-weighted intelligence', {
      userId,
      error: (error as Error).message,
    });
    
    // Fallback: return empty context
    return {
      userId,
      timestamp: new Date().toISOString(),
      goals: [],
      goalWeights: {
        muscle_gain: 0 as GoalWeight,
        fat_loss: 0 as GoalWeight,
        metabolic_health: 0 as GoalWeight,
        cardiovascular_health: 0 as GoalWeight,
        hormonal_optimization: 0 as GoalWeight,
        recovery: 0 as GoalWeight,
        longevity: 0 as GoalWeight,
        performance: 0 as GoalWeight,
      },
      weightedSignals: [],
      goalAlignedRecommendations: [],
      goalConflicts: [],
      goalProgress: [],
      priorityAdjustments: [],
      totalGoals: 0,
      primaryGoals: 0,
      conflictCount: 0,
      improvingGoals: 0,
      dataCompleteness: {
        hasGoals: false,
        hasAdaptiveIntelligence: false,
        hasLongitudinalIntelligence: false,
        hasFusionIntelligence: false,
        completenessScore: 0,
      },
    };
  }
}

/**
 * Get top goal-aligned priorities
 */
export async function getTopGoalAlignedPriorities(userId: string, limit: number = 3): Promise<WeightedSignal[]> {
  const context = await getGoalWeightedIntelligenceContext(userId);
  return context.weightedSignals.slice(0, limit);
}

/**
 * Get goal progress summary
 */
export async function getGoalProgressSummary(userId: string): Promise<GoalProgress[]> {
  const context = await getGoalWeightedIntelligenceContext(userId);
  return context.goalProgress;
}

/**
 * Get goal conflicts
 */
export async function getGoalConflicts(userId: string): Promise<GoalConflict[]> {
  const context = await getGoalWeightedIntelligenceContext(userId);
  return context.goalConflicts;
}
