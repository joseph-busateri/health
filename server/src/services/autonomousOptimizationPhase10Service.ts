import { logger } from '../utils/logger';
import { getPredictiveIntelligenceContext, type RiskPrediction, type PlateauPrediction, type DeclinePrediction, type GoalPrediction } from './predictiveIntelligencePhase9Service';
import { getGoalWeightedIntelligenceContext, type UserGoal } from './goalWeightedIntelligenceService';
import { getAdaptiveIntelligenceContext, type InterventionEffect } from './adaptiveIntelligencePhase7Service';
import { getHealthIntelligenceFusionContext, type FusionSignal } from './healthIntelligenceFusionService';
import { getDeviceOptimizationTriggers } from './deviceIntelligenceIntegrationService';

/**
 * Autonomous Optimization Service - Phase 10
 * 
 * Purpose: Enable autonomous optimization intelligence that converts predictions into actions
 * - Converts predictions into actionable recommendations
 * - Automatically adjusts recommendations based on intelligence
 * - Continuously optimizes user strategy
 * - Prioritizes interventions
 * - Evolves recommendations dynamically
 * 
 * This is autonomous optimization intelligence - not automated execution
 * Automates optimization intelligence, not actions
 */

// ============================================================================
// TYPES
// ============================================================================

export type OptimizationType = 'nutrition' | 'workout' | 'supplement' | 'recovery' | 'lifestyle';
export type OptimizationPriority = 'critical' | 'high' | 'moderate' | 'low';
export type OptimizationConfidence = 'high' | 'moderate' | 'low';
export type OptimizationTrigger = 'predicted_risk' | 'plateau_detected' | 'goal_behind_schedule' | 'intervention_ineffective' | 'opportunity_detected';

export interface OptimizationRecommendation {
  id: string;
  type: OptimizationType;
  trigger: OptimizationTrigger;
  triggerSource: string;
  recommendation: string;
  actions: string[];
  rationale: string;
  priority: OptimizationPriority;
  confidence: OptimizationConfidence;
  expectedImpact: string;
  timeframe: string;
}

export interface AutonomousAdjustment {
  id: string;
  category: string;
  currentApproach: string;
  suggestedAdjustment: string;
  reason: string;
  priority: OptimizationPriority;
  confidence: OptimizationConfidence;
}

export interface OptimizationPriorityItem {
  rank: number;
  optimization: OptimizationRecommendation;
  priorityScore: number;
  priorityFactors: {
    predictionSeverity: number;
    goalImportance: number;
    adaptiveConfidence: number;
    dataQuality: number;
  };
}

export interface AutonomousOptimizationContext {
  userId: string;
  timestamp: string;
  
  // Optimization recommendations
  optimizationRecommendations: OptimizationRecommendation[];
  
  // Autonomous adjustments
  autonomousAdjustments: AutonomousAdjustment[];
  
  // Optimization priorities
  optimizationPriorities: OptimizationPriorityItem[];
  
  // Optimization confidence
  optimizationConfidence: {
    overall: OptimizationConfidence;
    nutrition: OptimizationConfidence;
    workout: OptimizationConfidence;
    supplement: OptimizationConfidence;
    recovery: OptimizationConfidence;
  };
  
  // Optimization rationale
  optimizationRationale: {
    topTriggers: string[];
    primaryGoals: string[];
    keyInsights: string[];
  };
  
  // Summary metrics
  totalOptimizations: number;
  criticalOptimizations: number;
  highPriorityOptimizations: number;
  topOptimizations: OptimizationRecommendation[];
  
  // Data completeness
  dataCompleteness: {
    hasPredictiveData: boolean;
    hasGoalData: boolean;
    hasAdaptiveData: boolean;
    hasFusionData: boolean;
    completenessScore: number; // 0-100
  };
}

// ============================================================================
// NUTRITION OPTIMIZATION
// ============================================================================

/**
 * Generate nutrition optimizations based on predictions and goals
 */
