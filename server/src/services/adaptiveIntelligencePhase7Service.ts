import { logger } from '../utils/logger';
import { getLongitudinalIntelligenceContext, type TrendAnalysis, type LongitudinalSignal } from './longitudinalIntelligenceService';
import { getLatestBloodworkContext } from './bloodworkContextService';
import { getLatestBodyCompositionContext } from './bodyCompositionContextService';
import { getCurrentSupplementStackContext } from './supplementContextService';

/**
 * Adaptive Intelligence Service - Phase 7
 * 
 * Purpose: Enable learning intelligence through intervention effectiveness detection
 * - Detects intervention effectiveness (what works for this user)
 * - Tracks recommendation effectiveness over time
 * - Identifies failed interventions requiring escalation
 * - Generates adaptive signals for recommendation evolution
 * - Provides confidence scoring based on data quality
 * - Creates learning signals for continuous improvement
 * 
 * This is rule-based adaptive intelligence - no ML models
 */

// ============================================================================
// TYPES
// ============================================================================

export type InterventionType = 
  | 'supplement'
  | 'nutrition'
  | 'training'
  | 'recovery'
  | 'lifestyle';

export type InterventionEffectiveness = 'effective' | 'ineffective' | 'unclear' | 'insufficient_data';
export type AdaptiveConfidence = 'high' | 'moderate' | 'low';
export type AdaptiveSignalType = 'intervention_effective' | 'intervention_ineffective' | 'recommendation_adapted' | 'learning_insight';

export interface InterventionEffect {
  id: string;
  interventionType: InterventionType;
  interventionDescription: string;
  outcomeMarker: string;
  outcomeCategory: 'bloodwork' | 'body_composition';
  effectiveness: InterventionEffectiveness;
  confidence: AdaptiveConfidence;
  
  // Trend data
  beforeValue: number | null;
  afterValue: number | null;
  changePercent: number | null;
  timespan: string;
  dataPoints: number;
  
  // Evidence
  evidence: string;
  recommendation?: string;
}

export interface RecommendationEffectiveness {
  recommendationId: string;
  recommendationType: string;
  category: string;
  issuedDate: string;
  
  // Adherence
  adherenceDetected: boolean;
  adherenceEvidence?: string;
  
  // Outcome
  outcomeImprovement: boolean;
  outcomeMarker?: string;
  outcomeEvidence?: string;
  
  // Effectiveness
  effectiveness: InterventionEffectiveness;
  confidence: AdaptiveConfidence;
  
  // Learning
  learningInsight: string;
}

export interface AdaptiveSignal {
  id: string;
  type: AdaptiveSignalType;
  category: string;
  title: string;
  description: string;
  confidence: AdaptiveConfidence;
  actionable: boolean;
  suggestedAction?: string;
  evidence: string[];
}

export interface ConfidenceSignal {
  category: string;
  confidence: AdaptiveConfidence;
  reason: string;
  dataPoints: number;
  timespan: string;
}

export interface LearningSignal {
  id: string;
  category: string;
  insight: string;
  confidence: AdaptiveConfidence;
  actionable: boolean;
  suggestedAction?: string;
}

export interface AdaptiveIntelligenceContext {
  userId: string;
  timestamp: string;
  
  // Intervention effectiveness
  interventionEffects: InterventionEffect[];
  effectiveInterventions: InterventionEffect[];
  ineffectiveInterventions: InterventionEffect[];
  
  // Recommendation effectiveness
  recommendationEffectiveness: RecommendationEffectiveness[];
  
  // Adaptive signals
  adaptiveSignals: AdaptiveSignal[];
  
  // Confidence signals
  confidenceSignals: ConfidenceSignal[];
  
  // Learning signals
  learningSignals: LearningSignal[];
  
  // Summary metrics
  totalInterventions: number;
  effectiveCount: number;
  ineffectiveCount: number;
  
  // Data completeness
  dataCompleteness: {
    hasLongitudinalData: boolean;
    hasBloodworkTrends: boolean;
    hasBodyCompositionTrends: boolean;
    hasSupplementData: boolean;
    completenessScore: number; // 0-100
  };
}

// ============================================================================
// INTERVENTION EFFECTIVENESS DETECTION
// ============================================================================

