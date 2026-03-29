import { randomUUID } from 'crypto';

import { getDailyLogsForUser } from './structuredDailyLogService';
import { getEngineSnapshot } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import type { StressRecord, StressRecommendation, StressSourceInputs, StressStatus } from '../types/stressEngine';

const stressStore = new Map<string, StressRecord[]>();

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeInterviewStress = (value: number) => clamp(((value - 1) / 4) * 100, 0, 100);
const normalizeHrvToStress = (value: number) => clamp(100 - ((value - 20) / 80) * 100, 0, 100);
const normalizeSleepToStress = (value: number) => clamp(100 - (value / 8) * 100, 0, 100);
const normalizeWorkoutLoadToStress = (value: number) => clamp((value / 10) * 100, 0, 100);
const normalizeRecoveryToStress = (value: number) => clamp(100 - value, 0, 100);

export const calculateStressScore = (inputs: StressSourceInputs): number => {
  const weightedSignals: Array<{ score: number; weight: number }> = [];

  const addSignal = (raw: number | undefined, normalize: (value: number) => number, weight: number) => {
    if (raw == null || !Number.isFinite(raw)) {
      weightedSignals.push({ score: 50, weight });
      return;
    }
    weightedSignals.push({ score: normalize(raw), weight });
  };

  addSignal(inputs.interviewStressLevel, normalizeInterviewStress, 0.3);
  addSignal(inputs.hrv, normalizeHrvToStress, 0.2);
  addSignal(inputs.sleepDurationHours, normalizeSleepToStress, 0.2);
  addSignal(inputs.workoutLoad, normalizeWorkoutLoadToStress, 0.15);
  addSignal(inputs.recoveryScore, normalizeRecoveryToStress, 0.15);

  const totalWeight = weightedSignals.reduce((sum, signal) => sum + signal.weight, 0);
  const weightedScore = weightedSignals.reduce((sum, signal) => sum + signal.score * signal.weight, 0);

  return Math.round(clamp(weightedScore / totalWeight, 0, 100));
};

const scoreToStatus = (score: number): StressStatus => {
  if (score >= 70) {
    return 'high';
  }
  if (score >= 45) {
    return 'moderate';
  }
  return 'low';
};

export const evaluateCNSLoad = (inputs: StressSourceInputs, stressScore: number): StressStatus => {
  const workload = inputs.workoutLoad ?? 5;
  const hrv = inputs.hrv ?? 45;

  if (stressScore >= 70 || (workload >= 8 && hrv <= 35)) {
    return 'high';
  }

  if (stressScore >= 45 || workload >= 6 || hrv <= 45) {
    return 'moderate';
  }

  return 'low';
};

export const generateStressRecommendation = (
  stressStatus: StressStatus,
  cnsLoadStatus: StressStatus,
): StressRecommendation => {
  if (stressStatus === 'low' && cnsLoadStatus === 'low') {
    return {
      summary: 'Stress and CNS load are low. Training load can remain normal.',
      actions: [
        'Proceed with planned training intensity.',
        'Maintain sleep and recovery routines to keep stress low.',
      ],
    };
  }

  if (stressStatus === 'moderate' || cnsLoadStatus === 'moderate') {
    return {
      summary: 'Stress/CNS load is moderate. Use controlled intensity and prioritize recovery inputs.',
      actions: [
        'Reduce top-end intensity by ~10% for today.',
        'Add post-session down-regulation (breathing, walk, or mobility).',
      ],
    };
  }

  return {
    summary: 'Stress and/or CNS load are high. Prioritize restoration before heavy training.',
    actions: [
      'Shift to recovery-focused training or deload session.',
      'Increase sleep opportunity and reduce additional workload today.',
    ],
  };
};

const mergeInputs = async (userId: string, override?: StressSourceInputs): Promise<StressSourceInputs> => {
  const source: StressSourceInputs = {
    ...override,
  };

  try {
    const latestLog = (await getDailyLogsForUser(userId, 1))[0];
    if (latestLog) {
      source.interviewStressLevel ??= latestLog.stressLevel;
      source.sleepDurationHours ??= latestLog.sleepHours;
      source.workoutLoad ??= clamp(Math.round((latestLog.workoutAdherence / 100) * 10), 1, 10);
    }
  } catch {
    // Graceful fallback when daily log source is unavailable.
  }

  const snapshot = await getEngineSnapshot(userId).catch(() => undefined);
  source.interviewStressLevel ??= snapshot?.recoveryCluster?.stressScore != null
    ? Math.round(5 - (snapshot.recoveryCluster.stressScore / 100) * 4)
    : undefined;
  source.recoveryScore ??= snapshot?.recoveryCluster?.recoveryScore;
  source.workoutLoad ??= snapshot?.workout?.plannedSessions != null
    ? clamp(snapshot.workout.plannedSessions * 2, 1, 10)
    : undefined;

  return source;
};

export const getStressToday = async (
  userId: string,
  options?: { regenerate?: boolean; override?: StressSourceInputs },
): Promise<StressRecord> => {
  const date = new Date().toISOString().slice(0, 10);
  const existing = stressStore.get(userId)?.find(record => record.date === date);
  if (existing && !options?.regenerate) {
    return existing;
  }

  const sourceInputs = await mergeInputs(userId, options?.override);
  const stressScore = calculateStressScore(sourceInputs);
  const stressStatus = scoreToStatus(stressScore);
  const cnsLoadStatus = evaluateCNSLoad(sourceInputs, stressScore);
  const recommendation = generateStressRecommendation(stressStatus, cnsLoadStatus);

  const record: StressRecord = {
    id: randomUUID(),
    userId,
    date,
    stressScore,
    stressStatus,
    cnsLoadStatus,
    sourceInputs,
    recommendation,
    createdAt: new Date().toISOString(),
  };

  const history = stressStore.get(userId) ?? [];
  stressStore.set(userId, [record, ...history]);

  await createChangeEvent({
    user_id: userId,
    entity_type: 'baseline_profile',
    entity_id: `stress-engine-${userId}`,
    field_name: 'stress_score',
    new_value: String(record.stressScore),
    change_source: 'agent_adjustment',
    rationale: `Stress/CNS engine computed status ${record.stressStatus}/${record.cnsLoadStatus}`,
    confidence: 0.87,
  }).catch(() => undefined);

  return record;
};

export const getStressHistory = async (userId: string): Promise<StressRecord[]> => {
  return stressStore.get(userId) ?? [];
};