function generateNutritionOptimizations(
  risks: RiskPrediction[],
  plateaus: PlateauPrediction[],
  declines: DeclinePrediction[],
  goals: UserGoal[],
  interventionEffects: InterventionEffect[]
): OptimizationRecommendation[] {
  const optimizations: OptimizationRecommendation[] = [];
  
  // Metabolic risk → Nutrition optimization
  const metabolicRisk = risks.find(r => r.riskType === 'metabolic');
  if (metabolicRisk) {
    optimizations.push({
      id: `opt-nutrition-metabolic-${Date.now()}`,
      type: 'nutrition',
      trigger: 'predicted_risk',
      triggerSource: `Metabolic risk: ${metabolicRisk.description}`,
      recommendation: 'Optimize nutrition for metabolic health',
      actions: [
        'Reduce refined carbohydrate intake',
        'Increase fiber intake (vegetables, legumes)',
        'Add 10-15 minute walk after meals',
        'Consider intermittent fasting (consult provider)',
      ],
      rationale: `Predicted metabolic risk detected. Nutrition optimization can reverse trajectory before risk becomes critical.`,
      priority: metabolicRisk.riskLevel === 'high' ? 'critical' : 'high',
      confidence: metabolicRisk.confidence as OptimizationConfidence,
      expectedImpact: 'Improve glucose control, reduce A1C trajectory',
      timeframe: '30-90 days',
    });
  }
  
  // Lean mass plateau → Nutrition optimization
  const leanMassPlateau = plateaus.find(p => 
    p.metric.toLowerCase().includes('lean') || p.metric.toLowerCase().includes('muscle')
  );
  if (leanMassPlateau && leanMassPlateau.status === 'plateau') {
    optimizations.push({
      id: `opt-nutrition-leanmass-${Date.now()}`,
      type: 'nutrition',
      trigger: 'plateau_detected',
      triggerSource: `Lean mass plateau: ${leanMassPlateau.description}`,
      recommendation: 'Increase protein and calories for muscle growth',
      actions: [
        'Increase protein intake to 1.0-1.2g per lb bodyweight',
        'Add 200-300 calorie surplus',
        'Ensure protein at each meal',
        'Consider creatine supplementation',
      ],
      rationale: `Lean mass has plateaued. Nutrition adjustment needed to support continued muscle growth.`,
      priority: 'moderate',
      confidence: 'moderate',
      expectedImpact: 'Resume lean mass gains',
      timeframe: '60-90 days',
    });
  }
  
  // Fat loss goal → Nutrition optimization
  const fatLossGoal = goals.find(g => g.category === 'fat_loss');
  if (fatLossGoal && fatLossGoal.priority === 'primary') {
    optimizations.push({
      id: `opt-nutrition-fatloss-${Date.now()}`,
      type: 'nutrition',
      trigger: 'opportunity_detected',
      triggerSource: `Primary goal: Fat loss`,
      recommendation: 'Optimize nutrition for fat loss',
      actions: [
        'Maintain moderate calorie deficit (300-500 cal)',
        'Prioritize protein (1.0g per lb bodyweight)',
        'Increase vegetable intake for satiety',
        'Track calories consistently',
      ],
      rationale: `Fat loss is primary goal. Nutrition optimization is highest leverage intervention.`,
      priority: 'high',
      confidence: 'high',
      expectedImpact: 'Achieve fat loss goal while preserving lean mass',
      timeframe: '90+ days',
    });
  }
  
  return optimizations;
}

// ============================================================================
// WORKOUT OPTIMIZATION
// ============================================================================

/**
 * Generate workout optimizations based on predictions and goals
 */