/**
 * Detect supplement intervention effectiveness using longitudinal trends
 */
async function detectSupplementInterventionEffects(
  userId: string,
  longitudinalContext: Awaited<ReturnType<typeof getLongitudinalIntelligenceContext>>
): Promise<InterventionEffect[]> {
  const effects: InterventionEffect[] = [];
  
  try {
    const supplementContext = await getCurrentSupplementStackContext(userId);
    
    if (!supplementContext.hasSupplementStack) {
      return effects;
    }
    
    // Check Vitamin D intervention
    if (supplementContext.ingredients.some(ing => ing.toLowerCase().includes('vitamin d'))) {
      const vitaminDTrend = longitudinalContext.bloodworkTrends.find(
        t => t.marker.toLowerCase().includes('vitamin d')
      );
      
      if (vitaminDTrend && vitaminDTrend.dataPoints.length >= 2) {
        const effectiveness = vitaminDTrend.direction === 'improving' ? 'effective' : 
                            vitaminDTrend.direction === 'declining' ? 'ineffective' : 'unclear';
        
        const confidence: AdaptiveConfidence = 
          vitaminDTrend.confidence === 'high' ? 'high' :
          vitaminDTrend.confidence === 'moderate' ? 'moderate' : 'low';
        
        let evidence = vitaminDTrend.summary;
        let recommendation = '';
        
        if (effectiveness === 'ineffective') {
          const currentDose = supplementContext.supplements.find(s => 
            (s as any).name?.toLowerCase().includes('vitamin d')
          );
          evidence += `. Current dose: ${(currentDose as any)?.dosage || 'unknown'}.`;
          recommendation = 'Vitamin D remains low despite supplementation. Consider increasing dose or checking absorption.';
        } else if (effectiveness === 'effective') {
          recommendation = 'Vitamin D supplementation is working. Continue current approach.';
        }
        
        effects.push({
          id: `intervention-supplement-vitamin-d-${Date.now()}`,
          interventionType: 'supplement',
          interventionDescription: 'Vitamin D supplementation',
          outcomeMarker: 'Vitamin D',
          outcomeCategory: 'bloodwork',
          effectiveness,
          confidence,
          beforeValue: vitaminDTrend.previousValue,
          afterValue: vitaminDTrend.currentValue,
          changePercent: vitaminDTrend.changePercent,
          timespan: vitaminDTrend.timespan,
          dataPoints: vitaminDTrend.dataPoints.length,
          evidence,
          recommendation,
        });
      }
    }
    
    // Check other supplement interventions (B12, Iron/Ferritin, etc.)
    if (supplementContext.ingredients.some(ing => ing.toLowerCase().includes('b12') || ing.toLowerCase().includes('methylcobalamin'))) {
      const b12Trend = longitudinalContext.bloodworkTrends.find(
        t => t.marker.toLowerCase().includes('b12') || t.marker.toLowerCase().includes('cobalamin')
      );
      
      if (b12Trend && b12Trend.dataPoints.length >= 2) {
        const effectiveness = b12Trend.direction === 'improving' ? 'effective' : 
                            b12Trend.direction === 'declining' ? 'ineffective' : 'unclear';
        
        effects.push({
          id: `intervention-supplement-b12-${Date.now()}`,
          interventionType: 'supplement',
          interventionDescription: 'B12 supplementation',
          outcomeMarker: 'B12',
          outcomeCategory: 'bloodwork',
          effectiveness,
          confidence: b12Trend.confidence as AdaptiveConfidence,
          beforeValue: b12Trend.previousValue,
          afterValue: b12Trend.currentValue,
          changePercent: b12Trend.changePercent,
          timespan: b12Trend.timespan,
          dataPoints: b12Trend.dataPoints.length,
          evidence: b12Trend.summary,
          recommendation: effectiveness === 'effective' ? 
            'B12 supplementation is working. Continue current approach.' :
            'B12 supplementation may need adjustment.',
        });
      }
    }
    
  } catch (error) {
    logger.error('[ADAPTIVE] Error detecting supplement intervention effects', {
      userId,
      error: (error as Error).message,
    });
  }
  
  return effects;
}

/**
 * Detect training intervention effectiveness using body composition trends
 */
