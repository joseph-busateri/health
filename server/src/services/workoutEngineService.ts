import { randomUUID } from 'crypto';
import { logger } from '../utils/logger';
import { getBaselineFields } from './baselineContextService';
import { getLatestBodyCompositionContext, getBodyFatCategory } from './bodyCompositionContextService';
import { getEngineSnapshot } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import { createRecommendation } from './recommendationEngineService';
import type {
  WorkoutStatus,
  WorkoutSourceInputs,
  WorkoutEvidence,
  WorkoutEvidenceSignal,
  WorkoutRecommendation,
  WorkoutEngineRecord,
  WorkoutRecommendationPriority,
} from '../types/workoutEngine';

const workoutEngineStore = new Map<string, WorkoutEngineRecord[]>();

function determineWorkoutStatus(
  recoveryScore?: number,
  stressScore?: number,
  jointRisk?: string,
): WorkoutStatus {
  const recovery = recoveryScore ?? 65;
  const stress = stressScore ?? 50;
  const joint = jointRisk?.toLowerCase() || 'low';

  if (recovery < 50 || stress > 75 || joint === 'high') {
    return 'deload';
  }

  if (recovery < 65 || stress > 60 || joint === 'moderate') {
    return 'constrained';
  }

  if (recovery < 75 || stress > 45) {
    return 'moderate';
  }

  return 'optimal';
}

function buildWorkoutEvidence(
  workoutStatus: WorkoutStatus,
  sourceInputs: WorkoutSourceInputs,
  bodyComp?: ReturnType<typeof getLatestBodyCompositionContext> extends Promise<infer T> ? T : never
): WorkoutEvidence {
  const signals: WorkoutEvidenceSignal[] = [];

  // Add body composition-based evidence signals
  if (bodyComp?.hasBodyComposition) {
    if (bodyComp.dryLeanMassLb !== null) {
      signals.push({
        name: 'Lean Mass',
        value: bodyComp.dryLeanMassLb,
        interpretation: `${bodyComp.dryLeanMassLb.toFixed(1)} lbs - Use for strength target calculations`,
      });
    }

    if (bodyComp.bodyFatPercentage !== null) {
      const baseline = { sex: 'male' as const }; // TODO: Get from baseline profile
      const bodyFatCategory = getBodyFatCategory(bodyComp.bodyFatPercentage, baseline.sex);
      signals.push({
        name: 'Body Fat Percentage',
        value: bodyComp.bodyFatPercentage,
        interpretation: `${bodyFatCategory} (${bodyComp.bodyFatPercentage.toFixed(1)}%) - Informs recomposition strategy`,
      });
    }

    if (bodyComp.skeletalMuscleMassLb !== null) {
      signals.push({
        name: 'Skeletal Muscle Mass',
        value: bodyComp.skeletalMuscleMassLb,
        interpretation: `${bodyComp.skeletalMuscleMassLb.toFixed(1)} lbs - Track muscle preservation during fat loss`,
      });
    }
  }

  if (sourceInputs.recoveryScore != null) {
    const value = sourceInputs.recoveryScore;
    signals.push({
      name: 'Recovery Score',
      value,
      interpretation:
        value >= 75
          ? 'Recovery is high. Training capacity supports progressive overload.'
          : value >= 65
          ? 'Recovery is moderate. Maintain current training load.'
          : value >= 50
          ? 'Recovery is limited. Training intensity should be reduced.'
          : 'Recovery is very low. Deload protocol recommended.',
    });
  }

  if (sourceInputs.stressScore != null) {
    const value = sourceInputs.stressScore;
    signals.push({
      name: 'Stress Score',
      value,
      interpretation:
        value <= 40
          ? 'Stress is low. CNS capacity supports high-intensity training.'
          : value <= 55
          ? 'Stress is moderate. Keep intensity submaximal.'
          : value <= 70
          ? 'Stress is elevated. Reduce CNS-demanding exercises.'
          : 'Stress is very high. Minimize CNS load and reduce intensity.',
    });
  }

  if (sourceInputs.jointRisk != null) {
    const value = sourceInputs.jointRisk;
    signals.push({
      name: 'Joint Risk',
      value,
      interpretation:
        value === 'low'
          ? 'Joint health is good. Full exercise selection available.'
          : value === 'moderate'
          ? 'Joint risk is moderate. Exercise substitutions recommended.'
          : 'Joint risk is high. Joint-friendly alternatives required.',
    });
  }

  if (sourceInputs.adherenceScore != null) {
    const value = sourceInputs.adherenceScore;
    signals.push({
      name: 'Adherence Score',
      value,
      interpretation:
        value >= 80
          ? 'User execution consistency supports progressive loading.'
          : value >= 60
          ? 'Adherence is moderate. Plan complexity may need adjustment.'
          : 'Adherence is low. Simplify workout plan to improve consistency.',
    });
  }

  if (sourceInputs.predictiveRisk != null) {
    const value = sourceInputs.predictiveRisk;
    signals.push({
      name: 'Predictive Risk',
      value,
      interpretation:
        value === 'low'
          ? 'Predictive models indicate low injury/overtraining risk.'
          : value === 'moderate'
          ? 'Predictive models suggest caution with training load.'
          : 'Predictive models indicate elevated risk. Conservative approach recommended.',
    });
  }

  if (sourceInputs.goalAlignment != null) {
    const value = sourceInputs.goalAlignment;
    signals.push({
      name: 'Goal Alignment',
      value,
      interpretation:
        value >= 80
          ? 'Current workout plan is well-aligned with user goals.'
          : value >= 60
          ? 'Workout plan has moderate alignment with goals. Minor adjustments may help.'
          : 'Workout plan alignment with goals is low. Consider plan revision.',
    });
  }

  const summary =
    workoutStatus === 'optimal'
      ? `Workout readiness is optimal. All signals support progressive training.`
      : workoutStatus === 'moderate'
      ? `Workout readiness is moderate. Maintain current load with submaximal effort.`
      : workoutStatus === 'constrained'
      ? `Workout readiness is constrained. Reduce volume and intensity.`
      : `Workout readiness requires deload. Significant load reduction needed.`;

  return {
    workoutStatus,
    sourceInputs,
    signals,
    summary,
  };
}