function generateWorkoutOptimizations(
  plateaus: PlateauPrediction[],
  declines: DeclinePrediction[],
  goals: UserGoal[],
  interventionEffects: InterventionEffect[]
): OptimizationRecommendation[] {
  const optimizations: OptimizationRecommendation[] = [];
  
  // Lean mass plateau → Workout optimization
  const leanMassPlateau = plateaus.find(p => 
    p.metric.toLowerCase().includes('lean') || p.metric.toLowerCase().includes('muscle')
  );
  if (leanMassPlateau && leanMassPlateau.status === 'plateau') {
    optimizations.push({
      id: `opt-workout-leanmass-${Date.now()}`,
      type: 'workout',
      trigger: 'plateau_detected',
      triggerSource: `Lean mass plateau: ${leanMassPlateau.description}`,
      recommendation: 'Increase training volume and progressive overload',
      actions: [
        'Add 1-2 sets per exercise',
        'Increase weight by 2.5-5% when hitting rep targets',
        'Add training frequency (e.g., 3x/week → 4x/week)',
        'Vary rep ranges (6-8, 8-12, 12-15)',
      ],
      rationale: `Lean mass has plateaued. Training stimulus needs to increase to drive continued adaptation.`,
      priority: 'high',
      confidence: 'high',
      expectedImpact: 'Resume lean mass gains',
      timeframe: '60-90 days',
    });
  }
  
  // Recovery decline → Workout optimization
  const recoveryDecline = declines.find(d => 
    d.metric.toLowerCase().includes('recovery') || d.category === 'recovery'
  );
  if (recoveryDecline && recoveryDecline.status !== 'none') {
    optimizations.push({
      id: `opt-workout-recovery-${Date.now()}`,
      type: 'workout',
      trigger: 'predicted_risk',
      triggerSource: `Recovery declining: ${recoveryDecline.description}`,
      recommendation: 'Reduce training volume to improve recovery',
      actions: [
        'Reduce sets by 20-30%',
        'Add additional rest day',
        'Reduce training to failure',
        'Focus on technique over intensity',
      ],
      rationale: `Recovery is declining. Training volume reduction needed to prevent overtraining and injury.`,
      priority: recoveryDecline.status === 'severe' ? 'critical' : 'high',
      confidence: 'moderate',
      expectedImpact: 'Restore recovery capacity, prevent injury',
      timeframe: '14-30 days',
    });
  }
  
  // Muscle gain goal → Workout optimization
  const muscleGainGoal = goals.find(g => g.category === 'muscle_gain');
  if (muscleGainGoal && muscleGainGoal.priority === 'primary') {
    optimizations.push({
      id: `opt-workout-musclegain-${Date.now()}`,
      type: 'workout',
      trigger: 'opportunity_detected',
      triggerSource: `Primary goal: Muscle gain`,
      recommendation: 'Optimize training for hypertrophy',
      actions: [
        'Train each muscle group 2-3x per week',
        'Focus on compound movements (squat, deadlift, bench, row)',
        'Use 8-12 rep range for most sets',
        'Progressive overload every 1-2 weeks',
      ],
      rationale: `Muscle gain is primary goal. Training optimization is critical for goal achievement.`,
      priority: 'high',
      confidence: 'high',
      expectedImpact: 'Maximize muscle growth rate',
      timeframe: '90+ days',
    });
  }
  
  return optimizations;
}

// ============================================================================
// SUPPLEMENT OPTIMIZATION
// ============================================================================

/**
 * Generate supplement optimizations based on predictions and interventions
 */