async function detectTrainingInterventionEffects(
  userId: string,
  longitudinalContext: Awaited<ReturnType<typeof getLongitudinalIntelligenceContext>>
): Promise<InterventionEffect[]> {
  const effects: InterventionEffect[] = [];
  
  try {
    const bodyFatTrend = longitudinalContext.bodyCompositionTrends.find(
      t => t.marker.toLowerCase().includes('body fat')
    );
    const leanMassTrend = longitudinalContext.bodyCompositionTrends.find(
      t => t.marker.toLowerCase().includes('lean mass')
    );
    
    // Detect recomposition success
    if (bodyFatTrend && leanMassTrend && 
        bodyFatTrend.dataPoints.length >= 2 && leanMassTrend.dataPoints.length >= 2) {
      
      const bodyFatImproving = bodyFatTrend.direction === 'improving'; // Lower is better
      const leanMassImproving = leanMassTrend.direction === 'improving'; // Higher is better
      const leanMassStable = leanMassTrend.direction === 'stable';
      
      if (bodyFatImproving && (leanMassImproving || leanMassStable)) {
        effects.push({
          id: `intervention-training-recomp-${Date.now()}`,
          interventionType: 'training',
          interventionDescription: 'Body recomposition training strategy',
          outcomeMarker: 'Body Composition',
          outcomeCategory: 'body_composition',
          effectiveness: 'effective',
          confidence: 'high',
          beforeValue: bodyFatTrend.previousValue,
          afterValue: bodyFatTrend.currentValue,
          changePercent: bodyFatTrend.changePercent,
          timespan: bodyFatTrend.timespan,
          dataPoints: bodyFatTrend.dataPoints.length,
          evidence: `${bodyFatTrend.summary}. ${leanMassTrend.summary}. Healthy recomposition detected.`,
          recommendation: 'Training strategy is effective for body recomposition. Continue current approach.',
        });
      } else if (!bodyFatImproving && leanMassTrend.direction === 'declining') {
        effects.push({
          id: `intervention-training-ineffective-${Date.now()}`,
          interventionType: 'training',
          interventionDescription: 'Current training strategy',
          outcomeMarker: 'Body Composition',
          outcomeCategory: 'body_composition',
          effectiveness: 'ineffective',
          confidence: 'moderate',
          beforeValue: bodyFatTrend.previousValue,
          afterValue: bodyFatTrend.currentValue,
          changePercent: bodyFatTrend.changePercent,
          timespan: bodyFatTrend.timespan,
          dataPoints: bodyFatTrend.dataPoints.length,
          evidence: `${bodyFatTrend.summary}. ${leanMassTrend.summary}. Muscle loss detected.`,
          recommendation: 'Training strategy needs adjustment. Consider increasing protein, reducing volume, or adjusting training split.',
        });
      }
    }
    
  } catch (error) {
    logger.error('[ADAPTIVE] Error detecting training intervention effects', {
      userId,
      error: (error as Error).message,
    });
  }
  
  return effects;
}

/**
 * Detect nutrition intervention effectiveness using metabolic markers
 */
