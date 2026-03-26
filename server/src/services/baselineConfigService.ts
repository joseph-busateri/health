import type { BaselineConfig } from '../types/baselineConfig';

const baselineConfigStore = new Map<string, BaselineConfig>();

const DEFAULT_BASELINE: BaselineConfig = {
  userId: 'default',
  defaultSleepTarget: 7.5,
  stressTolerance: 3,
  recoverySensitivity: 0.5,
};

const sanitizeNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value;
  }

  if (typeof value === 'string') {
    const parsed = Number(value);
    if (!Number.isNaN(parsed)) {
      return parsed;
    }
  }

  return fallback;
};

export const getBaselineConfig = async (userId: string): Promise<BaselineConfig> => {
  if (!baselineConfigStore.has(userId)) {
    baselineConfigStore.set(userId, {
      ...DEFAULT_BASELINE,
      userId,
    });
  }

  return baselineConfigStore.get(userId)!;
};

export const upsertBaselineConfig = async (input: Partial<BaselineConfig> & { userId: string }): Promise<BaselineConfig> => {
  const existing = await getBaselineConfig(input.userId);

  const updated: BaselineConfig = {
    userId: input.userId,
    defaultSleepTarget: sanitizeNumber(input.defaultSleepTarget, existing.defaultSleepTarget),
    stressTolerance: sanitizeNumber(input.stressTolerance, existing.stressTolerance),
    recoverySensitivity: sanitizeNumber(input.recoverySensitivity, existing.recoverySensitivity),
  };

  baselineConfigStore.set(input.userId, updated);
  return updated;
};
