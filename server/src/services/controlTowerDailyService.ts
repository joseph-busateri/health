import { randomUUID } from 'crypto';

import { getDailyAIPlan } from './dailyAIPlanService';
import { getCrossEngineIntelligenceToday } from './crossEngineIntelligenceService';
import { getMetabolicToday } from './metabolicEngineService';
import { getCardiovascularToday } from './cardiovascularEngineService';
import { getSexualHealthToday } from './sexualHealthEngineService';
import { getTopFusionPriorities, getFusionSummary } from './fusionPrioritizationEnhancer';
import { logger } from '../utils/logger';
import type {
  ControlTowerDailyResponse,
  ControlTowerTrustMetadata,
  ControlTowerPriorityCard,
  ControlTowerPredictiveCard,
  ControlTowerWorkoutCard,
  ControlTowerNutritionCard,
  ControlTowerCrossEngineCard,
  ControlTowerMetabolicCard,
  ControlTowerCardiovascularCard,
  ControlTowerSexualHealthCard,
  ControlTowerQuickActions,
  DataAvailabilityState,
} from '../types/controlTowerDaily';
import type { DailyAIPlan } from '../types/dailyAIPlan';

const controlTowerDailyStore = new Map<string, ControlTowerDailyResponse[]>();

function buildTrustMetadata(dailyPlan: DailyAIPlan): ControlTowerTrustMetadata {
  const missingDataSources: string[] = [];
  let sectionsAvailable = 0;
  const totalSections = 6;

  if (dailyPlan.recoverySnapshot && Object.keys(dailyPlan.recoverySnapshot).length > 0) {
    sectionsAvailable++;
  } else {
    missingDataSources.push('recovery_snapshot');
  }

  if (dailyPlan.workout && dailyPlan.workout.summary) {
    sectionsAvailable++;
  } else {
    missingDataSources.push('workout');
  }

  if (dailyPlan.nutrition && dailyPlan.nutrition.summary) {
    sectionsAvailable++;
  } else {
    missingDataSources.push('nutrition');
  }

  if (dailyPlan.topPriorities && dailyPlan.topPriorities.length > 0) {
    sectionsAvailable++;
  } else {
    missingDataSources.push('priorities');
  }

  if (dailyPlan.predictiveAlerts && dailyPlan.predictiveAlerts.length > 0) {
    sectionsAvailable++;
  } else {
    missingDataSources.push('predictive_alerts');
  }

  if (dailyPlan.summary) {
    sectionsAvailable++;
  } else {
    missingDataSources.push('summary');
  }

  let dataAvailabilityState: DataAvailabilityState;
  if (sectionsAvailable >= 5) {
    dataAvailabilityState = 'complete';
  } else if (sectionsAvailable >= 3) {
    dataAvailabilityState = 'partial';
  } else {
    dataAvailabilityState = 'minimal';
  }

  return {
    lastUpdated: dailyPlan.createdAt,
    dataAvailabilityState,
    missingDataSources: missingDataSources.length > 0 ? missingDataSources : undefined,
    deviceSyncRecency: undefined,
  };
}

function buildPriorityCards(dailyPlan: DailyAIPlan): ControlTowerPriorityCard[] {
  if (!dailyPlan.topPriorities || dailyPlan.topPriorities.length === 0) {
    return [];
  }

  return dailyPlan.topPriorities.slice(0, 3).map(priority => ({
    priority: priority.priority as 'critical' | 'important' | 'optimization',
    title: priority.summary,
    source: priority.source,
    actions: priority.actions && priority.actions.length <= 3 ? priority.actions : undefined,
  }));
}

function buildPredictiveCards(dailyPlan: DailyAIPlan): ControlTowerPredictiveCard[] {
  if (!dailyPlan.predictiveAlerts || dailyPlan.predictiveAlerts.length === 0) {
    return [];
  }

  const sortedAlerts = [...dailyPlan.predictiveAlerts].sort((a, b) => {
    const levelOrder = { high: 0, moderate: 1, low: 2 };
    return levelOrder[a.level] - levelOrder[b.level];
  });

  return sortedAlerts.slice(0, 3).map(alert => ({
    level: alert.level as 'low' | 'moderate' | 'high',
    title: alert.summary,
    rationale: alert.rationale,
  }));
}

