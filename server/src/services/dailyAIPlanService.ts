import { randomUUID } from 'crypto';

import { getEngineSnapshot } from './engineStateService';
import { getWorkoutTodayIntegrated } from './workoutTodayIntegratedService';
import { getNutritionTodayIntegrated } from './nutritionTodayIntegratedService';
import { getCrossEngineIntelligenceToday } from './crossEngineIntelligenceService';
import { logger } from '../utils/logger';
import type {
  DailyAIPlan,
  DailyAISummary,
  DailyAIRecoverySnapshot,
  DailyAIPriorityItem,
  DailyAIPredictiveAlert,
  DailyAIWorkoutSection,
  DailyAINutritionSection,
  DailyAICrossEngineSection,
  DailyOverallStatus,
} from '../types/dailyAIPlan';

const dailyAIPlanStore = new Map<string, DailyAIPlan[]>();

interface StatusInputs {
  recoveryScore?: number;
  stressScore?: number;
  jointRisk?: string;
  workoutStatus?: string;
  predictiveRisk?: string;
  hasCriticalPriorities: boolean;
  crossEngineOverallStatus?: string;
}

function buildOverallStatus(inputs: StatusInputs): DailyOverallStatus {
  const { recoveryScore, stressScore, jointRisk, workoutStatus, predictiveRisk, hasCriticalPriorities, crossEngineOverallStatus } = inputs;

  // Use cross-engine intelligence as higher-level orchestration input
  if (crossEngineOverallStatus === 'high_risk') {
    return 'high_risk';
  }

  if (
    hasCriticalPriorities ||
    (recoveryScore != null && recoveryScore < 50) ||
    (stressScore != null && stressScore > 75) ||
    jointRisk === 'high' ||
    predictiveRisk === 'high' ||
    workoutStatus === 'deload'
  ) {
    return 'high_risk';
  }

  // Use cross-engine intelligence to refine constrained/optimal determination
  if (crossEngineOverallStatus === 'constrained') {
    return 'constrained';
  }

  if (
    (recoveryScore != null && recoveryScore < 65) ||
    (stressScore != null && stressScore > 60) ||
    jointRisk === 'moderate' ||
    predictiveRisk === 'moderate' ||
    workoutStatus === 'constrained'
  ) {
    return 'constrained';
  }

  if (crossEngineOverallStatus === 'optimal') {
    return 'optimal';
  }

  if (
    (recoveryScore != null && recoveryScore >= 75) &&
    (stressScore != null && stressScore <= 45) &&
    (jointRisk === 'low' || !jointRisk) &&
    (predictiveRisk === 'low' || !predictiveRisk) &&
    workoutStatus === 'optimal'
  ) {
    return 'optimal';
  }

  return 'moderate';
}

function buildDailyHeadlineAndReasoning(
  status: DailyOverallStatus,
  inputs: StatusInputs,
  crossEnginePatterns?: string[],
): { headline: string; reasoning: string } {
  const hasPatterns = crossEnginePatterns && crossEnginePatterns.length > 0;
  
  switch (status) {
    case 'optimal':
      return {
        headline: 'You are in a strong position to train and recover well today.',
        reasoning: hasPatterns 
          ? `Recovery is strong, stress is controlled, and joint risk is low. ${crossEnginePatterns.join(', ')} align to support progression.`
          : 'Recovery is strong, stress is controlled, and joint risk is low. Today\'s workout and nutrition plans support progression.',
      };

    case 'constrained':
      return {
        headline: 'Today calls for a controlled execution plan.',
        reasoning: hasPatterns
          ? `Recovery is ${inputs.recoveryScore != null && inputs.recoveryScore < 65 ? 'limited' : 'moderate'} and stress is ${inputs.stressScore != null && inputs.stressScore > 60 ? 'elevated' : 'present'}. ${crossEnginePatterns.join(', ')} require coordinated adjustments across workout and nutrition.`
          : `Recovery is ${inputs.recoveryScore != null && inputs.recoveryScore < 65 ? 'limited' : 'moderate'} and stress is ${inputs.stressScore != null && inputs.stressScore > 60 ? 'elevated' : 'present'}, so workout and nutrition have been adjusted to protect performance and recovery.`,
      };

    case 'high_risk':
      return {
        headline: 'Today should prioritize protection and recovery.',
        reasoning: hasPatterns
          ? `Multiple signals indicate elevated strain. ${crossEnginePatterns.join(', ')} are interacting, so the system has shifted to a protective plan to reduce risk.`
          : 'Multiple signals indicate elevated strain, and the system has shifted to a protective plan to reduce risk.',
      };

    case 'moderate':
    default:
      return {
        headline: 'Today requires balanced execution with awareness.',
        reasoning: 'Mixed signals suggest proceeding with the planned approach while monitoring response and maintaining conservative intensity.',
      };
  }
}

