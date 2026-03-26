import 'dotenv/config';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'crypto';

import type {
  ComponentStatus,
  ComponentTrend,
  ControlTowerSummary,
  DailyLogInput,
  DailyLogRecord,
  DashboardSummary,
  HealthComponentKey,
  HealthComponentScore,
} from '../types/dailyLog';
import type { MealLogRecord } from '../types/mealLog';
import type { ReminderListResponse } from '../types/reminder';
import type { BaselineConfig } from '../types/baselineConfig';
import type {
  CardioMetricRecord,
  SexualHealthCheckInRecord,
  SexualHealthStatusRecord,
} from '../types/healthMetrics';
import { getMealLogsForUser } from './mealLogService';
import { getRemindersForUser } from './reminderService';
import { getBaselineConfig } from './baselineConfigService';
import {
  getLatestSexualHealthStatus,
  getRecentCardioMetrics,
  getRecentSexualHealthCheckIns,
} from './healthMetricsService';
import { logEvent } from '../utils/logger';

const {
  SUPABASE_URL,
  SUPABASE_SERVICE_ROLE_KEY,
  SUPABASE_DAILY_LOGS_TABLE,
} = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.');
}

const TABLE_NAME = SUPABASE_DAILY_LOGS_TABLE || 'daily_logs';
const VECTOR_DIMENSION = 1536;

const supabase: SupabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

interface DailyLogRow {
  id: string;
  user_id: string;
  date: string;
  sleep_hours: number | string;
  recovery_feeling: number | string;
  stress_level: number | string;
  workout_adherence: number | string;
  notes: string | null;
  embedding: number[] | null;
  created_at: string;
  updated_at: string;
}

const toNumber = (value: number | string | null | undefined, fallback = 0): number => {
  if (typeof value === 'number') {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isNaN(parsed) ? fallback : parsed;
  }

  return fallback;
};

const mapRowToRecord = (row: DailyLogRow): DailyLogRecord => ({
  id: row.id,
  userId: row.user_id,
  date: row.date,
  sleepHours: toNumber(row.sleep_hours),
  recoveryFeeling: toNumber(row.recovery_feeling),
  stressLevel: toNumber(row.stress_level),
  workoutAdherence: toNumber(row.workout_adherence),
  notes: row.notes ?? undefined,
  embedding: row.embedding ?? undefined,
  createdAt: row.created_at,
  updatedAt: row.updated_at,
});

const placeholderEmbedding = () => Array.from({ length: VECTOR_DIMENSION }, () => 0);

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const determineRecoveryScoreLabel = (log: DailyLogRecord): 'low' | 'moderate' | 'high' => {
  const lowRecovery = log.sleepHours < 6 || log.recoveryFeeling <= 2 || log.stressLevel >= 4;
  if (lowRecovery) {
    return 'low';
  }

  let borderlineCount = 0;
  if (log.sleepHours >= 6 && log.sleepHours < 7) {
    borderlineCount += 1;
  }
  if (log.recoveryFeeling === 3) {
    borderlineCount += 1;
  }
  if (log.stressLevel === 3) {
    borderlineCount += 1;
  }

  return borderlineCount > 0 ? 'moderate' : 'high';
};

const determineStatus = (overallScore: number | null): 'Optimal' | 'Stable' | 'At Risk' | 'No Data' => {
  if (overallScore === null) {
    return 'No Data';
  }

  if (overallScore >= 80) {
    return 'Optimal';
  }

  if (overallScore >= 60) {
    return 'Stable';
  }

  return 'At Risk';
};

const COMPONENT_LABELS: Record<HealthComponentKey, string> = {
  rec: 'Recovery',
  perf: 'Performance',
  met: 'Metabolic',
  cv: 'Cardiovascular',
  sh: 'Sexual Health',
};

const COMPONENT_WEIGHTS: Record<HealthComponentKey, number> = {
  rec: 0.25,
  perf: 0.2,
  met: 0.2,
  cv: 0.2,
  sh: 0.15,
};

const MEAL_TARGET_PER_WEEK = 7;
const TREND_THRESHOLD = 5;