function generateSupplementOptimizations(
  risks: RiskPrediction[],
  declines: DeclinePrediction[],
  interventionEffects: InterventionEffect[]
): OptimizationRecommendation[] {
  const optimizations: OptimizationRecommendation[] = [];
  
  // Vitamin D ineffective → Supplement optimization
  const vitaminDIneffective = interventionEffects.find(e => 
    e.interventionType.toLowerCase().includes('vitamin d') && e.effectiveness === 'ineffective'
  );
  if (vitaminDIneffective) {
    optimizations.push({
      id: `opt-supplement-vitamind-${Date.now()}`,
      type: 'supplement',
      trigger: 'intervention_ineffective',
      triggerSource: `Vitamin D supplementation ineffective`,
      recommendation: 'Adjust Vitamin D supplementation strategy',
      actions: [
        'Increase dose (e.g., 2000 IU → 5000 IU)',
        'Take with fatty meal for absorption',
        'Check for D3 form (not D2)',
        'Consider retest in 60-90 days',
      ],
      rationale: `Current Vitamin D supplementation not producing expected results. Dose or timing adjustment needed.`,
      priority: 'moderate',
      confidence: 'moderate',
      expectedImpact: 'Improve Vitamin D levels',
      timeframe: '60-90 days',
    });
  }
  
  // Recovery declining → Supplement optimization
  const recoveryDecline = declines.find(d => 
    d.metric.toLowerCase().includes('recovery') || d.category === 'recovery'
  );
  if (recoveryDecline && recoveryDecline.status !== 'none') {
    optimizations.push({
      id: `opt-supplement-recovery-${Date.now()}`,
      type: 'supplement',
      trigger: 'predicted_risk',
      triggerSource: `Recovery declining: ${recoveryDecline.description}`,
      recommendation: 'Add recovery-supporting supplements',
      actions: [
        'Add magnesium glycinate (400mg before bed)',
        'Add omega-3 (2-3g EPA/DHA daily)',
        'Consider ashwagandha for stress/cortisol',
        'Ensure adequate protein intake',
      ],
      rationale: `Recovery is declining. Supplement support can improve sleep quality and reduce inflammation.`,
      priority: 'moderate',
      confidence: 'moderate',
      expectedImpact: 'Improve recovery capacity',
      timeframe: '30-60 days',
    });
  }
  
  // Cardiovascular risk → Supplement optimization
  const cardiovascularRisk = risks.find(r => r.riskType === 'cardiovascular');
  if (cardiovascularRisk) {
    optimizations.push({
      id: `opt-supplement-cardiovascular-${Date.now()}`,
      type: 'supplement',
      trigger: 'predicted_risk',
      triggerSource: `Cardiovascular risk: ${cardiovascularRisk.description}`,
      recommendation: 'Add cardiovascular-supporting supplements',
      actions: [
        'Add omega-3 (2-3g EPA/DHA daily)',
        'Consider CoQ10 (100-200mg daily)',
        'Add fiber supplement if dietary fiber low',
        'Consult provider about niacin or plant sterols',
      ],
      rationale: `Predicted cardiovascular risk detected. Supplement support can help improve lipid profile.`,
      priority: cardiovascularRisk.riskLevel === 'high' ? 'high' : 'moderate',
      confidence: cardiovascularRisk.confidence as OptimizationConfidence,
      expectedImpact: 'Improve lipid profile, reduce cardiovascular risk',
      timeframe: '60-90 days',
    });
  }
  
  return optimizations;
}

// ============================================================================
// RECOVERY OPTIMIZATION
// ============================================================================

/**
 * Generate recovery optimizations based on predictions
 */
function generateRecoveryOptimizations(
  declines: DeclinePrediction[],
  goals: UserGoal[]
): OptimizationRecommendation[] {
  const optimizations: OptimizationRecommendation[] = [];
  
  // Sleep declining → Recovery optimization
  const sleepDecline = declines.find(d => 
    d.metric.toLowerCase().includes('sleep')
  );
  if (sleepDecline && sleepDecline.status !== 'none') {
    optimizations.push({
      id: `opt-recovery-sleep-${Date.now()}`,
      type: 'recovery',
      trigger: 'predicted_risk',
      triggerSource: `Sleep declining: ${sleepDecline.description}`,
      recommendation: 'Optimize sleep quality and duration',
      actions: [
        'Set consistent sleep schedule (same bedtime)',
        'Aim for 7-9 hours sleep',
        'Reduce late-night training (finish 3+ hours before bed)',
        'Limit screen time 1 hour before bed',
        'Keep bedroom cool (65-68°F)',
      ],
      rationale: `Sleep is declining. Sleep optimization is critical for recovery, performance, and health.`,
      priority: sleepDecline.status === 'severe' ? 'critical' : 'high',
      confidence: 'high',
      expectedImpact: 'Improve recovery, energy, performance',
      timeframe: '14-30 days',
    });
  }
  
  // Recovery goal → Recovery optimization
  const recoveryGoal = goals.find(g => g.category === 'recovery');
  if (recoveryGoal && recoveryGoal.priority === 'primary') {
    optimizations.push({
      id: `opt-recovery-general-${Date.now()}`,
      type: 'recovery',
      trigger: 'opportunity_detected',
      triggerSource: `Primary goal: Recovery`,
      recommendation: 'Comprehensive recovery optimization',
      actions: [
        'Prioritize 7-9 hours sleep',
        'Add stress management practices (meditation, breathing)',
        'Ensure adequate nutrition (calories, protein)',
        'Consider active recovery (walking, yoga)',
        'Monitor training volume',
      ],
      rationale: `Recovery is primary goal. Multi-faceted approach needed for optimal recovery.`,
      priority: 'high',
      confidence: 'high',
      expectedImpact: 'Maximize recovery capacity',
      timeframe: '30-90 days',
    });
  }
  
  return optimizations;
}

