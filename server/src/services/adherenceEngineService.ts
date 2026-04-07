import { randomUUID } from 'crypto';

import { getDailyLogsForUser } from './structuredDailyLogService';
import { getBaselineFields } from './baselineContextService';
import { getEngineSnapshot } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import { enrichAdherenceRecommendationWithAI } from './adherenceAIEnrichment';
import { normalizeAdherenceRecommendation } from './adherenceRecommendationNormalizer';
import { validateAdherenceRecommendation } from './adherenceRecommendationValidator';
import { createRecommendation } from './recommendationEngineService';
import { logger } from '../utils/logger';
import type {
  AdherenceDomainBreakdown,
  AdherenceInputs,
  AdherenceRecord,
  AdherenceRecommendation,
  AdherenceStatus,
  AdherenceTrend,
  AdherenceEvidence,
  AdherenceEvidenceSignal,
  AdherenceRecommendationPriority,
} from '../types/adherenceEngine';

const adherenceStore = new Map<string, AdherenceRecord[]>();

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const scoreToStatus = (score: number): AdherenceStatus => {
  if (score >= 80) return 'high';
  if (score >= 60) return 'moderate';
  return 'low';
};

const estimateNutritionAdherence = (notes?: string): number => {
  if (!notes) return 65;
  const normalized = notes.toLowerCase();
  if (normalized.includes('off plan') || normalized.includes('missed meals') || normalized.includes('binge')) {
    return 45;
  }
  if (normalized.includes('on plan') || normalized.includes('hit macros') || normalized.includes('consistent')) {
    return 82;
  }
  return 65;
};

const estimateSleepAdherence = (sleepHours?: number): number => {
  if (sleepHours == null || !Number.isFinite(sleepHours)) return 65;
  if (sleepHours >= 7.5) return 90;
  if (sleepHours >= 6.5) return 72;
  if (sleepHours >= 5.5) return 55;
  return 35;
};

function buildAdherenceEvidence(
  adherenceScore: number,
  adherenceStatus: AdherenceStatus,
  sourceInputs: AdherenceInputs,
  breakdown: AdherenceDomainBreakdown,
): AdherenceEvidence {
  const signals: AdherenceEvidenceSignal[] = [];

  if (sourceInputs.workoutAdherence != null) {
    const value = sourceInputs.workoutAdherence;
    signals.push({
      name: 'Workout Adherence',
      value,
      interpretation:
        value >= 80
          ? 'Workout execution is consistent and supports progress.'
          : value >= 60
          ? 'Workout follow-through is moderate with some inconsistency.'
          : 'Workout follow-through is inconsistent and may limit progress.',
    });
  }

  if (sourceInputs.nutritionAdherence != null) {
    const value = sourceInputs.nutritionAdherence;
    signals.push({
      name: 'Nutrition Adherence',
      value,
      interpretation:
        value >= 80
          ? 'Nutrition plan is being followed consistently.'
          : value >= 60
          ? 'Nutrition adherence is moderate with occasional deviations.'
          : 'Nutrition plan follow-through is poor and may impact results.',
    });
  }

  if (sourceInputs.sleepAdherence != null) {
    const value = sourceInputs.sleepAdherence;
    signals.push({
      name: 'Sleep Adherence',
      value,
      interpretation:
        value >= 80
          ? 'Sleep recommendations are being followed consistently.'
          : value >= 60
          ? 'Sleep adherence is moderate with some inconsistency.'
          : 'Sleep-related recommendations are not being followed consistently.',
    });
  }

  if (sourceInputs.supplementAdherence != null) {
    const value = sourceInputs.supplementAdherence;
    signals.push({
      name: 'Supplement Adherence',
      value,
      interpretation:
        value >= 80
          ? 'Supplement protocol is being followed consistently.'
          : value >= 60
          ? 'Supplement adherence is moderate.'
          : 'Supplement protocol follow-through is inconsistent.',
    });
  }

  if (sourceInputs.recommendationAdherence != null) {
    const value = sourceInputs.recommendationAdherence;
    signals.push({
      name: 'Recommendation Adherence',
      value,
      interpretation:
        value >= 80
          ? 'General recommendations are being followed consistently.'
          : value >= 60
          ? 'Recommendation follow-through is moderate.'
          : 'General recommendation follow-through is low, suggesting plan friction or poor fit.',
    });
  }

  if (sourceInputs.autonomousPlanAdherence != null) {
    const value = sourceInputs.autonomousPlanAdherence;
    signals.push({
      name: 'Autonomous Plan Adherence',
      value,
      interpretation:
        value >= 80
          ? 'Automatically generated plans are being followed well.'
          : value >= 60
          ? 'Autonomous plan adherence is moderate.'
          : 'Automatically generated plans may not yet fit the user\'s execution pattern.',
    });
  }

  if (sourceInputs.goalPlanAdherence != null) {
    const value = sourceInputs.goalPlanAdherence;
    signals.push({
      name: 'Goal Plan Adherence',
      value,
      interpretation:
        value >= 80
          ? 'Behavior is aligned with stated goals.'
          : value >= 60
          ? 'Goal-aligned behavior is moderate.'
          : 'Behavior is not well-aligned with stated goals.',
    });
  }

  const summary =
    adherenceStatus === 'high'
      ? `Adherence is high today with strong execution across ${signals.length} tracked domains.`
      : adherenceStatus === 'moderate'
      ? `Adherence is moderate today with inconsistent follow-through across ${signals.length} tracked domains.`
      : `Adherence is low today with poor execution across ${signals.length} tracked domains.`;

  return {
    adherenceScore,
    adherenceStatus,
    sourceInputs,
    signals,
    summary,
  };
}