async function detectNutritionInterventionEffects(
  userId: string,
  longitudinalContext: Awaited<ReturnType<typeof getLongitudinalIntelligenceContext>>
): Promise<InterventionEffect[]> {
  const effects: InterventionEffect[] = [];
  
  try {
    const a1cTrend = longitudinalContext.bloodworkTrends.find(
      t => t.marker.toLowerCase().includes('a1c')
    );
    const triglycerideTrend = longitudinalContext.bloodworkTrends.find(
      t => t.marker.toLowerCase().includes('triglyceride')
    );
    
    // Detect metabolic improvement from nutrition changes
    if (a1cTrend && a1cTrend.dataPoints.length >= 2) {
      const effectiveness = a1cTrend.direction === 'improving' ? 'effective' : 
                          a1cTrend.direction === 'declining' ? 'ineffective' : 'unclear';
      
      if (effectiveness !== 'unclear') {
        effects.push({
          id: `intervention-nutrition-a1c-${Date.now()}`,
          interventionType: 'nutrition',
          interventionDescription: 'Nutrition strategy for metabolic health',
          outcomeMarker: 'A1C',
          outcomeCategory: 'bloodwork',
          effectiveness,
          confidence: a1cTrend.confidence as AdaptiveConfidence,
          beforeValue: a1cTrend.previousValue,
          afterValue: a1cTrend.currentValue,
          changePercent: a1cTrend.changePercent,
          timespan: a1cTrend.timespan,
          dataPoints: a1cTrend.dataPoints.length,
          evidence: a1cTrend.summary,
          recommendation: effectiveness === 'effective' ?
            'Nutrition strategy is improving metabolic health. Continue current approach.' :
            'A1C is worsening. Consider adjusting carbohydrate intake, meal timing, or overall calorie balance.',
        });
      }
    }
    
    if (triglycerideTrend && triglycerideTrend.dataPoints.length >= 2) {
      const effectiveness = triglycerideTrend.direction === 'improving' ? 'effective' : 
                          triglycerideTrend.direction === 'declining' ? 'ineffective' : 'unclear';
      
      if (effectiveness !== 'unclear') {
        effects.push({
          id: `intervention-nutrition-triglycerides-${Date.now()}`,
          interventionType: 'nutrition',
          interventionDescription: 'Nutrition strategy for lipid management',
          outcomeMarker: 'Triglycerides',
          outcomeCategory: 'bloodwork',
          effectiveness,
          confidence: triglycerideTrend.confidence as AdaptiveConfidence,
          beforeValue: triglycerideTrend.previousValue,
          afterValue: triglycerideTrend.currentValue,
          changePercent: triglycerideTrend.changePercent,
          timespan: triglycerideTrend.timespan,
          dataPoints: triglycerideTrend.dataPoints.length,
          evidence: triglycerideTrend.summary,
          recommendation: effectiveness === 'effective' ?
            'Nutrition strategy is improving lipid profile. Continue current approach.' :
            'Triglycerides are worsening. Consider reducing refined carbs and increasing omega-3 intake.',
        });
      }
    }
    
  } catch (error) {
    logger.error('[ADAPTIVE] Error detecting nutrition intervention effects', {
      userId,
      error: (error as Error).message,
    });
  }
  
  return effects;
}

// ============================================================================
// ADAPTIVE SIGNALS
// ============================================================================

/**
 * Generate adaptive signals from intervention effects
 */
function generateAdaptiveSignals(interventionEffects: InterventionEffect[]): AdaptiveSignal[] {
  const signals: AdaptiveSignal[] = [];
  
  for (const effect of interventionEffects) {
    if (effect.effectiveness === 'effective') {
      signals.push({
        id: `adaptive-effective-${effect.id}`,
        type: 'intervention_effective',
        category: effect.interventionType,
        title: `${effect.interventionDescription} is Effective`,
        description: effect.evidence,
        confidence: effect.confidence,
        actionable: true,
        suggestedAction: effect.recommendation || 'Continue current approach',
        evidence: [effect.evidence],
      });
    } else if (effect.effectiveness === 'ineffective') {
      signals.push({
        id: `adaptive-ineffective-${effect.id}`,
        type: 'intervention_ineffective',
        category: effect.interventionType,
        title: `${effect.interventionDescription} Needs Adjustment`,
        description: effect.evidence,
        confidence: effect.confidence,
        actionable: true,
        suggestedAction: effect.recommendation || 'Intervention requires escalation or modification',
        evidence: [effect.evidence],
      });
    }
  }
  
  return signals;
}

// ============================================================================
// CONFIDENCE SCORING
// ============================================================================

/**
 * Calculate confidence signals based on data quality
 */