// ============================================================================
// LIFESTYLE OPTIMIZATION
// ============================================================================

/**
 * Generate lifestyle optimizations based on predictions and goals
 */
function generateLifestyleOptimizations(
  risks: RiskPrediction[],
  goals: UserGoal[]
): OptimizationRecommendation[] {
  const optimizations: OptimizationRecommendation[] = [];
  
  // Metabolic risk → Lifestyle optimization
  const metabolicRisk = risks.find(r => r.riskType === 'metabolic');
  if (metabolicRisk) {
    optimizations.push({
      id: `opt-lifestyle-metabolic-${Date.now()}`,
      type: 'lifestyle',
      trigger: 'predicted_risk',
      triggerSource: `Metabolic risk: ${metabolicRisk.description}`,
      recommendation: 'Add daily movement for metabolic health',
      actions: [
        'Add 10-15 minute walk after meals',
        'Increase daily step count (target 8000-10000 steps)',
        'Take stairs instead of elevator',
        'Stand/move every hour during work',
      ],
      rationale: `Predicted metabolic risk detected. Increased daily movement can significantly improve glucose control.`,
      priority: metabolicRisk.riskLevel === 'high' ? 'high' : 'moderate',
      confidence: metabolicRisk.confidence as OptimizationConfidence,
      expectedImpact: 'Improve glucose control, insulin sensitivity',
      timeframe: '30-60 days',
    });
  }
  
  // Longevity goal → Lifestyle optimization
  const longevityGoal = goals.find(g => g.category === 'longevity');
  if (longevityGoal) {
    optimizations.push({
      id: `opt-lifestyle-longevity-${Date.now()}`,
      type: 'lifestyle',
      trigger: 'opportunity_detected',
      triggerSource: `Goal: Longevity`,
      recommendation: 'Optimize lifestyle for longevity',
      actions: [
        'Prioritize sleep (7-9 hours)',
        'Manage stress (meditation, social connection)',
        'Maintain healthy body composition',
        'Regular health screenings',
        'Avoid smoking, limit alcohol',
      ],
      rationale: `Longevity is a goal. Lifestyle optimization is foundation for long-term health.`,
      priority: 'moderate',
      confidence: 'high',
      expectedImpact: 'Maximize healthspan and longevity',
      timeframe: 'Ongoing',
    });
  }
  
  return optimizations;
}

// ============================================================================
// AUTONOMOUS ADJUSTMENTS
// ============================================================================

/**
 * Generate autonomous adjustments based on intelligence
 */
function generateAutonomousAdjustments(
  optimizations: OptimizationRecommendation[]
): AutonomousAdjustment[] {
  const adjustments: AutonomousAdjustment[] = [];
  
  // Convert optimizations to adjustments
  for (const opt of optimizations) {
    adjustments.push({
      id: `adj-${opt.id}`,
      category: opt.type,
      currentApproach: 'Current strategy',
      suggestedAdjustment: opt.recommendation,
      reason: opt.rationale,
      priority: opt.priority,
      confidence: opt.confidence,
    });
  }
  
  return adjustments;
}