function buildWorkoutFallbackRecommendation(
  workoutStatus: WorkoutStatus,
  sourceInputs: WorkoutSourceInputs,
): WorkoutRecommendation {
  let priority: WorkoutRecommendationPriority;
  let summary: string;
  let actions: string[];

  if (workoutStatus === 'deload') {
    priority = 'critical';
    summary = 'Deload protocol required. Reduce volume 30-40% and intensity 20-30%.';
    actions = [
      'Reduce total sets by 30-40%',
      'Lower intensity to 60-70% of working max',
      'Focus on movement quality over load',
      'Extend rest periods between sets',
      'Consider active recovery or complete rest day',
    ];
  } else if (workoutStatus === 'constrained') {
    priority = 'important';
    summary = 'Training capacity is constrained. Reduce volume 20-25% and cap intensity.';
    actions = [
      'Reduce total sets by 20-25%',
      'Cap intensity at 75-80% of working max',
      'Prioritize compound movements',
      'Reduce or eliminate accessory work',
      'Monitor recovery signals closely',
    ];
  } else if (workoutStatus === 'moderate') {
    priority = 'important';
    summary = 'Maintain current training load. Keep effort submaximal.';
    actions = [
      'Execute planned workout as programmed',
      'Keep RPE at 7-8 (avoid max effort)',
      'Monitor form quality throughout session',
      'Adjust load if fatigue accumulates',
      'Prioritize recovery post-workout',
    ];
  } else {
    priority = 'optimization';
    summary = 'Training capacity is optimal. Consider progressive overload opportunity.';
    actions = [
      'Execute planned workout with full intensity',
      'Consider 5-10% volume or intensity increase if appropriate',
      'Maintain excellent form throughout',
      'Push working sets to RPE 8-9',
      'Continue monitoring recovery signals',
    ];
  }

  const rationale = `Workout status is ${workoutStatus} based on recovery (${sourceInputs.recoveryScore ?? 'N/A'}), stress (${sourceInputs.stressScore ?? 'N/A'}), and joint risk (${sourceInputs.jointRisk ?? 'N/A'}).`;

  return {
    type: 'workout',
    priority,
    summary,
    rationale,
    actions,
    source: 'fallback',
  };
}