const buildTrendSummary = (logs: DailyLogRecord[]): string => {
  if (logs.length === 0) {
    return 'Insufficient data to determine trends.';
  }

  const avg = <K extends keyof Pick<DailyLogRecord, 'sleepHours' | 'stressLevel' | 'recoveryFeeling'>>(key: K) =>
    logs.reduce((sum, log) => sum + log[key], 0) / logs.length;

  const avgSleep = avg('sleepHours');
  const avgStress = avg('stressLevel');
  const avgRecovery = avg('recoveryFeeling');

  const descriptors: string[] = [];

  descriptors.push(avgSleep < 6 ? 'Sleep trending low' : avgSleep > 7.5 ? 'Sleep trending high' : 'Sleep stable');
  descriptors.push(avgStress >= 4 ? 'Stress increasing' : avgStress <= 2 ? 'Stress easing' : 'Stress steady');
  descriptors.push(avgRecovery <= 2.5 ? 'Recovery trending low' : avgRecovery >= 4 ? 'Recovery strong' : 'Recovery stable');

  return descriptors.join(', ');
};

const toComponentStatus = (score: number | null): ComponentStatus => {
  if (score === null) {
    return 'At Risk';
  }
  if (score >= 80) {
    return 'Optimal';
  }
  if (score >= 60) {
    return 'Stable';
  }
  return 'At Risk';
};

const evaluateTrend = (series: number[]): ComponentTrend => {
  if (series.length <= 1) {
    return 'Stable';
  }

  const [current, ...rest] = series;
  const previousAverage = rest.reduce((sum, value) => sum + value, 0) / rest.length;
  const delta = current - previousAverage;

  if (delta >= TREND_THRESHOLD) {
    return 'Improving';
  }
  if (delta <= -TREND_THRESHOLD) {
    return 'Declining';
  }
  return 'Stable';
};

const computeRecoveryScore = (log: DailyLogRecord, baseline: BaselineConfig): number => {
  const sleepTarget = baseline.defaultSleepTarget > 0 ? baseline.defaultSleepTarget : 7.5;
  const sleepNorm = clamp(log.sleepHours / sleepTarget, 0, 1);
  const recoveryNorm = clamp((log.recoveryFeeling - 1) / 4, 0, 1);
  const sensitivity = clamp(baseline.recoverySensitivity, 0, 1);
  const stressTolerance = clamp(baseline.stressTolerance, 1, 5);

  let stressNorm = 1;
  if (log.stressLevel > stressTolerance) {
    const maxDelta = 5 - stressTolerance;
    stressNorm = clamp(1 - (log.stressLevel - stressTolerance) / (maxDelta || 1), 0, 1);
  }

  const recoveryWeight = 0.45 + 0.1 * sensitivity;
  const stressWeight = 0.2 - 0.1 * sensitivity;
  const sleepWeight = 1 - (recoveryWeight + stressWeight);

  const score =
    sleepNorm * 100 * sleepWeight + recoveryNorm * 100 * recoveryWeight + stressNorm * 100 * stressWeight;

  return Math.round(clamp(score, 0, 100));
};

const computePerformanceScore = (log: DailyLogRecord): { score: number; adherence: number; intensity: number; fatigue: number } => {
  const adherence = clamp(log.workoutAdherence, 0, 100);
  const intensity = Math.round(clamp(adherence * 0.7 + (log.recoveryFeeling - 1) * 6.25, 0, 100));
  const stressPenalty = clamp((log.stressLevel - 1) / 4, 0, 1);
  const recoveryPenalty = clamp((3 - (log.recoveryFeeling - 2)) / 6, 0, 1);
  const fatigueScore = Math.round(clamp((1 - (stressPenalty * 0.6 + recoveryPenalty * 0.4)) * 100, 0, 100));

  const score = Math.round(clamp(adherence * 0.6 + intensity * 0.2 + fatigueScore * 0.2, 0, 100));

  return { score, adherence: Math.round(adherence), intensity, fatigue: fatigueScore };
};

