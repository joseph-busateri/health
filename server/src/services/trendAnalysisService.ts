import { logger } from '../utils/logger';
import type { TrendDirection, PredictiveSignal, TrendAnalysisInput, TrendAnalysisResult } from '../types/predictiveIntelligence';

function calculateTrend(values: number[]): TrendDirection {
  if (values.length < 2) return 'stable';

  const recentValues = values.slice(-3);
  if (recentValues.length < 2) return 'stable';

  let increasingCount = 0;
  let decreasingCount = 0;

  for (let i = 1; i < recentValues.length; i++) {
    const diff = recentValues[i] - recentValues[i - 1];
    if (diff > 2) increasingCount++;
    else if (diff < -2) decreasingCount++;
  }

  if (decreasingCount > increasingCount) return 'declining';
  if (increasingCount > decreasingCount) return 'improving';
  return 'stable';
}

function analyzeRecoveryTrend(history: Array<{ date: string; score: number }>): {
  trend: TrendDirection;
  signal: PredictiveSignal;
} {
  const values = history.map(h => h.score);
  const trend = calculateTrend(values);

  let interpretation = '';
  if (trend === 'declining') {
    interpretation = `Recovery has declined over ${values.length} days. Risk of overtraining increasing.`;
  } else if (trend === 'improving') {
    interpretation = `Recovery is improving over ${values.length} days. Training capacity increasing.`;
  } else {
    interpretation = `Recovery is stable over ${values.length} days. Maintain current approach.`;
  }

  return {
    trend,
    signal: {
      name: 'recoveryTrend',
      trend,
      values,
      interpretation,
    },
  };
}

function analyzeStressTrend(history: Array<{ date: string; score: number }>): {
  trend: TrendDirection;
  signal: PredictiveSignal;
} {
  const values = history.map(h => h.score);
  const trend = calculateTrend(values);

  let interpretation = '';
  if (trend === 'improving') {
    interpretation = `Stress has increased over ${values.length} days. CNS fatigue risk rising.`;
  } else if (trend === 'declining') {
    interpretation = `Stress is decreasing over ${values.length} days. Recovery capacity improving.`;
  } else {
    interpretation = `Stress is stable over ${values.length} days. Continue monitoring.`;
  }

  const stressTrend = trend === 'improving' ? 'declining' : trend === 'declining' ? 'improving' : 'stable';

  return {
    trend: stressTrend,
    signal: {
      name: 'stressTrend',
      trend: stressTrend,
      values,
      interpretation,
    },
  };
}

function analyzeJointTrend(history: Array<{ date: string; riskLevel: string }>): {
  trend: TrendDirection;
  signal: PredictiveSignal;
} {
  const riskMapping: Record<string, number> = {
    low: 1,
    moderate: 2,
    high: 3,
  };

  const values = history.map(h => riskMapping[h.riskLevel] ?? 1);
  const trend = calculateTrend(values);

  let interpretation = '';
  if (trend === 'improving') {
    interpretation = `Joint pain/risk has increased over ${values.length} days. Injury risk escalating.`;
  } else if (trend === 'declining') {
    interpretation = `Joint health is improving over ${values.length} days. Continue current protocols.`;
  } else {
    interpretation = `Joint status is stable over ${values.length} days. Maintain vigilance.`;
  }

  const jointTrend = trend === 'improving' ? 'declining' : trend === 'declining' ? 'improving' : 'stable';

  return {
    trend: jointTrend,
    signal: {
      name: 'jointTrend',
      trend: jointTrend,
      values,
      interpretation,
    },
  };
}

export function analyzeTrends(input: TrendAnalysisInput): TrendAnalysisResult {
  logger.info('🔵 Starting trend analysis', {
    recoveryDays: input.recoveryHistory.length,
    stressDays: input.stressHistory.length,
    jointDays: input.jointHistory.length,
  });

  const recovery = analyzeRecoveryTrend(input.recoveryHistory);
  const stress = analyzeStressTrend(input.stressHistory);
  const joint = analyzeJointTrend(input.jointHistory);

  const signals = [recovery.signal, stress.signal, joint.signal];

  logger.info('✅ Trend analysis complete', {
    recoveryTrend: recovery.trend,
    stressTrend: stress.trend,
    jointTrend: joint.trend,
  });

  return {
    recoveryTrend: recovery.trend,
    stressTrend: stress.trend,
    jointTrend: joint.trend,
    signals,
  };
}