// ============================================================================
// OPTIMIZATION CONFIDENCE
// ============================================================================

/**
 * Calculate optimization confidence
 */
function calculateOptimizationConfidence(
  optimizations: OptimizationRecommendation[]
): {
  overall: OptimizationConfidence;
  nutrition: OptimizationConfidence;
  workout: OptimizationConfidence;
  supplement: OptimizationConfidence;
  recovery: OptimizationConfidence;
} {
  const nutritionOpts = optimizations.filter(o => o.type === 'nutrition');
  const workoutOpts = optimizations.filter(o => o.type === 'workout');
  const supplementOpts = optimizations.filter(o => o.type === 'supplement');
  const recoveryOpts = optimizations.filter(o => o.type === 'recovery');
  
  const getConfidence = (opts: OptimizationRecommendation[]): OptimizationConfidence => {
    if (opts.length === 0) return 'low';
    const highCount = opts.filter(o => o.confidence === 'high').length;
    const moderateCount = opts.filter(o => o.confidence === 'moderate').length;
    
    if (highCount / opts.length > 0.5) return 'high';
    if ((highCount + moderateCount) / opts.length > 0.5) return 'moderate';
    return 'low';
  };
  
  const nutrition = getConfidence(nutritionOpts);
  const workout = getConfidence(workoutOpts);
  const supplement = getConfidence(supplementOpts);
  const recovery = getConfidence(recoveryOpts);
  
  const allConfidences = [nutrition, workout, supplement, recovery];
  const highCount = allConfidences.filter(c => c === 'high').length;
  const moderateCount = allConfidences.filter(c => c === 'moderate').length;
  
  const overall = highCount >= 2 ? 'high' : (highCount + moderateCount) >= 2 ? 'moderate' : 'low';
  
  return { overall, nutrition, workout, supplement, recovery };
}

// ============================================================================
// PRIORITY RANKING
// ============================================================================

/**
 * Calculate priority score for optimization
 */
function calculatePriorityScore(
  optimization: OptimizationRecommendation,
  goals: UserGoal[],
  predictiveConfidence: string
): { score: number; factors: any } {
  // Prediction severity (0-40 points)
  const severityScore = 
    optimization.priority === 'critical' ? 40 :
    optimization.priority === 'high' ? 30 :
    optimization.priority === 'moderate' ? 20 : 10;
  
  // Goal importance (0-30 points)
  const relatedGoal = goals.find(g => {
    if (optimization.type === 'nutrition' && (g.category === 'fat_loss' || g.category === 'metabolic_health')) return true;
    if (optimization.type === 'workout' && g.category === 'muscle_gain') return true;
    if (optimization.type === 'recovery' && g.category === 'recovery') return true;
    return false;
  });
  const goalScore = relatedGoal ? (relatedGoal.priority === 'primary' ? 30 : relatedGoal.priority === 'secondary' ? 20 : 10) : 0;
  
  // Adaptive confidence (0-20 points)
  const confidenceScore = 
    optimization.confidence === 'high' ? 20 :
    optimization.confidence === 'moderate' ? 15 : 10;
  
  // Data quality (0-10 points)
  const dataScore = 
    predictiveConfidence === 'high' ? 10 :
    predictiveConfidence === 'moderate' ? 7 : 5;
  
  const totalScore = severityScore + goalScore + confidenceScore + dataScore;
  
  return {
    score: totalScore,
    factors: {
      predictionSeverity: severityScore,
      goalImportance: goalScore,
      adaptiveConfidence: confidenceScore,
      dataQuality: dataScore,
    },
  };
}

/**
 * Rank optimizations by priority
 */