const computeMealFrequencyScore = (mealLogs: MealLogRecord[], referenceDate: Date): number => {
  const cutoff = new Date(referenceDate);
  cutoff.setDate(referenceDate.getDate() - 7);

  const recentCount = mealLogs.filter((meal) => {
    const takenAt = new Date(meal.takenAt);
    return !Number.isNaN(takenAt.getTime()) && takenAt >= cutoff && takenAt <= referenceDate;
  }).length;

  return Math.round(clamp((recentCount / MEAL_TARGET_PER_WEEK) * 100, 0, 100));
};

const computeMetabolicHistory = (mealLogs: MealLogRecord[], windows = 3): number[] => {
  const now = new Date();
  return Array.from({ length: windows }, (_, index) => {
    const windowEnd = new Date(now);
    windowEnd.setDate(now.getDate() - index * 7);
    return computeMealFrequencyScore(mealLogs, windowEnd);
  });
};

const computeCardioScore = (
  cardioMetrics: CardioMetricRecord[],
  recentLogs: DailyLogRecord[],
  reminders: ReminderListResponse,
): {
  score: number | null;
  trend: ComponentTrend;
  insights?: string[];
  recommendation?: string;
} => {
  if (cardioMetrics.length === 0) {
    const quarterlyDue = reminders.dueReminders.some((reminder) => reminder.reminderType === 'quarterly_bloodwork');
    return {
      score: null,
      trend: 'Stable',
      insights: quarterlyDue
        ? ['Quarterly bloodwork reminder is due—schedule labs to unlock cardiovascular tracking.']
        : ['No cardio vitals synced yet—log blood pressure and resting HR to activate scoring.'],
      recommendation: quarterlyDue
        ? 'Book your quarterly bloodwork and record the results to calibrate cardiovascular readiness.'
        : 'Capture resting HR and blood pressure readings this week to enable cardio insights.',
    };
  }

  const latest = cardioMetrics[0];
  const series = cardioMetrics.slice(0, 5);

  const avg = (values: number[]) => (values.length === 0 ? 0 : values.reduce((sum, value) => sum + value, 0) / values.length);

  const systolicScore = clamp((140 - latest.systolic) / 30, 0, 1);
  const diastolicScore = clamp((90 - latest.diastolic) / 20, 0, 1);
  const bloodPressureScore = systolicScore * 0.7 + diastolicScore * 0.3;

  const restingHrScore = clamp((80 - latest.restingHeartRate) / 25, 0, 1);

  const weightedScore = Math.round(clamp(bloodPressureScore * 0.6 + restingHrScore * 0.4, 0, 1) * 100);

  const trends = series.map((metric) => {
    const systolicComponent = clamp((140 - metric.systolic) / 30, 0, 1) * 0.7;
    const diastolicComponent = clamp((90 - metric.diastolic) / 20, 0, 1) * 0.3;
    const hrComponent = clamp((80 - metric.restingHeartRate) / 25, 0, 1) * 0.4;
    const bpComponent = (systolicComponent + diastolicComponent) * 0.6;
    return Math.round(clamp(bpComponent + hrComponent, 0, 1) * 100);
  });

  const trend = evaluateTrend(trends);

  const insights: string[] = [];
  if (latest.systolic >= 130 || latest.diastolic >= 85) {
    insights.push('Blood pressure elevated vs. optimal range.');
  } else if (latest.systolic <= 115 && latest.diastolic <= 75) {
    insights.push('Blood pressure trending within optimal range.');
  }

  if (latest.restingHeartRate >= 75) {
    insights.push('Resting heart rate elevated—monitor recovery and conditioning.');
  } else if (latest.restingHeartRate <= 62) {
    insights.push('Resting heart rate indicates strong conditioning.');
  }

  const logAvgStress = avg(recentLogs.map((log) => log.stressLevel));
  if (logAvgStress >= 4) {
    insights.push('High stress levels may be impacting cardiovascular readiness.');
  }

  const recommendation = weightedScore < 60
    ? 'Schedule consistent cardio sessions and consider breathwork to bring vitals back to baseline.'
    : weightedScore < 80
      ? 'Maintain steady cardio cadence and monitor vitals twice this week.'
      : 'Cardio vitals look strong—keep your conditioning rhythm and periodic monitoring.';

  return {
    score: clamp(weightedScore, 0, 100),
    trend,
    insights: insights.length > 0 ? insights : undefined,
    recommendation,
  };
};