function buildAdherenceFallbackRecommendation(
  adherenceStatus: AdherenceStatus,
  adherenceScore: number,
  trend: AdherenceTrend,
  breakdown: AdherenceDomainBreakdown,
): AdherenceRecommendation {
  let priority: AdherenceRecommendationPriority;
  let summary: string;
  let note: string;
  let actions: string[];

  if (adherenceStatus === 'low') {
    priority = 'critical';
    summary = 'Execution is too inconsistent for aggressive optimization right now.';
    note = 'Focus on restoring consistency before changing protocols aggressively.';
    actions = [
      'Simplify today\'s plan to 1-2 non-negotiable actions',
      'Remove lower-value optional actions',
      'Focus on the highest-impact habit first',
      'Reduce plan complexity until consistency improves',
    ];
  } else if (adherenceStatus === 'moderate') {
    priority = 'important';
    summary = 'Consistency is mixed. Use a simpler plan to improve follow-through.';
    note =
      trend === 'declining'
        ? 'Trend is declining—stabilize routines this week.'
        : 'Push one domain at a time to raise consistency.';
    actions = [
      'Keep only top priority actions',
      'Reinforce routines that are already working',
      'Reduce plan friction by simplifying execution',
      'Focus on consistency before adding new protocols',
    ];
  } else {
    priority = 'optimization';
    summary = 'Execution is strong. Maintain consistency and build gradually.';
    note =
      trend === 'improving'
        ? 'Keep the current systems; momentum is improving.'
        : 'Maintain routines and monitor for sustainable consistency.';
    actions = [
      'Reinforce current routine and maintain consistency',
      'Keep plan stable to preserve execution momentum',
      'Selectively progress one area if capacity allows',
      'Continue tracking adherence to identify patterns',
    ];
  }

  return {
    type: 'adherence',
    priority,
    summary,
    rationale: `Adherence score is ${adherenceScore} (${adherenceStatus}) with ${trend} trend.`,
    note,
    actions,
    source: 'fallback',
  };
}

const buildRecommendation = (score: number, trend: AdherenceTrend): AdherenceRecommendation => {
  if (score < 55) {
    return {
      summary: 'Low adherence is likely confounding outcomes. Interpret other engine signals conservatively.',
      note: 'Focus on restoring consistency before changing protocols aggressively.',
    };
  }

  if (score < 75) {
    return {
      summary: 'Adherence is moderate. Outcome interpretation should account for inconsistency.',
      note: trend === 'declining'
        ? 'Trend is declining—stabilize routines this week.'
        : 'Push one domain at a time to raise consistency.',
    };
  }

  return {
    summary: 'Adherence is strong. Other engine outcomes are more likely to reflect true response.',
    note: trend === 'improving'
      ? 'Keep the current systems; momentum is improving.'
      : 'Maintain routines and monitor for sustainable consistency.',
  };
};