function buildRecoverySnapshot(snapshot: any): DailyAIRecoverySnapshot {
  return {
    recoveryScore: snapshot.recoveryCluster?.recoveryScore,
    recoveryStatus: snapshot.recoveryCluster?.recoveryStatus,
    stressScore: snapshot.recoveryCluster?.stressScore,
    stressStatus: snapshot.recoveryCluster?.stressStatus,
    jointRisk: snapshot.recoveryCluster?.jointRiskLevel,
    adherenceScore: snapshot.workout?.adherenceScore,
  };
}

function buildTopPriorities(prioritizedRecs: any[]): DailyAIPriorityItem[] {
  if (!prioritizedRecs || prioritizedRecs.length === 0) {
    return [];
  }

  return prioritizedRecs.slice(0, 3).map(rec => ({
    priority: rec.priority || 'important',
    summary: rec.summary || rec.recommendation || 'Priority item',
    source: rec.source || rec.sourceEngine || 'system',
    actions: rec.actions || rec.actionItems || undefined,
  }));
}

function buildPredictiveAlerts(predictive: any): DailyAIPredictiveAlert[] {
  if (!predictive || !predictive.alerts) {
    return [];
  }

  const alerts = Array.isArray(predictive.alerts) ? predictive.alerts : [];
  
  return alerts
    .filter((alert: any) => alert.level === 'high' || alert.level === 'moderate')
    .slice(0, 3)
    .map((alert: any) => ({
      level: alert.level || 'moderate',
      summary: alert.summary || alert.message || 'Predictive alert',
      rationale: alert.rationale || alert.reason,
    }));
}

function buildWorkoutSection(workoutToday: any): DailyAIWorkoutSection {
  if (!workoutToday) {
    return {
      summary: 'No workout plan available for today',
    };
  }

  const adjustmentSummaries = workoutToday.adjustments?.map((adj: any) => adj.description || adj.type) || [];

  return {
    summary: workoutToday.summary || 'Workout plan generated',
    workoutType: workoutToday.workoutType,
    cycleWeek: workoutToday.cycleWeek,
    cyclePhase: workoutToday.cyclePhase,
    workoutStatus: workoutToday.workoutStatus,
    adjustments: adjustmentSummaries.length > 0 ? adjustmentSummaries : undefined,
    exercises: workoutToday.exercises?.map((ex: any) => ({
      name: ex.name,
      sets: ex.sets,
      reps: ex.reps,
      intensity: ex.intensity,
      rest: ex.rest,
      substitution: ex.substitution,
    })),
  };
}

function buildNutritionSection(nutritionToday: any): DailyAINutritionSection {
  if (!nutritionToday) {
    return {
      summary: 'No nutrition plan available for today',
    };
  }

  const adjustmentSummaries = nutritionToday.adjustments?.map((adj: any) => adj.adjustment || adj.type) || [];

  return {
    summary: nutritionToday.summary || 'Nutrition plan generated',
    calories: nutritionToday.targets?.calories,
    protein: nutritionToday.targets?.protein,
    carbs: nutritionToday.targets?.carbs,
    fats: nutritionToday.targets?.fats,
    hydrationOz: nutritionToday.targets?.hydrationOz,
    mealTiming: nutritionToday.mealTiming,
    adjustments: adjustmentSummaries.length > 0 ? adjustmentSummaries : undefined,
  };
}

function buildAutonomousSummary(autonomous: any): string | undefined {
  if (!autonomous || !autonomous.adjustments || autonomous.adjustments.length === 0) {
    return undefined;
  }

  const adjustmentCount = autonomous.adjustments.length;
  return `The system made ${adjustmentCount} autonomous adjustment${adjustmentCount > 1 ? 's' : ''} to optimize your plan.`;
}

function buildGoalDrivenSummary(goalDriven: any, snapshot: any): string | undefined {
  const primaryGoal = (snapshot as any).goal?.primaryGoal || (snapshot as any).goals?.primaryGoal;
  
  if (!primaryGoal) {
    return undefined;
  }

  const goalMap: Record<string, string> = {
    muscle_gain: 'muscle gain',
    fat_loss: 'fat loss',
    strength: 'strength development',
    performance: 'athletic performance',
    health: 'overall health',
    injury_prevention: 'injury prevention',
  };

  const goalLabel = goalMap[primaryGoal] || primaryGoal;
  return `Today's plan is optimized toward ${goalLabel}.`;
}

function buildCrossEngineSection(crossEngineIntelligence: any): DailyAICrossEngineSection | undefined {
  if (!crossEngineIntelligence) {
    return undefined;
  }

  const topPatterns = crossEngineIntelligence.patterns
    ?.slice(0, 3)
    .map((p: any) => ({
      name: p.name,
      summary: p.summary,
      severity: p.severity,
    }));

  return {
    overallStatus: crossEngineIntelligence.overallStatus,
    summary: crossEngineIntelligence.recommendation?.summary,
    topPatterns,
    actions: crossEngineIntelligence.recommendation?.actions?.slice(0, 5),
  };
}