const computeSexualHealthScore = (
  reminders: ReminderListResponse,
  checkIns: SexualHealthCheckInRecord[],
  latestStatus: SexualHealthStatusRecord | null,
): {
  score: number | null;
  trend: ComponentTrend;
  insights?: string[];
  recommendation?: string;
} => {
  const focusedReminders = reminders.reminders.filter((reminder) => reminder.reminderType === 'weekly_sexual_health');
  const total = focusedReminders.length;
  const due = reminders.dueReminders.filter((reminder) => reminder.reminderType === 'weekly_sexual_health').length;

  const reminderScore = total === 0 ? 0.7 : clamp((total - due) / total, 0, 1);

  if (checkIns.length === 0 && reminderScore === 0) {
    return {
      score: null,
      trend: 'Stable',
      insights: ['Log a weekly sexual health check-in to unlock tailored guidance.'],
      recommendation: 'Complete this week’s sexual health check-in to track libido and satisfaction trends.',
    };
  }

  const series = checkIns.slice(0, 5).map((entry) => {
    const desire = clamp((entry.desireLevel - 1) / 4, 0, 1);
    const satisfaction = clamp((entry.satisfactionLevel - 1) / 4, 0, 1);
    const stress = clamp((5 - entry.stressImpact) / 4, 0, 1);
    return Math.round((desire * 0.4 + satisfaction * 0.4 + stress * 0.2) * 100);
  });

  const latestComposite = series[0] ?? Math.round(reminderScore * 100);
  const blendedScore = Math.round(latestComposite * 0.7 + reminderScore * 30);
  const trend = evaluateTrend(series.length > 0 ? series : [blendedScore]);

  const insights: string[] = [];

  if (due > 0) {
    insights.push(`${due} sexual health reminder${due > 1 ? 's are' : ' is'} overdue.`);
  }

  if (latestStatus) {
    if (latestStatus.status === 'Concerned') {
      insights.push('Recent check-in flagged sexual health concerns.');
    } else if (latestStatus.status === 'Aligned') {
      insights.push('Sexual health status aligned with goals.');
    }
  }

  const latestCheckIn = checkIns[0];
  if (latestCheckIn) {
    if (latestCheckIn.stressImpact >= 4) {
      insights.push('Stress heavily impacting sexual health—consider recovery rituals.');
    }
    if (latestCheckIn.desireLevel <= 2) {
      insights.push('Desire score trending low—monitor energy, hormones, and connection rituals.');
    }
  }

  const recommendation = blendedScore < 60
    ? 'Plan a low-pressure connection ritual and align on stress reduction before the next check-in.'
    : blendedScore < 80
      ? 'Maintain weekly check-ins and discuss any lingering stressors impacting intimacy.'
      : 'Sexual health cadence looks strong—keep intentional connection and note any shifts early.';

  return {
    score: clamp(blendedScore, 0, 100),
    trend,
    insights: insights.length > 0 ? insights : undefined,
    recommendation,
  };
};

const buildRecoveryComponent = (
  baseline: BaselineConfig,
  logs: DailyLogRecord[],
): { component: HealthComponentScore; history: number[] } => {
  const history = logs.map((log) => computeRecoveryScore(log, baseline));
  const [currentScore] = history;

  const latestLog = logs[0];
  const insights: string[] = [];
  if (latestLog) {
    if (latestLog.sleepHours < baseline.defaultSleepTarget) {
      insights.push('Sleep below baseline target.');
    }
    if (latestLog.stressLevel >= 4) {
      insights.push('Elevated stress reported.');
    }
    if (latestLog.recoveryFeeling <= 2) {
      insights.push('Recovery feeling is low.');
    }
  }

  const component: HealthComponentScore = {
    key: 'rec',
    label: COMPONENT_LABELS.rec,
    score: currentScore ?? null,
    status: toComponentStatus(currentScore ?? null),
    trend: evaluateTrend(history),
    insights: insights.length > 0 ? insights : undefined,
  };

  return { component, history };
};