export const trackAdherenceByDomain = (inputs: AdherenceInputs): AdherenceDomainBreakdown => {
  return {
    workout: clamp(Math.round(inputs.workoutAdherence ?? 65), 0, 100),
    nutrition: clamp(Math.round(inputs.nutritionAdherence ?? 65), 0, 100),
    sleep: clamp(Math.round(inputs.sleepAdherence ?? 65), 0, 100),
    supplement: clamp(Math.round(inputs.supplementAdherence ?? 65), 0, 100),
  };
};

export const calculateAdherenceScore = (breakdown: AdherenceDomainBreakdown): number => {
  const weighted =
    breakdown.workout * 0.35 +
    breakdown.nutrition * 0.25 +
    breakdown.sleep * 0.2 +
    breakdown.supplement * 0.2;
  return Math.round(clamp(weighted, 0, 100));
};

export const summarizeAdherenceTrend = (history: AdherenceRecord[], latestScore: number): AdherenceTrend => {
  if (history.length === 0) {
    return 'stable';
  }

  const baseline = history.slice(0, 7);
  const avg = baseline.reduce((sum, item) => sum + item.adherenceScore, 0) / baseline.length;
  const delta = latestScore - avg;

  if (delta >= 5) return 'improving';
  if (delta <= -5) return 'declining';
  return 'stable';
};

const mergeInputs = async (userId: string, override?: AdherenceInputs): Promise<AdherenceInputs> => {
  const source: AdherenceInputs = { ...override };

  try {
    const latestLog = (await getDailyLogsForUser(userId, 1))[0];
    if (latestLog) {
      source.workoutAdherence ??= latestLog.workoutAdherence;
      source.sleepAdherence ??= estimateSleepAdherence(latestLog.sleepHours);
      source.nutritionAdherence ??= estimateNutritionAdherence(latestLog.notes);
      source.verbalNotes ??= latestLog.notes;
    }
  } catch {
    // Graceful fallback if source is unavailable.
  }

  const snapshot = await getEngineSnapshot(userId).catch(() => undefined);
  source.workoutAdherence ??= snapshot?.workout?.adherenceScore;
  source.supplementAdherence ??= snapshot?.supplement?.adherenceScore;
  source.sleepAdherence ??= snapshot?.recoveryCluster?.recoveryScore != null
    ? clamp(Math.round(snapshot.recoveryCluster.recoveryScore * 0.9), 0, 100)
    : undefined;
  source.nutritionAdherence ??= snapshot?.recoveryCluster?.adherenceScore;

  return source;
};