function buildWorkoutCard(dailyPlan: DailyAIPlan): ControlTowerWorkoutCard {
  if (!dailyPlan.workout) {
    return {
      title: "Today's Workout",
      summary: 'No workout plan available for today',
    };
  }

  const topAdjustments = dailyPlan.workout.adjustments?.slice(0, 3);

  return {
    title: "Today's Workout",
    summary: dailyPlan.workout.summary,
    workoutType: dailyPlan.workout.workoutType,
    cycleWeek: dailyPlan.workout.cycleWeek,
    cyclePhase: dailyPlan.workout.cyclePhase,
    topAdjustments: topAdjustments && topAdjustments.length > 0 ? topAdjustments : undefined,
  };
}

function buildNutritionCard(dailyPlan: DailyAIPlan): ControlTowerNutritionCard {
  if (!dailyPlan.nutrition) {
    return {
      title: "Today's Nutrition",
      summary: 'No nutrition plan available for today',
    };
  }

  const topAdjustments = dailyPlan.nutrition.adjustments?.slice(0, 3);

  return {
    title: "Today's Nutrition",
    summary: dailyPlan.nutrition.summary,
    calories: dailyPlan.nutrition.calories,
    protein: dailyPlan.nutrition.protein,
    carbs: dailyPlan.nutrition.carbs,
    fats: dailyPlan.nutrition.fats,
    hydrationOz: dailyPlan.nutrition.hydrationOz,
    topAdjustments: topAdjustments && topAdjustments.length > 0 ? topAdjustments : undefined,
  };
}

async function buildMetabolicCard(userId: string): Promise<ControlTowerMetabolicCard | undefined> {
  try {
    const metabolicData = await getMetabolicToday(userId);
    if (!metabolicData) return undefined;

    return {
      title: 'Metabolic Health',
      summary: metabolicData.recommendation.summary,
      status: metabolicData.metabolicStatus,
      actions: metabolicData.recommendation.actions?.slice(0, 3),
    };
  } catch (error) {
    logger.warn('Failed to build metabolic card', { error: (error as Error).message });
    return undefined;
  }
}

async function buildCardiovascularCard(userId: string): Promise<ControlTowerCardiovascularCard | undefined> {
  try {
    const cardiovascularData = await getCardiovascularToday(userId);
    if (!cardiovascularData) return undefined;

    return {
      title: 'Cardiovascular Status',
      summary: cardiovascularData.recommendation.summary,
      status: cardiovascularData.cardiovascularStatus,
      actions: cardiovascularData.recommendation.actions?.slice(0, 3),
    };
  } catch (error) {
    logger.warn('Failed to build cardiovascular card', { error: (error as Error).message });
    return undefined;
  }
}

async function buildSexualHealthCard(userId: string): Promise<ControlTowerSexualHealthCard | undefined> {
  try {
    const sexualHealthData = await getSexualHealthToday(userId);
    if (!sexualHealthData) return undefined;

    return {
      title: 'Sexual Health',
      summary: sexualHealthData.recommendation.summary,
      status: sexualHealthData.sexualHealthStatus,
      actions: sexualHealthData.recommendation.actions?.slice(0, 3),
    };
  } catch (error) {
    logger.warn('Failed to build sexual health card', { error: (error as Error).message });
    return undefined;
  }
}

async function buildCrossEngineCard(userId: string): Promise<ControlTowerCrossEngineCard | undefined> {
  try {
    const crossEngineData = await getCrossEngineIntelligenceToday(userId);
    if (!crossEngineData) return undefined;

    const topPatterns = crossEngineData.patterns
      ?.slice(0, 3)
      .map(p => ({
        name: p.name,
        summary: p.summary,
        severity: p.severity,
      }));

    return {
      title: 'Cross-Engine Intelligence',
      summary: crossEngineData.recommendation.summary,
      overallStatus: crossEngineData.overallStatus,
      topPatterns,
      keyActions: crossEngineData.recommendation.actions?.slice(0, 4),
    };
  } catch (error) {
    logger.warn('Failed to build cross-engine card', { error: (error as Error).message });
    return undefined;
  }
}