const buildPerformanceComponent = (logs: DailyLogRecord[]): { component: HealthComponentScore; history: number[] } => {
  const historyDetails = logs.map((log) => computePerformanceScore(log));
  const history = historyDetails.map((detail) => detail.score);
  const [latestDetail] = historyDetails;

  const insights: string[] = [];
  if (latestDetail) {
    if (latestDetail.adherence < 70) {
      insights.push('Workout adherence is below target.');
    }
    if (latestDetail.fatigue < 60) {
      insights.push('Fatigue indicators elevated.');
    }
  }

  const component: HealthComponentScore = {
    key: 'perf',
    label: COMPONENT_LABELS.perf,
    score: history[0] ?? null,
    status: toComponentStatus(history[0] ?? null),
    trend: evaluateTrend(history),
    insights: insights.length > 0 ? insights : undefined,
  };

  return { component, history };
};

const buildMetabolicComponent = (mealLogs: MealLogRecord[]): { component: HealthComponentScore; history: number[] } => {
  const history = computeMetabolicHistory(mealLogs);
  const fastingPlaceholder = 70;
  const stabilityPlaceholder = 70;
  const [currentFrequencyScore] = history;
  const compositeScore = currentFrequencyScore
    ? Math.round(currentFrequencyScore * 0.7 + fastingPlaceholder * 0.15 + stabilityPlaceholder * 0.15)
    : Math.round(fastingPlaceholder * 0.5 + stabilityPlaceholder * 0.5);

  const insights = [];
  if ((currentFrequencyScore ?? 0) < 50) {
    insights.push('Increase meal logging consistency.');
  }

  const component: HealthComponentScore = {
    key: 'met',
    label: COMPONENT_LABELS.met,
    score: history[0] ?? null,
    status: toComponentStatus(history[0] ?? null),
    trend: evaluateTrend(history),
    insights: insights.length > 0 ? insights : undefined,
  };

  // Reflect placeholder adjustments in score field
  component.score = compositeScore;
  component.status = toComponentStatus(component.score);

  return { component, history };
};

const buildCardioComponent = (
  cardioMetrics: CardioMetricRecord[],
  logs: DailyLogRecord[],
  reminders: ReminderListResponse,
): { component: HealthComponentScore; history: number[] } => {
  const result = computeCardioScore(cardioMetrics, logs, reminders);
  const history = cardioMetrics.slice(0, 5).map((metric) => {
    const bpScore = clamp((130 - metric.systolic) / 70, 0, 1) * 0.6 + clamp((75 - metric.restingHeartRate) / 45, 0, 1) * 0.4;
    return Math.round(bpScore * 100);
  });

  const component: HealthComponentScore = {
    key: 'cv',
    label: COMPONENT_LABELS.cv,
    score: result.score,
    status: toComponentStatus(result.score ?? null),
    trend: result.trend,
    insights: result.insights,
    recommendation: result.recommendation,
  };

  return { component, history };
};

const buildSexualHealthComponent = (
  reminders: ReminderListResponse,
  checkIns: SexualHealthCheckInRecord[],
  latestStatus: SexualHealthStatusRecord | null,
): { component: HealthComponentScore; history: number[] } => {
  const result = computeSexualHealthScore(reminders, checkIns, latestStatus);
  const history = checkIns.slice(0, 5).map((entry) => {
    const desire = clamp((entry.desireLevel - 1) / 4, 0, 1);
    const satisfaction = clamp((entry.satisfactionLevel - 1) / 4, 0, 1);
    const stress = clamp((5 - entry.stressImpact) / 4, 0, 1);
    return Math.round((desire * 0.4 + satisfaction * 0.4 + stress * 0.2) * 100);
  });

  if (history.length === 0 && result.score !== null) {
    history.push(result.score);
  }

  const component: HealthComponentScore = {
    key: 'sh',
    label: COMPONENT_LABELS.sh,
    score: result.score,
    status: toComponentStatus(result.score ?? null),
    trend: result.trend,
    insights: result.insights,
    recommendation: result.recommendation,
  };

  return { component, history };
};

const deriveOverallTrend = (components: HealthComponentScore[]): ComponentTrend => {
  const trendScore = components.reduce((total, component) => {
    const weight = COMPONENT_WEIGHTS[component.key];
    const trendValue = component.trend === 'Improving' ? 1 : component.trend === 'Declining' ? -1 : 0;
    return total + weight * trendValue;
  }, 0);

  if (trendScore >= 0.15) {
    return 'Improving';
  }
  if (trendScore <= -0.15) {
    return 'Declining';
  }
  return 'Stable';
};