export const getAdherenceToday = async (
  userId: string,
  options?: { regenerate?: boolean; override?: AdherenceInputs },
): Promise<AdherenceRecord> => {
  const date = new Date().toISOString().slice(0, 10);
  const existing = adherenceStore.get(userId)?.find(item => item.date === date);
  if (existing && !options?.regenerate) {
    return existing;
  }

  // Load baseline profile for personalized context
  const baseline = await getBaselineFields(userId);
  logger.info('✅ [ADHERENCE ENGINE] Baseline profile loaded', {
    userId,
    trainingDaysPerWeek: baseline.trainingDaysPerWeek,
    activityLevel: baseline.activityLevel,
  });

  const sourceInputs = await mergeInputs(userId, options?.override);
  const breakdown = trackAdherenceByDomain(sourceInputs);
  const adherenceScore = calculateAdherenceScore(breakdown);
  const adherenceStatus = scoreToStatus(adherenceScore);
  const history = adherenceStore.get(userId) ?? [];
  const trend = summarizeAdherenceTrend(history, adherenceScore);

  const evidence = buildAdherenceEvidence(adherenceScore, adherenceStatus, sourceInputs, breakdown);
  const fallbackRecommendation = buildAdherenceFallbackRecommendation(
    adherenceStatus,
    adherenceScore,
    trend,
    breakdown,
  );

  let finalRecommendation = fallbackRecommendation;
  const useAIEnrichment = process.env.USE_AI_ENRICHMENT === 'true';
  const useAdherenceAI = process.env.USE_AI_ENRICHMENT_ADHERENCE === 'true';
  const shouldEnrich = adherenceStatus === 'low' || adherenceStatus === 'moderate';

  if (useAIEnrichment && useAdherenceAI && shouldEnrich) {
    logger.info('🔵 [ADHERENCE AI PATH] Attempting AI enrichment', {
      userId,
      adherenceStatus,
      adherenceScore,
    });

    try {
      const aiOutput = await enrichAdherenceRecommendationWithAI(evidence, fallbackRecommendation);
      const normalized = normalizeAdherenceRecommendation(aiOutput, fallbackRecommendation);
      const validation = validateAdherenceRecommendation(normalized);

      if (validation.valid) {
        finalRecommendation = normalized;
        logger.info('✅ [ADHERENCE AI PATH] AI enrichment succeeded', {
          userId,
          source: finalRecommendation.source,
        });
      } else {
        logger.warn('⚠️ [ADHERENCE AI PATH] Validation failed, using fallback', {
          userId,
          errors: validation.errors,
        });
      }
    } catch (error) {
      logger.error('🔴 [ADHERENCE AI PATH] AI enrichment error, using fallback', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    logger.info('🟡 [ADHERENCE FALLBACK PATH] Using fallback recommendation', {
      userId,
      reason: !useAIEnrichment
        ? 'AI enrichment disabled'
        : !useAdherenceAI
        ? 'Adherence AI disabled'
        : 'High adherence - fallback sufficient',
    });
  }

  const legacyRecommendation = buildRecommendation(adherenceScore, trend);
  const hybridRecommendation: AdherenceRecommendation = {
    ...finalRecommendation,
    note: legacyRecommendation.note,
  };

  const record: AdherenceRecord = {
    id: randomUUID(),
    userId,
    date,
    adherenceScore,
    status: adherenceStatus,
    breakdown,
    trend,
    recommendation: hybridRecommendation,
    sourceInputs,
    evidence,
    createdAt: new Date().toISOString(),
  };

  adherenceStore.set(userId, [record, ...history]);

  if (finalRecommendation.source === 'ai_enriched' || finalRecommendation.source === 'fallback') {
    try {
      await createRecommendation({
        userId,
        request: {
          sourceEngine: 'adherence',
          title: `Adherence: ${adherenceStatus}`,
          description: finalRecommendation.summary,
          priority: finalRecommendation.priority === 'critical' ? 'critical' : finalRecommendation.priority === 'important' ? 'important' : 'optimization',
          category: 'lifestyle_change',
          actionType: 'modify',
          actionTarget: 'Daily Execution',
          actionDetails: {
            actions: finalRecommendation.actions || [],
            note: finalRecommendation.note,
          },
          confidenceLevel: 'high',
          dataQualityScore: 85,
          supportingMetrics: [
            {
              name: 'adherence_score',
              value: String(adherenceScore),
              unit: 'score',
              context: `${adherenceStatus} adherence with ${trend} trend`,
            },
          ],
        },
      });

      logger.info('✅ Adherence recommendation persisted to RecommendationEngine', {
        userId,
        adherenceStatus,
        source: finalRecommendation.source,
      });
    } catch (error) {
      logger.error('Failed to persist adherence recommendation', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await createChangeEvent({
    user_id: userId,
    entity_type: 'baseline_profile',
    entity_id: record.id,
    field_name: 'adherence_score',
    new_value: String(record.adherenceScore),
    change_source: 'agent_adjustment',
    rationale: `Adherence engine computed ${record.status} adherence with ${record.trend} trend`,
    confidence: 0.9,
  }).catch(() => undefined);

  return record;
};

export const getAdherenceHistory = async (userId: string): Promise<AdherenceRecord[]> => {
  return adherenceStore.get(userId) ?? [];
};
