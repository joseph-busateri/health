import { randomUUID } from 'crypto';

import { getDailyLogsForUser } from './structuredDailyLogService';
import { getEngineSnapshot } from './engineStateService';
import { createChangeEvent } from './pointInTimeService';
import type {
  AdherenceDomainBreakdown,
  AdherenceInputs,
  AdherenceRecord,
  AdherenceRecommendation,
  AdherenceStatus,
  AdherenceTrend,
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

  const sourceInputs = await mergeInputs(userId, options?.override);
  const breakdown = trackAdherenceByDomain(sourceInputs);
  const adherenceScore = calculateAdherenceScore(breakdown);
  const history = adherenceStore.get(userId) ?? [];
  const trend = summarizeAdherenceTrend(history, adherenceScore);
  const recommendation = buildRecommendation(adherenceScore, trend);

  const record: AdherenceRecord = {
    id: randomUUID(),
    userId,
    date,
    adherenceScore,
    status: scoreToStatus(adherenceScore),
    breakdown,
    trend,
    recommendation,
    sourceInputs,
    createdAt: new Date().toISOString(),
  };

  adherenceStore.set(userId, [record, ...history]);

  await createChangeEvent({
    user_id: userId,
    entity_type: 'baseline_profile',
    entity_id: `adherence-engine-${userId}`,
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