function buildQuickActions(): ControlTowerQuickActions {
  return {
    askCoach: true,
    viewWorkout: true,
    viewNutrition: true,
    viewPriorities: true,
  };
}

export async function getControlTowerDaily(
  userId: string,
  options?: { regenerate?: boolean },
): Promise<ControlTowerDailyResponse> {
  const date = new Date().toISOString().slice(0, 10);
  const existing = controlTowerDailyStore.get(userId)?.find(record => record.date === date);
  
  if (existing && !options?.regenerate) {
    logger.info('📋 [CONTROL TOWER DAILY] Returning cached response', { userId, date });
    return existing;
  }

  logger.info('🔵 [CONTROL TOWER DAILY] Load started', { userId, date });

  const dailyPlan = await getDailyAIPlan(userId, options);

  logger.info('✅ [CONTROL TOWER DAILY] Daily plan loaded', {
    userId,
    overallStatus: dailyPlan.summary.overallStatus,
  });

  const trust = buildTrustMetadata(dailyPlan);

  logger.info('✅ [CONTROL TOWER DAILY] Trust metadata built', {
    userId,
    dataAvailabilityState: trust.dataAvailabilityState,
    missingCount: trust.missingDataSources?.length || 0,
  });

  const priorities = buildPriorityCards(dailyPlan);
  const predictiveAlerts = buildPredictiveCards(dailyPlan);
  const workout = buildWorkoutCard(dailyPlan);
  const nutrition = buildNutritionCard(dailyPlan);
  const crossEngine = await buildCrossEngineCard(userId);
  const metabolic = await buildMetabolicCard(userId);
  const cardiovascular = await buildCardiovascularCard(userId);
  const sexualHealth = await buildSexualHealthCard(userId);
  const quickActions = buildQuickActions();

  // Load fusion intelligence (additive)
  const fusionPriorities = await getTopFusionPriorities(userId, 3);
  const fusionSummary = await getFusionSummary(userId);

  if (fusionPriorities.length > 0) {
    logger.info('✅ [CONTROL TOWER DAILY] Fusion priorities loaded', {
      userId,
      fusionPriorityCount: fusionPriorities.length,
      fusionSummary,
    });
  }

  if (crossEngine) {
    logger.info('✅ [CONTROL TOWER DAILY] Cross-engine card built', {
      userId,
      crossEngineStatus: crossEngine.overallStatus,
      patternCount: crossEngine.topPatterns?.length || 0,
    });
  }

  const response: ControlTowerDailyResponse = {
    id: randomUUID(),
    userId,
    date,
    overallStatus: dailyPlan.summary.overallStatus as 'optimal' | 'moderate' | 'constrained' | 'high_risk',
    headline: dailyPlan.summary.headline,
    reasoning: dailyPlan.summary.reasoning,
    trust,
    crossEngine,
    priorities,
    predictiveAlerts,
    workout,
    nutrition,
    metabolic,
    cardiovascular,
    sexualHealth,
    quickActions,
    source: 'control_tower_daily',
    createdAt: new Date().toISOString(),
  };

  const history = controlTowerDailyStore.get(userId) ?? [];
  controlTowerDailyStore.set(userId, [response, ...history]);

  logger.info('✅ [CONTROL TOWER DAILY] Generated', {
    userId,
    overallStatus: response.overallStatus,
    priorityCount: priorities.length,
    alertCount: predictiveAlerts.length,
    dataAvailabilityState: trust.dataAvailabilityState,
  });

  return response;
}

export async function getControlTowerDailyHistory(userId: string): Promise<ControlTowerDailyResponse[]> {
  return controlTowerDailyStore.get(userId) ?? [];
}