function calculateConfidenceSignals(
  longitudinalContext: Awaited<ReturnType<typeof getLongitudinalIntelligenceContext>>
): ConfidenceSignal[] {
  const signals: ConfidenceSignal[] = [];
  
  // Bloodwork confidence
  if (longitudinalContext.bloodworkTrends.length > 0) {
    const avgDataPoints = longitudinalContext.bloodworkTrends.reduce(
      (sum, t) => sum + t.dataPoints.length, 0
    ) / longitudinalContext.bloodworkTrends.length;
    
    const confidence: AdaptiveConfidence = 
      avgDataPoints >= 5 ? 'high' :
      avgDataPoints >= 3 ? 'moderate' : 'low';
    
    const longestTimespan = longitudinalContext.bloodworkTrends.reduce(
      (max, t) => t.timespan.length > max.length ? t.timespan : max,
      ''
    );
    
    signals.push({
      category: 'bloodwork',
      confidence,
      reason: `Based on ${Math.round(avgDataPoints)} average data points per marker`,
      dataPoints: Math.round(avgDataPoints),
      timespan: longestTimespan,
    });
  }
  
  // Body composition confidence
  if (longitudinalContext.bodyCompositionTrends.length > 0) {
    const avgDataPoints = longitudinalContext.bodyCompositionTrends.reduce(
      (sum, t) => sum + t.dataPoints.length, 0
    ) / longitudinalContext.bodyCompositionTrends.length;
    
    const confidence: AdaptiveConfidence = 
      avgDataPoints >= 5 ? 'high' :
      avgDataPoints >= 3 ? 'moderate' : 'low';
    
    const longestTimespan = longitudinalContext.bodyCompositionTrends.reduce(
      (max, t) => t.timespan.length > max.length ? t.timespan : max,
      ''
    );
    
    signals.push({
      category: 'body_composition',
      confidence,
      reason: `Based on ${Math.round(avgDataPoints)} average data points per metric`,
      dataPoints: Math.round(avgDataPoints),
      timespan: longestTimespan,
    });
  }
  
  return signals;
}

// ============================================================================
// LEARNING SIGNALS
// ============================================================================

/**
 * Generate learning signals from trends and interventions
 */
function generateLearningSignals(
  longitudinalContext: Awaited<ReturnType<typeof getLongitudinalIntelligenceContext>>,
  interventionEffects: InterventionEffect[]
): LearningSignal[] {
  const signals: LearningSignal[] = [];
  
  // Learning from improvement signals
  for (const improvement of longitudinalContext.improvementSignals) {
    signals.push({
      id: `learning-improvement-${improvement.id}`,
      category: improvement.category,
      insight: `${improvement.title}: ${improvement.description}`,
      confidence: improvement.confidence as AdaptiveConfidence,
      actionable: true,
      suggestedAction: 'Continue current approach - this is working for you',
    });
  }
  
  // Learning from decline signals
  for (const decline of longitudinalContext.declineSignals) {
    signals.push({
      id: `learning-decline-${decline.id}`,
      category: decline.category,
      insight: `${decline.title}: ${decline.description}`,
      confidence: decline.confidence as AdaptiveConfidence,
      actionable: true,
      suggestedAction: 'Intervention needed - this trend requires attention',
    });
  }
  
  // Learning from effective interventions
  const effectiveInterventions = interventionEffects.filter(e => e.effectiveness === 'effective');
  if (effectiveInterventions.length > 0) {
    const categories = [...new Set(effectiveInterventions.map(e => e.interventionType))];
    for (const category of categories) {
      const count = effectiveInterventions.filter(e => e.interventionType === category).length;
      signals.push({
        id: `learning-effective-${category}`,
        category,
        insight: `${count} ${category} intervention(s) are working effectively for you`,
        confidence: 'high',
        actionable: true,
        suggestedAction: `Prioritize ${category} interventions - they have proven effective`,
      });
    }
  }
  
  return signals;
}

// ============================================================================
// MAIN ADAPTIVE INTELLIGENCE FUNCTION
// ============================================================================

/**
 * Get adaptive intelligence context for a user
 */