export async function getWorkoutRecommendationToday(
  userId: string,
  options?: { regenerate?: boolean; override?: WorkoutSourceInputs },
): Promise<WorkoutEngineRecord> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = workoutEngineStore.get(userId)?.find(record => record.date === date);
  if (existing && !options?.regenerate) {
    return existing;
  }

  // Load baseline profile for personalized context
  const baseline = await getBaselineFields(userId);
  logger.info('✅ [WORKOUT ENGINE] Baseline profile loaded', {
    userId,
    trainingExperience: baseline.trainingExperience,
    trainingDaysPerWeek: baseline.trainingDaysPerWeek,
    activityLevel: baseline.activityLevel,
  });

  // Load body composition for training strategy
  const bodyComp = await getLatestBodyCompositionContext(userId);
  if (bodyComp.hasBodyComposition) {
    logger.info('✅ [WORKOUT ENGINE] Body composition loaded', {
      userId,
      latestScanDate: bodyComp.latestScanDate,
      leanMassLb: bodyComp.dryLeanMassLb,
      bodyFatPercentage: bodyComp.bodyFatPercentage,
      skeletalMuscleMassLb: bodyComp.skeletalMuscleMassLb,
    });
  } else {
    logger.info('⚠️ [WORKOUT ENGINE] No body composition available', { userId });
  }

  const snapshot = await getEngineSnapshot(userId);
  const sourceInputs: WorkoutSourceInputs = {
    recoveryScore: options?.override?.recoveryScore ?? snapshot.recoveryCluster?.recoveryScore,
    stressScore: options?.override?.stressScore ?? snapshot.recoveryCluster?.stressScore,
    jointRisk: options?.override?.jointRisk ?? snapshot.recoveryCluster?.jointRiskLevel,
    adherenceScore: options?.override?.adherenceScore ?? snapshot.workout?.adherenceScore,
    predictiveRisk: options?.override?.predictiveRisk,
    goalAlignment: options?.override?.goalAlignment,
    currentWeek: options?.override?.currentWeek,
    trainingStyle: options?.override?.trainingStyle,
  };

  const workoutStatus = determineWorkoutStatus(
    sourceInputs.recoveryScore,
    sourceInputs.stressScore,
    sourceInputs.jointRisk,
  );

  // Build evidence (include body composition)
  const evidence = buildWorkoutEvidence(workoutStatus, sourceInputs, bodyComp);
  const fallbackRecommendation = buildWorkoutFallbackRecommendation(workoutStatus, sourceInputs);

  let finalRecommendation = fallbackRecommendation;
  const useAIEnrichment = process.env.USE_AI_ENRICHMENT === 'true';
  const useWorkoutAI = process.env.USE_AI_ENRICHMENT_WORKOUT === 'true';
  const shouldEnrich = workoutStatus === 'moderate' || workoutStatus === 'constrained' || workoutStatus === 'deload';

  if (useAIEnrichment && useWorkoutAI && shouldEnrich) {
    logger.info('🔵 [WORKOUT AI PATH] Attempting AI enrichment', {
      userId,
      workoutStatus,
    });

    try {
      const aiOutput = await enrichWorkoutRecommendationWithAI(evidence, fallbackRecommendation);
      const normalized = normalizeWorkoutRecommendation(aiOutput, fallbackRecommendation);
      const validation = validateWorkoutRecommendation(normalized);

      if (validation.valid) {
        finalRecommendation = normalized;
        logger.info('✅ [WORKOUT AI PATH] AI enrichment succeeded', {
          userId,
          source: finalRecommendation.source,
        });
      } else {
        logger.warn('⚠️ [WORKOUT AI PATH] Validation failed, using fallback', {
          userId,
          errors: validation.errors,
        });
      }
    } catch (error) {
      logger.error('🔴 [WORKOUT AI PATH] AI enrichment error, using fallback', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  } else {
    logger.info('🟡 [WORKOUT FALLBACK PATH] Using fallback recommendation', {
      userId,
      reason: !useAIEnrichment
        ? 'AI enrichment disabled'
        : !useWorkoutAI
        ? 'Workout AI disabled'
        : 'Optimal status - fallback sufficient',
    });
  }

  const record: WorkoutEngineRecord = {
    id: randomUUID(),
    userId,
    date,
    workoutStatus,
    sourceInputs,
    evidence,
    recommendation: finalRecommendation,
    createdAt: new Date().toISOString(),
  };

  const history = workoutEngineStore.get(userId) ?? [];
  workoutEngineStore.set(userId, [record, ...history]);

  if (finalRecommendation.source === 'ai_enriched' || finalRecommendation.source === 'fallback') {
    try {
      await createRecommendation({
        userId,
        request: {
          sourceEngine: 'workout',
          title: `Workout: ${workoutStatus}`,
          description: finalRecommendation.summary,
          priority: finalRecommendation.priority === 'critical' ? 'critical' : finalRecommendation.priority === 'important' ? 'important' : 'optimization',
          category: 'workout_modification',
          actionType: 'modify',
          actionTarget: 'Today\'s Workout',
          actionDetails: {
            actions: finalRecommendation.actions,
            rationale: finalRecommendation.rationale,
          },
          confidenceLevel: 'high',
          dataQualityScore: 85,
          supportingMetrics: [
            {
              name: 'workout_status',
              value: workoutStatus,
              unit: 'status',
              context: `${workoutStatus} readiness based on recovery, stress, and joint signals`,
            },
          ],
        },
      });

      logger.info('✅ Workout recommendation persisted to RecommendationEngine', {
        userId,
        workoutStatus,
        source: finalRecommendation.source,
      });
    } catch (error) {
      logger.error('Failed to persist workout recommendation', {
        userId,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  await createChangeEvent({
    user_id: userId,
    entity_type: 'workout_plan',
    entity_id: record.id,
    field_name: 'workout_status',
    new_value: workoutStatus,
    change_source: 'agent_adjustment',
    rationale: `Workout engine computed ${workoutStatus} readiness`,
    confidence: 0.9,
  }).catch(() => undefined);

  return record;
}

export async function getWorkoutRecommendationHistory(userId: string): Promise<WorkoutEngineRecord[]> {
  return workoutEngineStore.get(userId) ?? [];
}