function rankOptimizationsByPriority(
  optimizations: OptimizationRecommendation[],
  goals: UserGoal[],
  predictiveConfidence: string
): OptimizationPriorityItem[] {
  const priorityItems = optimizations.map(opt => {
    const { score, factors } = calculatePriorityScore(opt, goals, predictiveConfidence);
    return {
      rank: 0, // Will be set after sorting
      optimization: opt,
      priorityScore: score,
      priorityFactors: factors,
    };
  });
  
  // Sort by priority score
  priorityItems.sort((a, b) => b.priorityScore - a.priorityScore);
  
  // Set ranks
  priorityItems.forEach((item, index) => {
    item.rank = index + 1;
  });
  
  return priorityItems;
}

// ============================================================================
// MAIN AUTONOMOUS OPTIMIZATION FUNCTION
// ============================================================================

/**
 * Get autonomous optimization context for a user
 */
export async function getAutonomousOptimizationContext(
  userId: string
): Promise<AutonomousOptimizationContext> {
  try {
    logger.info('🔵 [AUTONOMOUS] Starting autonomous optimization analysis', { userId });
    
    // Load intelligence contexts
    const [predictiveContext, goalContext, adaptiveContext, fusionContext] = await Promise.all([
      getPredictiveIntelligenceContext(userId),
      getGoalWeightedIntelligenceContext(userId),
      getAdaptiveIntelligenceContext(userId),
      getHealthIntelligenceFusionContext(userId),
    ]);
    
    logger.info('✅ [AUTONOMOUS] Intelligence contexts loaded', {
      userId,
      predictions: predictiveContext.totalProjections,
      risks: predictiveContext.upcomingRisks,
      goals: goalContext.totalGoals,
      interventionEffects: adaptiveContext.interventionEffects.length,
    });
    
    // Generate optimizations by category
    const nutritionOpts = generateNutritionOptimizations(
      predictiveContext.riskPredictions,
      predictiveContext.plateauPredictions,
      predictiveContext.declinePredictions,
      goalContext.goals,
      adaptiveContext.interventionEffects
    );
    
    const workoutOpts = generateWorkoutOptimizations(
      predictiveContext.plateauPredictions,
      predictiveContext.declinePredictions,
      goalContext.goals,
      adaptiveContext.interventionEffects
    );
    
    const supplementOpts = generateSupplementOptimizations(
      predictiveContext.riskPredictions,
      predictiveContext.declinePredictions,
      adaptiveContext.interventionEffects
    );
    
    const recoveryOpts = generateRecoveryOptimizations(
      predictiveContext.declinePredictions,
      goalContext.goals
    );
    
    const lifestyleOpts = generateLifestyleOptimizations(
      predictiveContext.riskPredictions,
      goalContext.goals
    );
    
    const allOptimizations = [
      ...nutritionOpts,
      ...workoutOpts,
      ...supplementOpts,
      ...recoveryOpts,
      ...lifestyleOpts,
    ];
    
    logger.info('✅ [AUTONOMOUS] Optimizations generated', {
      userId,
      totalOptimizations: allOptimizations.length,
      nutrition: nutritionOpts.length,
      workout: workoutOpts.length,
      supplement: supplementOpts.length,
      recovery: recoveryOpts.length,
      lifestyle: lifestyleOpts.length,
    });
    
    // Generate autonomous adjustments
    const autonomousAdjustments = generateAutonomousAdjustments(allOptimizations);
    
    // Calculate optimization confidence
    const optimizationConfidence = calculateOptimizationConfidence(allOptimizations);
    
    // Rank optimizations by priority
    const optimizationPriorities = rankOptimizationsByPriority(
      allOptimizations,
      goalContext.goals,
      predictiveContext.predictionConfidence.overall
    );
    
    logger.info('✅ [AUTONOMOUS] Optimizations prioritized', {
      userId,
      topPriority: optimizationPriorities[0]?.optimization.recommendation || 'None',
      topScore: optimizationPriorities[0]?.priorityScore || 0,
    });
    
    // Build optimization rationale
    const topTriggers = Array.from(new Set(allOptimizations.map(o => o.trigger))).slice(0, 3);
    const primaryGoals = goalContext.goals
      .filter(g => g.priority === 'primary')
      .map(g => g.category);
    const keyInsights = [
      ...predictiveContext.riskPredictions.map(r => r.description),
      ...predictiveContext.plateauPredictions.map(p => p.description),
    ].slice(0, 3);
    
    // Get top optimizations
    const topOptimizations = optimizationPriorities.slice(0, 3).map(p => p.optimization);
    
    // Calculate data completeness
    const hasPredictiveData = predictiveContext.totalProjections > 0;
    const hasGoalData = goalContext.totalGoals > 0;
    const hasAdaptiveData = adaptiveContext.interventionEffects.length > 0;
    const hasFusionData = fusionContext.fusionSignals.length > 0;
    
    let completenessScore = 0;
    if (hasPredictiveData) completenessScore += 30;
    if (hasGoalData) completenessScore += 30;
    if (hasAdaptiveData) completenessScore += 20;
    if (hasFusionData) completenessScore += 20;
    
    const context: AutonomousOptimizationContext = {
      userId,
      timestamp: new Date().toISOString(),
      optimizationRecommendations: allOptimizations,
      autonomousAdjustments,
      optimizationPriorities,
      optimizationConfidence,
      optimizationRationale: {
        topTriggers,
        primaryGoals,
        keyInsights,
      },
      totalOptimizations: allOptimizations.length,
      criticalOptimizations: allOptimizations.filter(o => o.priority === 'critical').length,
      highPriorityOptimizations: allOptimizations.filter(o => o.priority === 'high' || o.priority === 'critical').length,
      topOptimizations,
      dataCompleteness: {
        hasPredictiveData,
        hasGoalData,
        hasAdaptiveData,
        hasFusionData,
        completenessScore,
      },
    };
    
    logger.info('✅ [AUTONOMOUS] Autonomous optimization analysis complete', {
      userId,
      totalOptimizations: allOptimizations.length,
      criticalOptimizations: context.criticalOptimizations,
      highPriorityOptimizations: context.highPriorityOptimizations,
      overallConfidence: optimizationConfidence.overall,
    });
    
    return context;
  } catch (error) {
    logger.error('❌ [AUTONOMOUS] Failed to generate autonomous optimization', {
      userId,
      error: (error as Error).message,
    });
    
    // Fallback: return empty context
    return {
      userId,
      timestamp: new Date().toISOString(),
      optimizationRecommendations: [],
      autonomousAdjustments: [],
      optimizationPriorities: [],
      optimizationConfidence: {
        overall: 'low',
        nutrition: 'low',
        workout: 'low',
        supplement: 'low',
        recovery: 'low',
      },
      optimizationRationale: {
        topTriggers: [],
        primaryGoals: [],
        keyInsights: [],
      },
      totalOptimizations: 0,
      criticalOptimizations: 0,
      highPriorityOptimizations: 0,
      topOptimizations: [],
      dataCompleteness: {
        hasPredictiveData: false,
        hasGoalData: false,
        hasAdaptiveData: false,
        hasFusionData: false,
        completenessScore: 0,
      },
    };
  }
}

/**
 * Get top autonomous optimizations
 */
export async function getTopOptimizations(userId: string, limit: number = 3): Promise<OptimizationRecommendation[]> {
  const context = await getAutonomousOptimizationContext(userId);
  return context.topOptimizations.slice(0, limit);
}

/**
 * Get optimizations by type
 */
export async function getOptimizationsByType(userId: string, type: OptimizationType): Promise<OptimizationRecommendation[]> {
  const context = await getAutonomousOptimizationContext(userId);
  return context.optimizationRecommendations.filter(o => o.type === type);
}

/**
 * Get critical optimizations
 */
export async function getCriticalOptimizations(userId: string): Promise<OptimizationRecommendation[]> {
  const context = await getAutonomousOptimizationContext(userId);
  return context.optimizationRecommendations.filter(o => o.priority === 'critical');
}
