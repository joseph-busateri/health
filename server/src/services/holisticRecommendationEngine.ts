import { logger } from '../utils/logger';
import { generateUnifiedHealthProfile } from './healthProfileAggregation';
import { evaluateDecisionTree } from './healthDecisionTree';
import { analyzeHealthProfileWithAI } from './holisticAIAnalysis';
import type {
  HolisticAnalysisResult,
  HolisticRecommendation
} from '../types/holisticHealth';

export interface GenerateHolisticRecommendationsRequest {
  userId: string;
  forceAI?: boolean; // Force AI analysis even if decision tree matches
}

/**
 * Hybrid holistic recommendation engine
 * 
 * Flow:
 * 1. Aggregate all health data into unified profile
 * 2. Run decision tree for common patterns (fast, free)
 * 3. If tree is confident (>0.7) and matches, use tree results
 * 4. Otherwise, fall back to AI for complex analysis
 * 5. Return prioritized, holistic recommendations
 */
export async function generateHolisticRecommendations(
  request: GenerateHolisticRecommendationsRequest
): Promise<HolisticAnalysisResult> {
  const { userId, forceAI = false } = request;
  const startTime = Date.now();

  logger.info('Starting holistic recommendation generation', { userId, forceAI });

  try {
    // Step 1: Aggregate all health data
    const profile = await generateUnifiedHealthProfile(userId);

    // Check if we have enough data
    const dataCount = Object.values(profile.dataCompleteness).filter(Boolean).length;
    if (dataCount === 0) {
      logger.warn('No health data available for user', { userId });
      return {
        profile,
        recommendations: [],
        rootCauses: ['Insufficient health data'],
        topPriority: {
          issue: 'Start Tracking Health Data',
          rationale: 'No health data available to analyze',
          actions: [
            'Begin logging daily health metrics',
            'Upload bloodwork results if available',
            'Track sleep and activity consistently'
          ]
        },
        secondaryPriorities: [],
        interconnections: [],
        generationMethod: 'hybrid',
        processingTime: Date.now() - startTime,
        totalCost: 0
      };
    }

    // Step 2: Evaluate decision tree
    const treeResult = evaluateDecisionTree(profile);

    logger.info('Decision tree evaluation', {
      userId,
      matched: treeResult.matched,
      confidence: treeResult.confidence,
      recommendations: treeResult.recommendations.length,
      shouldUseAI: treeResult.shouldUseAI
    });

    // Step 3: Decide whether to use tree results or AI
    let finalRecommendations: HolisticRecommendation[];
    let rootCauses: string[];
    let topPriority: { issue: string; rationale: string; actions: string[] };
    let secondaryPriorities: Array<{ issue: string; actions: string[] }>;
    let interconnections: any[];
    let generationMethod: 'decision_tree' | 'ai_analysis' | 'hybrid';
    let totalCost = 0;

    if (!forceAI && treeResult.matched && treeResult.confidence >= 0.7 && !treeResult.shouldUseAI) {
      // Use decision tree results (fast, free, confident)
      logger.info('Using decision tree results', { userId, confidence: treeResult.confidence });

      finalRecommendations = treeResult.recommendations;
      
      // Extract root causes from top recommendation
      rootCauses = finalRecommendations[0]?.rootCauses || [];
      
      // Build priority structure
      topPriority = {
        issue: finalRecommendations[0]?.issue || 'Health Optimization',
        rationale: finalRecommendations[0]?.rationale || '',
        actions: finalRecommendations[0]?.actions || []
      };

      secondaryPriorities = finalRecommendations.slice(1, 3).map(rec => ({
        issue: rec.issue,
        actions: rec.actions
      }));

      interconnections = finalRecommendations[0]?.interconnections || [];
      generationMethod = 'decision_tree';

    } else {
      // Fall back to AI analysis (complex case, low confidence, or forced)
      logger.info('Using AI analysis', { 
        userId, 
        reason: forceAI ? 'forced' : treeResult.shouldUseAI ? 'complex case' : 'low confidence'
      });

      const aiResult = await analyzeHealthProfileWithAI(profile);

      finalRecommendations = aiResult.recommendations;
      rootCauses = aiResult.rootCauses;
      topPriority = aiResult.topPriority;
      secondaryPriorities = aiResult.secondaryPriorities;
      interconnections = aiResult.interconnections;
      generationMethod = treeResult.matched ? 'hybrid' : 'ai_analysis';
      totalCost = aiResult.cost;
    }

    const processingTime = Date.now() - startTime;

    logger.info('Holistic recommendations generated', {
      userId,
      method: generationMethod,
      recommendations: finalRecommendations.length,
      cost: totalCost.toFixed(4),
      processingTime
    });

    return {
      profile,
      recommendations: finalRecommendations,
      rootCauses,
      topPriority,
      secondaryPriorities,
      interconnections,
      generationMethod,
      processingTime,
      totalCost
    };

  } catch (error) {
    logger.error('Holistic recommendation generation failed', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId
    });

    throw error;
  }
}

