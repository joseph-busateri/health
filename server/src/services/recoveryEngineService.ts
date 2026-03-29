import { randomUUID } from 'crypto';

import { getDailyLogsForUser } from './structuredDailyLogService';
import { getEngineSnapshot } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import type {
  RecoveryReadiness,
  RecoveryRecord,
  RecoveryRecommendation,
  RecoverySourceInputs,
  RecoveryStatus,
} from '../types/recoveryEngine';

const recoveryStore = new Map<string, RecoveryRecord[]>();

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

const normalizeHrv = (value: number) => clamp(((value - 20) / 80) * 100, 0, 100);
const normalizeSleepDuration = (value: number) => clamp((value / 8) * 100, 0, 100);
const normalizeSleepQuality = (value: number) => clamp(((value - 1) / 4) * 100, 0, 100);
const normalizeRestingHr = (value: number) => clamp(((90 - value) / 40) * 100, 0, 100);
const normalizeStress = (value: number) => clamp(((5 - value) / 4) * 100, 0, 100);
const normalizeWorkoutLoad = (value: number) => clamp(((10 - value) / 10) * 100, 0, 100);
const normalizeVerbalRecovery = (value: number) => clamp(((value - 1) / 4) * 100, 0, 100);
const normalizeAdherence = (value: number) => clamp(value, 0, 100);

export const calculateRecoveryScore = (inputs: RecoverySourceInputs): number => {
  const weightedSignals: Array<{ score: number; weight: number }> = [];

  const addSignal = (raw: number | undefined, normalize: (value: number) => number, weight: number) => {
    if (raw == null || !Number.isFinite(raw)) {
      weightedSignals.push({ score: 65, weight });
      return;
    }
    weightedSignals.push({ score: normalize(raw), weight });
  };

  addSignal(inputs.hrv, normalizeHrv, 0.16);
  addSignal(inputs.sleepDurationHours, normalizeSleepDuration, 0.19);
  addSignal(inputs.sleepQuality, normalizeSleepQuality, 0.14);
  addSignal(inputs.restingHr, normalizeRestingHr, 0.14);
  addSignal(inputs.stressLevel, normalizeStress, 0.14);
  addSignal(inputs.workoutLoad, normalizeWorkoutLoad, 0.09);
  addSignal(inputs.verbalRecoveryFeeling, normalizeVerbalRecovery, 0.09);
  addSignal(inputs.adherenceScore, normalizeAdherence, 0.05);

  const totalWeight = weightedSignals.reduce((sum, signal) => sum + signal.weight, 0);
  const weightedScore = weightedSignals.reduce((sum, signal) => sum + signal.score * signal.weight, 0);

  return Math.round(clamp(weightedScore / totalWeight, 0, 100));
};

export const evaluateRecoveryStatus = (score: number): {
  recoveryStatus: RecoveryStatus;
  readinessClassification: RecoveryReadiness;
} => {
  if (score >= 75) {
    return {
      recoveryStatus: 'fully_recovered',
      readinessClassification: 'ready',
    };
  }

  if (score >= 45) {
    return {
      recoveryStatus: 'moderate_recovery',
      readinessClassification: 'caution',
    };
  }

  return {
    recoveryStatus: 'poor_recovery',
    readinessClassification: 'recovery_focus',
  };
};

export const generateRecoveryRecommendation = (
  status: RecoveryStatus,
  inputs: RecoverySourceInputs,
): RecoveryRecommendation => {
  if (status === 'fully_recovered') {
    return {
      summary: 'Recovery markers are strong. Proceed with normal training demand.',
      actions: [
        'Maintain sleep consistency and hydration.',
        'Keep planned training intensity unless symptoms change.',
      ],
    };
  }

  if (status === 'moderate_recovery') {
    const actions = [
      'Cap top-set intensity and extend warm-up by 5-10 minutes.',
      'Prioritize earlier bedtime and reduce evening stimulation.',
    ];

    if ((inputs.stressLevel ?? 0) >= 4) {
      actions.push('Add 10 minutes of down-regulation breathing or low-intensity walk.');
    }

    return {
      summary: 'Recovery is moderate. Use a conservative training approach today.',
      actions,
    };
  }

  const actions = [
    'Shift to recovery day or reduce session volume by 30-40%.',
    'Prioritize sleep opportunity and hydration/electrolytes.',
  ];

  if ((inputs.workoutLoad ?? 0) >= 8) {
    actions.push('Avoid additional high-load training until recovery rebounds.');
  }

  return {
    summary: 'Recovery is poor. Focus on restoration before high training stress.',
    actions,
  };
};

const mergeInputs = async (
  userId: string,
  override?: RecoverySourceInputs,
): Promise<RecoverySourceInputs> => {
  const source: RecoverySourceInputs = {
    ...override,
  };

  try {
    const latestLog = (await getDailyLogsForUser(userId, 1))[0];
    if (latestLog) {
      source.sleepDurationHours ??= latestLog.sleepHours;
      source.stressLevel ??= latestLog.stressLevel;
      source.verbalRecoveryFeeling ??= latestLog.recoveryFeeling;
      source.adherenceScore ??= latestLog.workoutAdherence;
    }
  } catch {
    // Gracefully continue when external source is unavailable.
  }

  const snapshot = await getEngineSnapshot(userId).catch(() => undefined);
  source.stressLevel ??= snapshot?.recoveryCluster?.stressScore != null
    ? Math.round(5 - (snapshot.recoveryCluster.stressScore / 100) * 4)
    : undefined;
  source.verbalRecoveryFeeling ??= snapshot?.recoveryCluster?.recoveryScore != null
    ? Math.round(1 + (snapshot.recoveryCluster.recoveryScore / 100) * 4)
    : undefined;
  source.adherenceScore ??= snapshot?.recoveryCluster?.adherenceScore ?? snapshot?.workout?.adherenceScore;

  return source;
};

export const getRecoveryToday = async (
  userId: string,
  options?: { regenerate?: boolean; override?: RecoverySourceInputs },
): Promise<RecoveryRecord> => {
  const date = new Date().toISOString().slice(0, 10);
  const existing = recoveryStore.get(userId)?.find(record => record.date === date);
  if (existing && !options?.regenerate) {
    return existing;
  }

  const sourceInputs = await mergeInputs(userId, options?.override);
  const recoveryScore = calculateRecoveryScore(sourceInputs);
  const { recoveryStatus, readinessClassification } = evaluateRecoveryStatus(recoveryScore);
  const recommendation = generateRecoveryRecommendation(recoveryStatus, sourceInputs);

  const record: RecoveryRecord = {
    id: randomUUID(),
    userId,
    date,
    recoveryScore,
    recoveryStatus,
    readinessClassification,
    sourceInputs,
    recommendation,
    createdAt: new Date().toISOString(),
  };

  const history = recoveryStore.get(userId) ?? [];
  recoveryStore.set(userId, [record, ...history]);

  await createChangeEvent({
    user_id: userId,
    entity_type: 'baseline_profile',
    entity_id: `recovery-engine-${userId}`,
    field_name: 'recovery_score',
    new_value: String(record.recoveryScore),
    change_source: 'agent_adjustment',
    rationale: `Recovery engine computed ${record.recoveryStatus}`,
    confidence: 0.88,
  }).catch(() => undefined);

  return record;
};

export const getRecoveryHistory = async (userId: string): Promise<RecoveryRecord[]> => {
  return recoveryStore.get(userId) ?? [];
};