const buildRecommendationSummary = (components: HealthComponentScore[]): string => {
  const atRisk = components.filter((component) => component.status === 'At Risk');
  const declining = components.filter((component) => component.trend === 'Declining');

  if (atRisk.length === 0 && declining.length === 0) {
    return 'Momentum is solid across domains. Sustain current routines and monitor for subtle trends.';
  }

  const focusComponents = atRisk.length > 0 ? atRisk : declining;
  const focusList = focusComponents.map((component) => component.label).join(', ');

  return `Focus today: ${focusList}. Address highlighted insights to rebalance.`;
};

const buildControlTowerSummary = (
  baseline: BaselineConfig,
  reminders: ReminderListResponse,
  mealLogs: MealLogRecord[],
  logs: DailyLogRecord[],
  cardioMetrics: CardioMetricRecord[],
  sexualCheckIns: SexualHealthCheckInRecord[],
  sexualStatus: SexualHealthStatusRecord | null,
): ControlTowerSummary => {
  const orderedLogs = [...logs];

  const { component: recComponent } = buildRecoveryComponent(baseline, orderedLogs);
  const { component: perfComponent } = buildPerformanceComponent(orderedLogs);
  const { component: metComponent } = buildMetabolicComponent(mealLogs);
  const { component: cvComponent } = buildCardioComponent(cardioMetrics, orderedLogs, reminders);
  const { component: shComponent } = buildSexualHealthComponent(reminders, sexualCheckIns, sexualStatus);

  const components: Record<HealthComponentKey, HealthComponentScore> = {
    rec: recComponent,
    perf: perfComponent,
    met: metComponent,
    cv: cvComponent,
    sh: shComponent,
  };

  const overallScoreRaw = (Object.values(components) as HealthComponentScore[]).reduce((total, component) => {
    const weight = COMPONENT_WEIGHTS[component.key];
    const score = component.score ?? 60;
    return total + weight * score;
  }, 0);

  const overallScore = Math.round(clamp(overallScoreRaw, 0, 100));
  const overallStatus = determineStatus(overallScore);
  const overallTrend = deriveOverallTrend(Object.values(components));
  const recommendationSummary = buildRecommendationSummary(Object.values(components));

  return {
    overallScore,
    overallStatus,
    overallTrend,
    components,
    recommendationSummary,
  };
};

const buildEmptyControlTowerSummary = (
  reminders: ReminderListResponse,
  mealLogs: MealLogRecord[],
  cardioMetrics: CardioMetricRecord[],
  sexualCheckIns: SexualHealthCheckInRecord[],
  sexualStatus: SexualHealthStatusRecord | null,
): ControlTowerSummary => {
  const recComponent: HealthComponentScore = {
    key: 'rec',
    label: COMPONENT_LABELS.rec,
    score: null,
    status: 'At Risk',
    trend: 'Stable',
    insights: ['Log sleep, stress, and recovery feelings to initialize recovery tracking.'],
  };

  const perfComponent: HealthComponentScore = {
    key: 'perf',
    label: COMPONENT_LABELS.perf,
    score: null,
    status: 'At Risk',
    trend: 'Stable',
    insights: ['Capture workout adherence and fatigue data to unlock performance insights.'],
  };

  const { component: metComponent } = buildMetabolicComponent(mealLogs);
  const { component: shComponent } = buildSexualHealthComponent(reminders, sexualCheckIns, sexualStatus);

  const cvComponent: HealthComponentScore = {
    key: 'cv',
    label: COMPONENT_LABELS.cv,
    score: null,
    status: 'At Risk',
    trend: 'Stable',
    insights: cardioMetrics.length > 0
      ? ['Cardio vitals captured but insufficient history to score yet.']
      : ['Sync resting HR and blood pressure readings to activate cardiovascular scoring.'],
  };

  return {
    overallScore: null,
    overallStatus: 'No Data',
    overallTrend: 'Stable',
    components: {
      rec: recComponent,
      perf: perfComponent,
      met: metComponent,
      cv: cvComponent,
      sh: shComponent,
    },
    recommendationSummary: 'Log your first entry to unlock personalized insights.',
  };
};