export async function getAdaptiveIntelligenceContext(
  userId: string
): Promise<AdaptiveIntelligenceContext> {
  try {
    logger.info('🔵 [ADAPTIVE] Starting adaptive intelligence analysis', { userId });
    
    // Load longitudinal intelligence
    const longitudinalContext = await getLongitudinalIntelligenceContext(userId);
    
    logger.info('✅ [ADAPTIVE] Longitudinal intelligence loaded', {
      userId,
      totalTrends: longitudinalContext.totalTrends,
      improvingTrends: longitudinalContext.improvingTrends,
      decliningTrends: longitudinalContext.decliningTrends,
    });
    
    // Detect intervention effects
    const supplementEffects = await detectSupplementInterventionEffects(userId, longitudinalContext);
    const trainingEffects = await detectTrainingInterventionEffects(userId, longitudinalContext);
    const nutritionEffects = await detectNutritionInterventionEffects(userId, longitudinalContext);
    
    const interventionEffects = [
      ...supplementEffects,
      ...trainingEffects,
      ...nutritionEffects,
    ];
    
    logger.info('✅ [ADAPTIVE] Intervention effects detected', {
      userId,
      totalEffects: interventionEffects.length,
      supplementEffects: supplementEffects.length,
      trainingEffects: trainingEffects.length,
      nutritionEffects: nutritionEffects.length,
    });
    
    // Categorize interventions
    const effectiveInterventions = interventionEffects.filter(e => e.effectiveness === 'effective');
    const ineffectiveInterventions = interventionEffects.filter(e => e.effectiveness === 'ineffective');
    
    // Generate adaptive signals
    const adaptiveSignals = generateAdaptiveSignals(interventionEffects);
    
    // Calculate confidence signals
    const confidenceSignals = calculateConfidenceSignals(longitudinalContext);
    
    // Generate learning signals
    const learningSignals = generateLearningSignals(longitudinalContext, interventionEffects);
    
    // Calculate data completeness
    const hasLongitudinalData = longitudinalContext.totalTrends > 0;
    const hasBloodworkTrends = longitudinalContext.bloodworkTrends.length > 0;
    const hasBodyCompositionTrends = longitudinalContext.bodyCompositionTrends.length > 0;
    
    let completenessScore = longitudinalContext.dataCompleteness.completenessScore;
    
    const context: AdaptiveIntelligenceContext = {
      userId,
      timestamp: new Date().toISOString(),
      interventionEffects,
      effectiveInterventions,
      ineffectiveInterventions,
      recommendationEffectiveness: [], // Placeholder for future implementation
      adaptiveSignals,
      confidenceSignals,
      learningSignals,
      totalInterventions: interventionEffects.length,
      effectiveCount: effectiveInterventions.length,
      ineffectiveCount: ineffectiveInterventions.length,
      dataCompleteness: {
        hasLongitudinalData,
        hasBloodworkTrends,
        hasBodyCompositionTrends,
        hasSupplementData: false, // Will be set by supplement detection
        completenessScore,
      },
    };
    
    logger.info('✅ [ADAPTIVE] Adaptive intelligence analysis complete', {
      userId,
      totalInterventions: interventionEffects.length,
      effectiveCount: effectiveInterventions.length,
      ineffectiveCount: ineffectiveInterventions.length,
      adaptiveSignals: adaptiveSignals.length,
      learningSignals: learningSignals.length,
      completenessScore,
    });
    
    return context;
  } catch (error) {
    logger.error('❌ [ADAPTIVE] Failed to generate adaptive intelligence', {
      userId,
      error: (error as Error).message,
    });
    
    // Fallback: return empty context
    return {
      userId,
      timestamp: new Date().toISOString(),
      interventionEffects: [],
      effectiveInterventions: [],
      ineffectiveInterventions: [],
      recommendationEffectiveness: [],
      adaptiveSignals: [],
      confidenceSignals: [],
      learningSignals: [],
      totalInterventions: 0,
      effectiveCount: 0,
      ineffectiveCount: 0,
      dataCompleteness: {
        hasLongitudinalData: false,
        hasBloodworkTrends: false,
        hasBodyCompositionTrends: false,
        hasSupplementData: false,
        completenessScore: 0,
      },
    };
  }
}

/**
 * Get what's working for this user
 */
export async function getWhatsWorking(userId: string): Promise<InterventionEffect[]> {
  const context = await getAdaptiveIntelligenceContext(userId);
  return context.effectiveInterventions;
}

/**
 * Get what needs adjustment for this user
 */
export async function getWhatsNeedsAdjustment(userId: string): Promise<InterventionEffect[]> {
  const context = await getAdaptiveIntelligenceContext(userId);
  return context.ineffectiveInterventions;
}

/**
 * Get learning insights for this user
 */
export async function getLearningInsights(userId: string): Promise<LearningSignal[]> {
  const context = await getAdaptiveIntelligenceContext(userId);
  return context.learningSignals;
}