/**
 * Get summary of user's health status for quick overview
 */
export async function getHealthSummary(userId: string): Promise<{
  profile: any;
  alerts: string[];
  strengths: string[];
  areasForImprovement: string[];
}> {
  const profile = await generateUnifiedHealthProfile(userId);

  const alerts: string[] = [];
  const strengths: string[] = [];
  const areasForImprovement: string[] = [];

  // Analyze bloodwork
  if (profile.bloodwork) {
    const outOfRange = profile.bloodwork.markers.filter(m => m.isOutOfRange);
    if (outOfRange.length > 0) {
      alerts.push(`${outOfRange.length} bloodwork markers out of range`);
    }

    const improving = profile.bloodwork.markers.filter(m => m.trendDirection === 'improving');
    if (improving.length > 0) {
      strengths.push(`${improving.length} bloodwork markers improving`);
    }

    const worsening = profile.bloodwork.markers.filter(m => m.trendDirection === 'worsening');
    if (worsening.length > 0) {
      areasForImprovement.push(`${worsening.length} bloodwork markers worsening`);
    }
  }

  // Analyze sleep
  if (profile.sleep) {
    if (profile.sleep.avgDuration < 7) {
      alerts.push('Sleep duration below recommended 7-8 hours');
    } else if (profile.sleep.avgDuration >= 7 && profile.sleep.avgDuration <= 9) {
      strengths.push('Sleep duration in optimal range');
    }

    if (profile.sleep.trendDirection === 'worsening') {
      areasForImprovement.push('Sleep quality declining');
    }
  }

  // Analyze activity
  if (profile.activity) {
    if (profile.activity.weeklyExerciseDays < 3) {
      areasForImprovement.push('Exercise frequency below recommended 3-5 days/week');
    } else if (profile.activity.weeklyExerciseDays >= 3) {
      strengths.push('Meeting exercise frequency goals');
    }
  }

  // Analyze stress
  if (profile.stress) {
    if (profile.stress.avgDailyScore >= 7) {
      alerts.push('Chronically elevated stress levels');
    } else if (profile.stress.avgDailyScore <= 5) {
      strengths.push('Stress levels well-managed');
    }
  }

  // Analyze body composition
  if (profile.bodyComposition) {
    const bodyFat = profile.bodyComposition.metrics.find(m => m.name === 'Body Fat %');
    if (bodyFat && bodyFat.trendDirection === 'worsening') {
      areasForImprovement.push('Body fat percentage increasing');
    }

    const muscle = profile.bodyComposition.metrics.find(m => m.name === 'Muscle Mass');
    if (muscle && muscle.trendDirection === 'improving') {
      strengths.push('Muscle mass increasing');
    }
  }

  return {
    profile,
    alerts,
    strengths,
    areasForImprovement
  };
}