export const __testing = {
  buildControlTowerSummary,
  buildEmptyControlTowerSummary,
};

export const createDailyLog = async (log: DailyLogInput): Promise<DailyLogRecord> => {
  const logDate = log.date ?? new Date().toISOString().slice(0, 10);

  const payload = {
    id: randomUUID(),
    user_id: log.userId,
    date: logDate,
    sleep_hours: log.sleepHours,
    recovery_feeling: log.recoveryFeeling,
    stress_level: log.stressLevel,
    workout_adherence: log.workoutAdherence,
    notes: log.notes ?? null,
    embedding: placeholderEmbedding(),
  };

  const { data, error } = await supabase
    .from(TABLE_NAME)
    .insert(payload)
    .select()
    .single<DailyLogRow>();

  if (error) {
    console.error('Supabase insert error:', error);
    throw error;
  }

  return mapRowToRecord(data);
};

export const getDailyLogsForUser = async (userId: string, limit?: number): Promise<DailyLogRecord[]> => {
  const query = supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('user_id', userId)
    .order('date', { ascending: false });

  if (limit) {
    query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Supabase select error:', error);
    throw error;
  }

  const rows = (data as DailyLogRow[]) ?? [];
  return rows.map(mapRowToRecord);
};

export const getDailyLogById = async (logId: string): Promise<DailyLogRecord | null> => {
  const { data, error } = await supabase
    .from(TABLE_NAME)
    .select('*')
    .eq('id', logId)
    .single<DailyLogRow>();

  if (error) {
    console.error('Supabase fetch by id error:', error);
    throw error;
  }

  return data ? mapRowToRecord(data) : null;
};

export const getDashboardSummary = async (userId: string): Promise<DashboardSummary> => {
  const [baselineConfig, reminders, mealLogs, recentLogs, cardioMetrics, sexualCheckIns, sexualStatus] = await Promise.all([
    getBaselineConfig(userId),
    getRemindersForUser(userId),
    getMealLogsForUser(userId),
    getDailyLogsForUser(userId, 7),
    getRecentCardioMetrics(userId, 10),
    getRecentSexualHealthCheckIns(userId, 6),
    getLatestSexualHealthStatus(userId),
  ]);

  const controlTower =
    recentLogs.length === 0
      ? buildEmptyControlTowerSummary(reminders, mealLogs, cardioMetrics, sexualCheckIns, sexualStatus)
      : buildControlTowerSummary(
          baselineConfig,
          reminders,
          mealLogs,
          recentLogs,
          cardioMetrics,
          sexualCheckIns,
          sexualStatus,
        );

  if (recentLogs.length === 0) {
    logEvent({
      category: 'dashboard',
      message: 'Dashboard summary requested with no recent logs',
      metadata: { userId },
    });

    return {
      latestLog: null,
      recoveryScore: null,
      overallHealthScore: controlTower.overallScore,
      status: controlTower.overallStatus,
      dailyRecommendation: controlTower.recommendationSummary,
      trendSummary: 'Insufficient data to determine trends.',
      baselineConfig,
      controlTower,
    };
  }

  const latestLog = recentLogs[0];
  const recoveryScore = determineRecoveryScoreLabel(latestLog);
  const trendSummary = buildTrendSummary(recentLogs);

  logEvent({
    category: 'dashboard',
    message: 'Computed control tower summary',
    metadata: {
      userId,
      controlTower,
    },
  });

  logEvent({
    category: 'decision-engine',
    message: 'Evaluated health status',
    metadata: { userId, overallHealthScore: controlTower.overallScore, status: controlTower.overallStatus },
  });

  logEvent({
    category: 'recommendations',
    message: 'Generated daily recommendation summary',
    metadata: { userId, recommendationSummary: controlTower.recommendationSummary },
  });

  return {
    latestLog,
    recoveryScore,
    overallHealthScore: controlTower.overallScore,
    status: controlTower.overallStatus,
    dailyRecommendation: controlTower.recommendationSummary,
    trendSummary,
    baselineConfig,
    controlTower,
  };
};