export async function getDailyAIPlan(
  userId: string,
  options?: { regenerate?: boolean },
): Promise<DailyAIPlan> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = dailyAIPlanStore.get(userId)?.find(record => record.date === date);
  
  if (existing && !options?.regenerate) {
    logger.info('📋 [DAILY AI PLAN] Returning cached daily plan', { userId, date });
    return existing;
  }

  logger.info('🔵 [DAILY AI PLAN] Aggregation started', { userId, date });

  const snapshot = await getEngineSnapshot(userId);
  
  let workoutToday;
  let nutritionToday;
  let crossEngineIntelligence;

  try {
    workoutToday = await getWorkoutTodayIntegrated(userId);
  } catch (error) {
    logger.warn('⚠️ [DAILY AI PLAN] Workout today not available', { userId });
  }

  try {
    nutritionToday = await getNutritionTodayIntegrated(userId);
  } catch (error) {
    logger.warn('⚠️ [DAILY AI PLAN] Nutrition today not available', { userId });
  }

  try {
    crossEngineIntelligence = await getCrossEngineIntelligenceToday(userId);
    logger.info('✅ [DAILY AI PLAN] Cross-engine intelligence loaded', { 
      userId, 
      overallStatus: crossEngineIntelligence?.overallStatus,
      patternCount: crossEngineIntelligence?.patterns?.length || 0,
    });
  } catch (error) {
    logger.warn('⚠️ [DAILY AI PLAN] Cross-engine intelligence not available', { userId });
  }

  const prioritizedRecs: any[] = [];
  const predictive: any = snapshot.predictiveIntelligence || (snapshot as any).predictive;
  const autonomous: any = snapshot.autonomousOptimization || (snapshot as any).autonomous;
  const goalDriven: any = snapshot.goalDrivenOptimization || (snapshot as any).goalDriven;

  logger.info('✅ [DAILY AI PLAN] Sources loaded', {
    userId,
    hasWorkout: !!workoutToday,
    hasNutrition: !!nutritionToday,
    priorityCount: prioritizedRecs?.length || 0,
    hasPredictive: !!predictive,
  });

  const recoverySnapshot = buildRecoverySnapshot(snapshot);
  const topPriorities = buildTopPriorities(prioritizedRecs);
  const predictiveAlerts = buildPredictiveAlerts(predictive);
  const workout = buildWorkoutSection(workoutToday);
  const nutrition = buildNutritionSection(nutritionToday);

  const hasCriticalPriorities = topPriorities.some(p => p.priority === 'critical');

  const statusInputs: StatusInputs = {
    recoveryScore: recoverySnapshot.recoveryScore,
    stressScore: recoverySnapshot.stressScore,
    jointRisk: recoverySnapshot.jointRisk,
    workoutStatus: workoutToday?.workoutStatus,
    predictiveRisk: predictive?.riskLevel,
    hasCriticalPriorities,
    crossEngineOverallStatus: crossEngineIntelligence?.overallStatus,
  };

  const overallStatus = buildOverallStatus(statusInputs);
  
  const crossEnginePatternNames = crossEngineIntelligence?.patterns
    ?.slice(0, 2)
    .map((p: any) => p.name);
  
  const { headline, reasoning } = buildDailyHeadlineAndReasoning(
    overallStatus, 
    statusInputs,
    crossEnginePatternNames,
  );

  logger.info('✅ [DAILY AI PLAN] Status built', {
    userId,
    overallStatus,
    hasCriticalPriorities,
  });

  const summary: DailyAISummary = {
    overallStatus,
    headline,
    reasoning,
  };

  const autonomousSummary = buildAutonomousSummary(autonomous);
  const goalDrivenSummary = buildGoalDrivenSummary(goalDriven, snapshot);
  const crossEngineSection = buildCrossEngineSection(crossEngineIntelligence);

  if (crossEngineSection) {
    logger.info('✅ [DAILY AI PLAN] Cross-engine intelligence applied', {
      userId,
      crossEngineStatus: crossEngineSection.overallStatus,
      patternCount: crossEngineSection.topPatterns?.length || 0,
    });
  }

  const plan: DailyAIPlan = {
    id: randomUUID(),
    userId,
    date,
    summary,
    recoverySnapshot,
    topPriorities,
    predictiveAlerts,
    workout,
    nutrition,
    crossEngineIntelligence: crossEngineSection,
    autonomousSummary,
    goalDrivenSummary,
    source: 'aggregated',
    createdAt: new Date().toISOString(),
  };

  const history = dailyAIPlanStore.get(userId) ?? [];
  dailyAIPlanStore.set(userId, [plan, ...history]);

  logger.info('✅ [DAILY AI PLAN] Generated', {
    userId,
    overallStatus,
    priorityCount: topPriorities.length,
    alertCount: predictiveAlerts.length,
  });

  return plan;
}

export async function getDailyAIPlanHistory(userId: string): Promise<DailyAIPlan[]> {
  return dailyAIPlanStore.get(userId) ?? [];
}
